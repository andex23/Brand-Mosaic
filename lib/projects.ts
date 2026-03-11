import {
  supabase,
  BrandResultRecord,
  ExportRecord,
  ProjectRecord,
  ProjectStatusRecord,
  QuestionnaireAnswerRecord,
} from './supabase';
import {
  BrandFormData,
  BrandKit,
  BrandKitLocks,
  BrandProject,
  BrandProjectWorkspace,
  SavedBrandResult,
} from '../types';
import {
  answersToFormData,
  formDataToAnswerRows,
  getProjectBrandName,
  getWorkbookProgress,
} from './brandWorkbook';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  return supabase;
};

const mapResult = (record: BrandResultRecord): SavedBrandResult => ({
  id: record.id,
  projectId: record.project_id,
  result: record.result_json as BrandKit,
  logoImageUrl: record.generated_logo_url,
  logoGeneratedAt: record.generated_logo_at,
  sourceModel: record.source_model,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const mapProject = (
  record: ProjectRecord,
  options?: {
    latestResult?: BrandResultRecord | null;
    answeredCount?: number;
    totalPromptCount?: number;
    completionPercent?: number;
    resultCount?: number;
  }
): BrandProject => ({
  id: record.id,
  userId: record.user_id,
  brandName: record.brand_name,
  status: record.status,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  kitLocks: (record.kit_locks as BrandKitLocks) || {},
  answeredCount: options?.answeredCount || 0,
  totalPromptCount: options?.totalPromptCount || 0,
  completionPercent: options?.completionPercent || 0,
  resultCount: options?.resultCount || 0,
  latestResult: options?.latestResult ? mapResult(options.latestResult) : null,
});

const getResultSummaryForProjects = async (projectIds: string[]) => {
  if (projectIds.length === 0) {
    return {
      latestByProjectId: new Map<string, BrandResultRecord>(),
      countByProjectId: new Map<string, number>(),
    };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('brand_results')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const latestByProjectId = new Map<string, BrandResultRecord>();
  const countByProjectId = new Map<string, number>();

  (data as BrandResultRecord[] | null)?.forEach((result) => {
    countByProjectId.set(result.project_id, (countByProjectId.get(result.project_id) || 0) + 1);

    if (!latestByProjectId.has(result.project_id)) {
      latestByProjectId.set(result.project_id, result);
    }
  });

  return {
    latestByProjectId,
    countByProjectId,
  };
};

const getAnswerProgressForProjects = async (projectIds: string[]) => {
  if (projectIds.length === 0) {
    return new Map<
      string,
      {
        answeredCount: number;
        totalPromptCount: number;
        completionPercent: number;
      }
    >();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('questionnaire_answers')
    .select('project_id, question_key, answer')
    .in('project_id', projectIds);

  if (error) {
    throw error;
  }

  const groupedRows = new Map<string, QuestionnaireAnswerRecord[]>();

  (data as QuestionnaireAnswerRecord[] | null)?.forEach((row) => {
    if (!groupedRows.has(row.project_id)) {
      groupedRows.set(row.project_id, []);
    }

    groupedRows.get(row.project_id)?.push(row);
  });

  const progressByProject = new Map<
    string,
    {
      answeredCount: number;
      totalPromptCount: number;
      completionPercent: number;
    }
  >();

  groupedRows.forEach((rows, projectId) => {
    progressByProject.set(projectId, getWorkbookProgress(answersToFormData(rows)));
  });

  return progressByProject;
};

export const listProjects = async (userId: string): Promise<BrandProject[]> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  const projectRecords = (data || []) as ProjectRecord[];
  const projectIds = projectRecords.map((project) => project.id);
  const [{ latestByProjectId, countByProjectId }, progressByProject] = await Promise.all([
    getResultSummaryForProjects(projectIds),
    getAnswerProgressForProjects(projectIds),
  ]);

  return projectRecords.map((project) => {
    const progress = progressByProject.get(project.id) || {
      answeredCount: 0,
      totalPromptCount: 0,
      completionPercent: 0,
    };

    return mapProject(project, {
      latestResult: latestByProjectId.get(project.id) || null,
      answeredCount: progress.answeredCount,
      totalPromptCount: progress.totalPromptCount,
      completionPercent: progress.completionPercent,
      resultCount: countByProjectId.get(project.id) || 0,
    });
  });
};

export const createProject = async (
  userId: string,
  brandName = 'New Brand Workbook'
): Promise<BrandProject> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('projects')
    .insert({
      user_id: userId,
      brand_name: brandName,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapProject(data as ProjectRecord, {
    answeredCount: 0,
    totalPromptCount: 0,
    completionPercent: 0,
    resultCount: 0,
  });
};

export const loadProjectWorkspace = async (
  projectId: string
): Promise<BrandProjectWorkspace | null> => {
  const client = requireSupabase();

  const { data: projectData, error: projectError } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    if (projectError.code === 'PGRST116') {
      return null;
    }

    throw projectError;
  }

  const { data: answersData, error: answersError } = await client
    .from('questionnaire_answers')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (answersError) {
    throw answersError;
  }

  const { data: resultData, error: resultError } = await client
    .from('brand_results')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (resultError) {
    throw resultError;
  }

  const resultHistory = ((resultData || []) as BrandResultRecord[]).map(mapResult);
  const latestResult = resultHistory[0] || null;
  const formData = answersToFormData((answersData || []) as QuestionnaireAnswerRecord[]);
  const progress = getWorkbookProgress(formData);

  return {
    project: mapProject(projectData as ProjectRecord, {
      latestResult: (resultData as BrandResultRecord[] | null)?.[0] || null,
      answeredCount: progress.answeredCount,
      totalPromptCount: progress.totalPromptCount,
      completionPercent: progress.completionPercent,
      resultCount: resultHistory.length,
    }),
    formData,
    latestResult,
    resultHistory,
  };
};

export const saveQuestionnaireAnswers = async (
  projectId: string,
  formData: BrandFormData,
  options?: {
    status?: ProjectStatusRecord;
  }
): Promise<void> => {
  const client = requireSupabase();
  const rows = formDataToAnswerRows(projectId, formData);

  const { error: answersError } = await client
    .from('questionnaire_answers')
    .upsert(rows, {
      onConflict: 'project_id,section_key,question_key',
    });

  if (answersError) {
    throw answersError;
  }

  const updates: {
    brand_name: string;
    status?: ProjectStatusRecord;
  } = {
    brand_name: getProjectBrandName(formData),
  };

  if (options?.status) {
    updates.status = options.status;
  }

  const { error: projectError } = await client
    .from('projects')
    .update(updates)
    .eq('id', projectId);

  if (projectError) {
    throw projectError;
  }
};

export const updateProjectStatus = async (
  projectId: string,
  status: ProjectStatusRecord
): Promise<void> => {
  const client = requireSupabase();
  const { error } = await client
    .from('projects')
    .update({ status })
    .eq('id', projectId);

  if (error) {
    throw error;
  }
};

export const updateProjectKitLocks = async (
  projectId: string,
  kitLocks: BrandKitLocks
): Promise<void> => {
  const client = requireSupabase();
  const { error } = await client
    .from('projects')
    .update({ kit_locks: kitLocks })
    .eq('id', projectId);

  if (error) {
    throw error;
  }
};

export const saveBrandResult = async (
  projectId: string,
  result: BrandKit,
  sourceModel?: string
): Promise<SavedBrandResult> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('brand_results')
    .insert({
      project_id: projectId,
      result_json: result,
      source_model: sourceModel || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapResult(data as BrandResultRecord);
};

export const updateBrandResult = async (
  resultId: string,
  result: BrandKit
): Promise<SavedBrandResult> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('brand_results')
    .update({
      result_json: result,
    })
    .eq('id', resultId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapResult(data as BrandResultRecord);
};

export const saveGeneratedLogo = async (
  resultId: string,
  logoUrl: string
): Promise<SavedBrandResult> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('brand_results')
    .update({
      generated_logo_url: logoUrl,
      generated_logo_at: new Date().toISOString(),
    })
    .eq('id', resultId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapResult(data as BrandResultRecord);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const client = requireSupabase();
  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw error;
  }
};

export const duplicateProject = async (projectId: string): Promise<string> => {
  const client = requireSupabase();
  const { data, error } = await client.rpc('duplicate_project', {
    p_project_id: projectId,
    p_copy_latest_result: true,
  });

  if (error) {
    throw error;
  }

  return data as string;
};

export const recordExport = async (params: {
  projectId: string;
  brandResultId?: string | null;
  exportType: ExportRecord['export_type'];
  fileName?: string;
  exportUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  const client = requireSupabase();
  const { error } = await client
    .from('exports')
    .insert({
      project_id: params.projectId,
      brand_result_id: params.brandResultId || null,
      export_type: params.exportType,
      file_name: params.fileName || null,
      export_url: params.exportUrl || null,
      metadata: params.metadata || {},
    });

  if (error) {
    throw error;
  }
};

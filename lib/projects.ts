import { supabase, BrandProject as SupabaseBrandProject } from './supabase';
import { BrandFormData, BrandKit } from '../types';

export interface ProjectCreateData {
  user_id: string;
  name: string;
  form_data: BrandFormData;
}

export interface ProjectUpdateData {
  name?: string;
  form_data?: BrandFormData;
  brand_kit?: BrandKit;
  logo_image_url?: string;
}

// Convert Supabase project to app project format
const convertToAppProject = (supabaseProject: SupabaseBrandProject) => {
  return {
    id: supabaseProject.id,
    name: supabaseProject.name,
    createdAt: new Date(supabaseProject.created_at).getTime(),
    formData: supabaseProject.form_data,
    brandKit: supabaseProject.brand_kit,
    logoImageUrl: supabaseProject.logo_image_url,
    logoGeneratedAt: supabaseProject.logo_generated_at,
  };
};

export const createProject = async (
  userId: string,
  name: string,
  formData: BrandFormData
): Promise<string | null> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('brand_projects')
      .insert({
        user_id: userId,
        name,
        form_data: formData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return data.id;
  } catch (err) {
    console.error('Error in createProject:', err);
    throw err;
  }
};

export const updateProject = async (
  projectId: string,
  updates: ProjectUpdateData
): Promise<boolean> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('brand_projects')
      .update({
        ...updates,
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Error in updateProject:', err);
    throw err;
  }
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('brand_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Error in deleteProject:', err);
    throw err;
  }
};

export const loadProjects = async (userId: string): Promise<any[]> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('brand_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      throw error;
    }

    return (data || []).map(convertToAppProject);
  } catch (err) {
    console.error('Error in loadProjects:', err);
    throw err;
  }
};

export const saveBrandKit = async (
  projectId: string,
  brandKit: BrandKit
): Promise<boolean> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('brand_projects')
      .update({
        brand_kit: brandKit,
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error saving brand kit:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Error in saveBrandKit:', err);
    throw err;
  }
};

export const saveLogoToProject = async (
  projectId: string,
  logoUrl: string
): Promise<boolean> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('brand_projects')
      .update({
        logo_image_url: logoUrl,
        logo_generated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error saving logo:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Error in saveLogoToProject:', err);
    throw err;
  }
};

// Migrate projects from localStorage to Supabase
export const migrateLocalProjects = async (
  userId: string,
  localProjects: any[]
): Promise<number> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  let migratedCount = 0;

  for (const project of localProjects) {
    try {
      // Check if project already exists (by matching name and creation time)
      const { data: existing } = await supabase
        .from('brand_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('name', project.name)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Project "${project.name}" already exists, skipping`);
        continue;
      }

      // Create new project
      await createProject(userId, project.name, project.formData);

      // If it has a brand kit, update it
      if (project.brandKit) {
        const { data: newProject } = await supabase
          .from('brand_projects')
          .select('id')
          .eq('user_id', userId)
          .eq('name', project.name)
          .single();

        if (newProject) {
          await saveBrandKit(newProject.id, project.brandKit);
        }
      }

      migratedCount++;
    } catch (err) {
      console.error(`Error migrating project "${project.name}":`, err);
    }
  }

  return migratedCount;
};







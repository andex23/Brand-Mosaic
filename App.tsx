import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BrandFormPage from './components/BrandFormPage';
import BrandKit from './components/BrandKit';
import HomePage from './components/HomePage';
import ConfirmDialog from './components/ConfirmDialog';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorToast from './components/ErrorToast';
import ProjectResultState from './components/ProjectResultState';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useError } from './hooks/useError';
import { ThemeProvider } from './hooks/useTheme';
import {
  BrandAiAttemptFailure,
  BrandAiRequestError,
  getBrandAiDocs,
  getBrandAiProviderChain,
  getBrandAiProviderLabel,
} from './lib/brandAi';
import { generateBrandKit, regenerateBrandSection } from './lib/brandGeneration';
import { getProjectBrandName } from './lib/brandWorkbook';
import {
  BrandProject,
  BrandProjectWorkspace,
  BrandKitLocks,
  GenerationStatusNotice,
  KitSectionId,
  RegenerableKitSectionId,
} from './types';
import {
  createProject,
  deleteProject,
  duplicateProject,
  listProjects,
  loadProjectWorkspace,
  recordExport,
  saveGeneratedLogo,
  saveQuestionnaireAnswers,
  updateProjectKitLocks,
  updateProjectStatus,
} from './lib/projects';
import { openBrandKitPdfExport } from './lib/brandExport';

const LoadingPage: React.FC<{ label?: string }> = ({ label = '[ LOADING MOSAIC... ]' }) => (
  <div className="brand-page app-loading-state">{label}</div>
);

const idleGenerationStatus: GenerationStatusNotice = {
  phase: 'idle',
};

const MissingProjectState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="brand-page project-missing-state">
      <div className="project-missing-card">
        <h2>[ PROJECT NOT FOUND ]</h2>
        <p>This workbook is unavailable or does not belong to the signed-in account.</p>
        <button className="brand-submit-btn" onClick={() => navigate('/dashboard')}>
          [ BACK TO DASHBOARD ]
        </button>
      </div>
    </div>
  );
};

const getInterruptedGenerationStatus = (): GenerationStatusNotice => ({
  phase: 'failed',
  title: 'The last generation attempt did not finish saving.',
  message:
    'This workbook was left in a generating state, but no result was stored. Your answers are still here.',
  notes: [
    'Review the workbook and retry once the provider is available.',
    'If the issue was provider quota, the next attempt will succeed only after quota is available again.',
  ],
});

const getProviderChainLabel = () =>
  getBrandAiProviderChain().map((provider) => getBrandAiProviderLabel(provider)).join(' -> ');

const getAttemptNote = (attempt: BrandAiAttemptFailure): string => {
  const label = getBrandAiProviderLabel(attempt.provider);

  switch (attempt.code) {
    case 'key-not-found':
      return `${label} is not configured for this app.`;
    case 'invalid-key':
      return `${label} rejected the configured API key.`;
    case 'quota-exceeded':
      return `${label} reported that quota or credits are unavailable.`;
    case 'rate-limit':
      return `${label} rate-limited the request before a result was returned.`;
    default:
      return `${label}: ${attempt.message}`;
  }
};

const getAttemptAction = (attempt: BrandAiAttemptFailure) => {
  const docs = getBrandAiDocs(attempt.provider);
  const label = getBrandAiProviderLabel(attempt.provider);

  switch (attempt.code) {
    case 'key-not-found':
    case 'invalid-key':
      return {
        actionHref: docs.keys,
        actionLabel: `Review ${label} API setup`,
      };
    case 'quota-exceeded':
      return {
        actionHref: docs.quota,
        actionLabel: `Review ${label} quota`,
      };
    default:
      return undefined;
  }
};

const resolveBrandAiError = (
  error: BrandAiRequestError
): {
  errorCode: string;
  toastMessage?: string;
  persistentToast?: boolean;
  status: GenerationStatusNotice;
} => {
  const attempts = error.attempts;
  const notes = [
    `Provider chain tried: ${getProviderChainLabel()}.`,
    ...attempts.map((attempt) => getAttemptNote(attempt)),
  ];
  const actionableAttempt =
    attempts.find((attempt) => attempt.code !== 'generation-failed') || attempts[0];
  const action = actionableAttempt ? getAttemptAction(actionableAttempt) : undefined;

  switch (error.code) {
    case 'key-not-found':
      return {
        errorCode: 'api/key-not-found',
        persistentToast: true,
        status: {
          phase: 'failed',
          title: 'Brand generation is not configured for this app yet.',
          message:
            'The workbook draft was saved, but no model provider key is currently available to generate the result.',
          notes,
          ...action,
        },
      };
    case 'invalid-key':
      return {
        errorCode: 'api/invalid-key',
        persistentToast: true,
        status: {
          phase: 'failed',
          title: 'The configured model provider rejected the API credentials.',
          message:
            'Generation stopped before a result was saved. The workbook draft is still intact.',
          notes,
          ...action,
        },
      };
    case 'quota-exceeded':
      return {
        errorCode: 'api/quota-exceeded',
        toastMessage: 'Generation stopped because the configured model provider has no available quota.',
        persistentToast: true,
        status: {
          phase: 'failed',
          title: 'The active model provider could not run because quota is unavailable.',
          message:
            'Brand Mosaic saved the latest workbook answers, but no provider in the fallback chain returned a usable result.',
          notes,
          ...action,
        },
      };
    case 'rate-limit':
      return {
        errorCode: 'api/rate-limit',
        status: {
          phase: 'failed',
          title: 'The model provider asked this app to slow down.',
          message:
            'The request reached the provider chain, but a usable result was not returned before the request was blocked.',
          notes,
          ...action,
        },
      };
    default:
      return {
        errorCode: 'api/generation-failed',
        status: {
          phase: 'failed',
          title: 'Brand generation stopped before the result was saved.',
          message:
            'The workbook draft is still safe, but the provider chain did not return a usable brand result this time.',
          notes,
          ...action,
        },
      };
  }
};

const resolveGenerationError = (
  error: unknown,
  fallbackCode: string = 'api/generation-failed'
): {
  errorCode: string;
  toastMessage?: string;
  persistentToast?: boolean;
  status: GenerationStatusNotice;
} => {
  if (error instanceof BrandAiRequestError) {
    return resolveBrandAiError(error);
  }

  const message = error instanceof Error ? error.message : '';

  if (
    message.includes('API key') ||
    message.includes('401') ||
    message.toLowerCase().includes('unauthorized')
  ) {
    return {
      errorCode: 'api/invalid-key',
      persistentToast: true,
      status: {
        phase: 'failed',
        title: 'The configured model provider rejected the API credentials.',
        message:
          'Generation stopped before a result was saved. The workbook draft is still intact.',
        notes: [
          `Check the provider chain configured for this app: ${getProviderChainLabel()}.`,
          'If you change env vars locally, restart the dev server before trying again.',
        ],
      },
    };
  }

  if (
    message.includes('Insufficient credits') ||
    message.includes('purchase credits') ||
    message.includes('402')
  ) {
    return {
      errorCode: 'api/quota-exceeded',
      toastMessage: 'Generation stopped because the configured model provider has no available quota.',
      persistentToast: true,
      status: {
        phase: 'failed',
        title: 'The active model provider has no available quota.',
        message:
          'Brand Mosaic saved the latest workbook answers, but the provider stopped before a result could be written back.',
        notes: [
          `Review the configured provider chain for this app: ${getProviderChainLabel()}.`,
          'After quota is available, return to this workbook and use [ GENERATE BRAND KIT ] again.',
          'Nothing in the workbook was lost.',
        ],
      },
    };
  }

  if (message.includes('rate limit') || message.includes('429')) {
    return {
      errorCode: 'api/rate-limit',
      status: {
        phase: 'failed',
        title: 'The model provider asked this app to slow down.',
        message:
          'The request reached the provider, but it was rate-limited before a result could be returned.',
        notes: [
          'Wait a short moment, then retry generation from this workbook.',
          'Your saved answers are already in place.',
        ],
      },
    };
  }

  return {
    errorCode: fallbackCode,
    status: {
      phase: 'failed',
      title: 'Brand generation stopped before the result was saved.',
      message:
        'The workbook draft is still safe, but the provider did not return a usable brand result this time.',
      notes: [
        'Try the generate step again from this workbook.',
        'If the issue repeats, verify the provider account and network connection before retrying.',
      ],
    },
  };
};

const handleGenerationError = (
  error: unknown,
  showError: (
    errorCode: string,
    options?: { message?: string; persistent?: boolean }
  ) => void,
  fallbackCode: string = 'api/generation-failed'
) => {
  const resolution = resolveGenerationError(error, fallbackCode);
  showError(resolution.errorCode, {
    message: resolution.toastMessage,
    persistent: resolution.persistentToast,
  });
  return resolution.status;
};

const DashboardRoute: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toasts, showError, showSuccess, removeToast } = useError();
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<BrandProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const nextProjects = await listProjects(user.id);
      setProjects(nextProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      showError('db/load-failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.id]);

  const handleCreateNew = async () => {
    if (!user) return;

    try {
      const project = await createProject(user.id);
      navigate(`/project/${project.id}/questions`);
    } catch (error) {
      console.error('Failed to create project:', error);
      showError('db/save-failed');
    }
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      const newProjectId = await duplicateProject(projectId);
      showSuccess('Workbook duplicated.');
      await loadDashboard();
      navigate(`/project/${newProjectId}`);
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      showError('db/save-failed');
    }
  };

  const handleDelete = (projectId: string) => {
    const targetProject = projects.find((project) => project.id === projectId) || null;
    setPendingDeleteProject(targetProject);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteProject) return;

    setIsDeleting(true);
    try {
      await deleteProject(pendingDeleteProject.id);
      showSuccess('Workbook deleted.');
      setPendingDeleteProject(null);
      await loadDashboard();
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('db/delete-failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to sign out:', error);
      showError('unknown', { message: 'Could not sign out right now. Please try again.' });
    }
  };

  return (
    <>
      <ErrorToast toasts={toasts} onDismiss={removeToast} />
      <ConfirmDialog
        open={Boolean(pendingDeleteProject)}
        title="[ DELETE WORKBOOK? ]"
        message={
          pendingDeleteProject
            ? `Delete "${pendingDeleteProject.brandName}" and remove its answers, saved results, and exports from this account?`
            : ''
        }
        confirmLabel="[ DELETE FOR GOOD ]"
        cancelLabel="[ KEEP WORKBOOK ]"
        tone="danger"
        isWorking={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setPendingDeleteProject(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
      <Dashboard
        projects={projects}
        userEmail={user?.email}
        userName={profile?.full_name}
        isLoading={loading}
        onCreateNew={handleCreateNew}
        onOpenQuestions={(projectId) => navigate(`/project/${projectId}/questions`)}
        onOpenResult={(projectId) => navigate(`/project/${projectId}/result`)}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSignOut={handleSignOut}
      />
    </>
  );
};

const ProjectIndexRoute: React.FC = () => {
  const { projectId } = useParams();
  const [workspace, setWorkspace] = useState<BrandProjectWorkspace | null>();

  useEffect(() => {
    if (!projectId) return;

    loadProjectWorkspace(projectId)
      .then((nextWorkspace) => setWorkspace(nextWorkspace))
      .catch((error) => {
        console.error('Failed to load project:', error);
        setWorkspace(null);
      });
  }, [projectId]);

  if (workspace === undefined) {
    return <LoadingPage />;
  }

  if (!workspace || !projectId) {
    return <MissingProjectState />;
  }

  if (workspace.project.status === 'generated' && workspace.latestResult) {
    return <Navigate to={`/project/${projectId}/result`} replace />;
  }

  return <Navigate to={`/project/${projectId}/questions`} replace />;
};

const ProjectQuestionsRoute: React.FC = () => {
  const { projectId } = useParams();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toasts, showError, showSuccess, removeToast } = useError();
  const [workspace, setWorkspace] = useState<BrandProjectWorkspace | null>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatusNotice>(idleGenerationStatus);

  const loadWorkspace = async () => {
    if (!projectId) return;

    try {
      const nextWorkspace = await loadProjectWorkspace(projectId);
      setWorkspace(nextWorkspace);
      if (nextWorkspace?.project.status === 'generating' && !nextWorkspace.latestResult) {
        setGenerationStatus(getInterruptedGenerationStatus());
      } else {
        setGenerationStatus(idleGenerationStatus);
      }
    } catch (error) {
      console.error('Failed to load project workspace:', error);
      showError('db/load-failed');
      setWorkspace(null);
      setGenerationStatus(idleGenerationStatus);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [projectId]);

  if (workspace === undefined) {
    return <LoadingPage />;
  }

  if (!workspace || !projectId) {
    return <MissingProjectState />;
  }

  const handleSaveDraft = async (formData: BrandProjectWorkspace['formData']) => {
    try {
      await saveQuestionnaireAnswers(projectId, formData, { status: 'draft' });
      setWorkspace((current) =>
        current
          ? {
              ...current,
              formData,
              project: {
                ...current.project,
                brandName: getProjectBrandName(formData),
                status: 'draft',
              },
            }
          : current
      );
    } catch (error) {
      console.error('Failed to save questionnaire answers:', error);
      showError('db/save-failed');
      throw error;
    }
  };

  const handleGenerate = async (formData: BrandProjectWorkspace['formData']) => {
    setIsAnalyzing(true);
    setGenerationStatus({
      phase: 'saving',
      title: 'Saving the latest workbook answers first.',
      message:
        'Brand Mosaic stores the current draft before it asks the model to synthesize the brand as a whole.',
      notes: ['Keep this tab open until the result has been saved back to the project.'],
    });

    try {
      await saveQuestionnaireAnswers(projectId, formData, { status: 'draft' });
      setWorkspace((current) =>
        current
          ? {
              ...current,
              formData,
              project: {
                ...current.project,
                brandName: getProjectBrandName(formData),
                status: 'draft',
              },
            }
          : current
      );
      await updateProjectStatus(projectId, 'generating');
      setWorkspace((current) =>
        current
          ? {
              ...current,
              formData,
              project: {
                ...current.project,
                brandName: getProjectBrandName(formData),
                status: 'generating',
              },
            }
          : current
      );
      setGenerationStatus({
        phase: 'synthesizing',
        title: 'Synthesizing the brand direction from the full answer set.',
        message:
          'All workbook sections are being cross-referenced before Brand Mosaic writes any result section.',
        notes: ['This can take a moment while the model provider responds.'],
      });

      const savedResult = await generateBrandKit(projectId);
      setGenerationStatus({
        phase: 'persisting',
        title: 'Saving the generated brand kit to this workbook.',
        message:
          'The result is being stored so it can be reopened from the dashboard and result route later.',
      });
      await updateProjectStatus(projectId, 'generated');
      setWorkspace((current) =>
        current
          ? {
              ...current,
              latestResult: savedResult,
              resultHistory: [savedResult, ...current.resultHistory],
              project: {
                ...current.project,
                brandName: getProjectBrandName(formData),
                status: 'generated',
                latestResult: savedResult,
                resultCount: current.project.resultCount + 1,
              },
            }
          : current
      );
      setGenerationStatus(idleGenerationStatus);

      showSuccess('Brand direction generated.');
      navigate(`/project/${projectId}/result?version=${savedResult.id}`);
    } catch (error) {
      console.error('Failed to generate brand result:', error);
      try {
        await updateProjectStatus(projectId, 'draft');
      } catch (statusError) {
        console.error('Failed to reset project status:', statusError);
      }
      setWorkspace((current) =>
        current
          ? {
              ...current,
              formData,
              project: {
                ...current.project,
                brandName: getProjectBrandName(formData),
                status: 'draft',
              },
            }
          : current
      );
      setGenerationStatus(handleGenerationError(error, showError));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      <ErrorToast toasts={toasts} onDismiss={removeToast} />
      <BrandFormPage
        initialData={workspace.formData}
        projectName={workspace.project.brandName}
        onSaveAndAnalyze={handleGenerate}
        onSaveDraft={handleSaveDraft}
        onBack={() => navigate('/dashboard')}
        onSignOut={handleSignOut}
        isAnalyzing={isAnalyzing}
        generationStatus={generationStatus}
        onDismissGenerationStatus={() => setGenerationStatus(idleGenerationStatus)}
      />
    </>
  );
};

const ProjectResultRoute: React.FC = () => {
  const { projectId } = useParams();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, showError, showSuccess, removeToast } = useError();
  const [workspace, setWorkspace] = useState<BrandProjectWorkspace | null>();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadWorkspace = async () => {
    if (!projectId) return;

    try {
      const nextWorkspace = await loadProjectWorkspace(projectId);
      setWorkspace(nextWorkspace);
    } catch (error) {
      console.error('Failed to load brand result:', error);
      showError('db/load-failed');
      setWorkspace(null);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [projectId]);

  if (workspace === undefined) {
    return <LoadingPage />;
  }

  if (!workspace || !projectId) {
    return <MissingProjectState />;
  }

  const selectedVersionId = searchParams.get('version');
  const activeResult =
    workspace.resultHistory.find((result) => result.id === selectedVersionId) ||
    workspace.latestResult;
  const activeResultIndex = workspace.resultHistory.findIndex((result) => result.id === activeResult?.id);

  if (!activeResult) {
    return (
      <>
        <ErrorToast toasts={toasts} onDismiss={removeToast} />
        <ProjectResultState
          brandName={workspace.project.brandName}
          status={workspace.project.status}
          onRefresh={() => {
            void loadWorkspace();
          }}
          onBackToQuestions={() => navigate(`/project/${projectId}/questions`)}
          onBackToDashboard={() => navigate('/dashboard')}
        />
      </>
    );
  }

  const handleToggleLock = async (sectionId: KitSectionId) => {
    const nextLocks: BrandKitLocks = {
      ...workspace.project.kitLocks,
      [sectionId]: !workspace.project.kitLocks?.[sectionId],
    };

    try {
      await updateProjectKitLocks(projectId, nextLocks);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              project: {
                ...current.project,
                kitLocks: nextLocks,
              },
            }
          : current
      );
    } catch (error) {
      console.error('Failed to update kit locks:', error);
      showError('db/save-failed');
    }
  };

  const handleRegenerateSection = async (sectionId: RegenerableKitSectionId) => {
    setIsRegenerating(true);

    try {
      const savedResult = await regenerateBrandSection(
        projectId,
        activeResult.id,
        sectionId
      );
      setWorkspace((current) =>
        current
          ? {
              ...current,
              latestResult: savedResult,
              resultHistory: [
                savedResult,
                ...current.resultHistory.filter((result) => result.id !== savedResult.id),
              ],
              project: {
                ...current.project,
                latestResult: savedResult,
                resultCount: current.project.resultCount + 1,
              },
            }
          : current
      );
      setSearchParams({ version: savedResult.id });
      showSuccess('A new workbook version was created from that section refinement.');
    } catch (error) {
      console.error('Failed to regenerate brand section:', error);
      handleGenerationError(error, showError, 'api/generation-failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/project/${projectId}/result?version=${activeResult.id}`;

    try {
      await navigator.clipboard.writeText(url);
      try {
        await recordExport({
          projectId,
          brandResultId: activeResult.id,
          exportType: 'link',
          exportUrl: url,
          metadata: {
            versionId: activeResult.id,
          },
        });
      } catch (exportError) {
        console.error('Failed to record link export:', exportError);
      }
      showSuccess('Project link copied.');
    } catch (error) {
      console.error('Failed to copy project link:', error);
      showError('unknown', { message: 'Failed to copy the result link.' });
    }
  };

  const handleExportPdf = async () => {
    try {
      await openBrandKitPdfExport({
        brandName: workspace.project.brandName,
        formData: workspace.formData,
        kit: activeResult.result,
        exportedAt: new Date().toISOString(),
        sourceModel: activeResult.sourceModel || undefined,
        versionLabel:
          activeResultIndex >= 0
            ? `Workbook version ${Math.max(workspace.resultHistory.length - activeResultIndex, 1)}`
            : undefined,
      });

      try {
        await recordExport({
          projectId,
          brandResultId: activeResult.id,
          exportType: 'pdf',
          fileName: `${workspace.project.brandName}.pdf`,
          metadata: {
            versionId: activeResult.id,
          },
        });
      } catch (exportError) {
        console.error('Failed to record PDF export:', exportError);
      }
      showSuccess('Printable brand workbook opened.');
    } catch (error) {
      console.error('Failed to start PDF export:', error);
      showError('unknown', { message: 'Could not start the PDF export right now.' });
    }
  };

  const handleDuplicate = async () => {
    try {
      const newProjectId = await duplicateProject(projectId);
      showSuccess('Workbook duplicated.');
      navigate(`/project/${newProjectId}`);
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      showError('db/save-failed');
    }
  };

  const handlePersistGeneratedLogo = async (logoUrl: string) => {
    try {
      const savedResult = await saveGeneratedLogo(activeResult.id, logoUrl);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              latestResult:
                current.latestResult?.id === savedResult.id ? savedResult : current.latestResult,
              resultHistory: current.resultHistory.map((result) =>
                result.id === savedResult.id ? savedResult : result
              ),
              project: {
                ...current.project,
                latestResult:
                  current.project.latestResult?.id === savedResult.id
                    ? savedResult
                    : current.project.latestResult,
              },
            }
          : current
      );
    } catch (error) {
      console.error('Failed to save generated logo:', error);
      showError('db/save-failed');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      <ErrorToast toasts={toasts} onDismiss={removeToast} />
      <BrandKit
        kit={activeResult.result}
        formData={workspace.formData}
        onEdit={() => navigate(`/project/${projectId}/questions`)}
        onBackToDashboard={() => navigate('/dashboard')}
        onSignOut={handleSignOut}
        onCopyLink={handleCopyLink}
        onExportPdf={handleExportPdf}
        projectId={projectId}
        kitLocks={workspace.project.kitLocks || {}}
        onToggleLock={handleToggleLock}
        onRegenerateSection={handleRegenerateSection}
        isRegenerating={isRegenerating}
        onDuplicate={handleDuplicate}
        onPersistGeneratedLogo={handlePersistGeneratedLogo}
        initialLogoUrl={activeResult.logoImageUrl}
        resultHistory={workspace.resultHistory}
        activeResultId={activeResult.id}
        onSelectResult={(resultId) => {
          setSearchParams({ version: resultId });
        }}
      />
    </>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/project/:projectId" element={<ProjectIndexRoute />} />
        <Route path="/project/:projectId/questions" element={<ProjectQuestionsRoute />} />
        <Route path="/project/:projectId/result" element={<ProjectResultRoute />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

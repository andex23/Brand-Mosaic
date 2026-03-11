import React from 'react';
import BrandHeader from './BrandHeader';
import { BrandProject } from '../types';

interface DashboardProps {
  projects: BrandProject[];
  userEmail?: string | null;
  userName?: string | null;
  isLoading?: boolean;
  onCreateNew: () => void;
  onOpenQuestions: (projectId: string) => void;
  onOpenResult: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onSignOut: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  userEmail,
  userName,
  isLoading = false,
  onCreateNew,
  onOpenQuestions,
  onOpenResult,
  onDuplicate,
  onDelete,
  onSignOut,
}) => {
  const drafts = projects.filter((project) => !project.latestResult);
  const completed = projects.filter((project) => Boolean(project.latestResult));

  return (
    <div className="brand-page dashboard-container">
      <div className="nav-top-bar">
        <span className="nav-link-btn nav-link-static">PRIVATE WORKBOOKS</span>
        <button onClick={onSignOut} className="nav-link-btn">
          [ SIGN OUT ]
        </button>
      </div>

      <BrandHeader subtitle="Your saved brand workbooks" />

      <div className="dashboard-status-header">
        <div className="dashboard-status-info">
          <p className="dashboard-status-label">◈ PRIVATE DASHBOARD</p>
          <h3>
            <strong>{userName || userEmail || 'Brand Workspace'}</strong>
          </h3>
          <p className="dashboard-status-sub">
            {projects.length} workbook{projects.length === 1 ? '' : 's'} in your account
          </p>
        </div>

        <div className="dashboard-status-local">
          Projects, answers, results, and exports stay scoped to the account that created them.
        </div>
      </div>

      <div className="dashboard-create-section">
        <button onClick={onCreateNew} className="dashboard-create-btn">
          [ + NEW BRAND WORKBOOK ]
        </button>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          <span>✎ IN PROGRESS</span>
          <span className="dashboard-section-count">{drafts.length}</span>
        </h2>

        <div className="dashboard-project-list">
          {!isLoading && drafts.length === 0 && (
            <div className="dashboard-empty">
              <p className="dashboard-empty-text">
                No active workbooks yet. Drafts and interrupted generations will stay here until a saved result exists.
              </p>
              <button onClick={onCreateNew} className="nav-link-btn dashboard-empty-btn">
                Start your first workbook →
              </button>
            </div>
          )}

          {drafts.map((project) => (
            <div key={project.id} className="dashboard-project-item dashboard-project-draft">
              <div className="project-info">
                <span className="project-name">{project.brandName}</span>
                <span className="project-date">Updated: {formatDate(project.updatedAt)}</span>
                <span className="project-progress">
                  {project.answeredCount}/{project.totalPromptCount || project.answeredCount} prompts shaped
                  {' '}• {project.completionPercent}% complete
                </span>
                {project.latestResult?.result?.brandEssence && (
                  <p className="project-preview">{project.latestResult.result.brandEssence}</p>
                )}
              </div>

              <span className={`project-badge project-badge-${project.status}`}>
                {project.status.toUpperCase()}
              </span>

              <div className="project-actions">
                <button className="project-actions-btn" onClick={() => onOpenQuestions(project.id)}>
                  [ CONTINUE ]
                </button>
                {project.latestResult && (
                  <button className="project-actions-btn" onClick={() => onOpenResult(project.id)}>
                    [ RESULT ]
                  </button>
                )}
                <button className="project-actions-btn" onClick={() => onDuplicate(project.id)}>
                  [ COPY ]
                </button>
                <button
                  className="project-actions-btn project-actions-delete"
                  onClick={() => onDelete(project.id)}
                >
                  [ DELETE ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          <span>◆ GENERATED KITS</span>
          <span className="dashboard-section-count">{completed.length}</span>
        </h2>

        <div className="dashboard-project-list">
          {!isLoading && completed.length === 0 && (
            <div className="dashboard-empty">
              <p className="dashboard-empty-text">
                Generated brand kits will appear here once a workbook has been synthesized.
              </p>
            </div>
          )}

          {completed.map((project) => (
            <div key={project.id} className="dashboard-project-item dashboard-project-complete">
              <div className="project-info">
                <span className="project-name">{project.brandName}</span>
                <span className="project-date">Updated: {formatDate(project.updatedAt)}</span>
                <span className="project-progress">
                  {project.resultCount} saved version{project.resultCount === 1 ? '' : 's'}
                  {' '}• {project.completionPercent}% workbook coverage
                </span>
                {project.latestResult?.result?.brandEssence && (
                  <p className="project-preview">{project.latestResult.result.brandEssence}</p>
                )}
              </div>

              <span className="project-badge project-badge-complete">GENERATED</span>

              <div className="project-actions">
                <button className="project-actions-btn" onClick={() => onOpenResult(project.id)}>
                  [ OPEN RESULT ]
                </button>
                <button className="project-actions-btn" onClick={() => onOpenQuestions(project.id)}>
                  [ EDIT ]
                </button>
                <button className="project-actions-btn" onClick={() => onDuplicate(project.id)}>
                  [ COPY ]
                </button>
                <button
                  className="project-actions-btn project-actions-delete"
                  onClick={() => onDelete(project.id)}
                >
                  [ DELETE ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

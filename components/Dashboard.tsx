import React, { useState } from 'react';
import { BrandProject } from '../types';
import BrandHeader from './BrandHeader';
import PaymentModal from './PaymentModal';
import { supabase } from '../lib/supabase';
import { useUsage } from '../hooks/useUsage';
import type { User } from '@supabase/supabase-js';

interface DashboardProps {
  projects: BrandProject[];
  onCreateNew: () => void;
  onSelectProject: (project: BrandProject) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onDownloadProject: (project: BrandProject, e: React.MouseEvent) => void;
  onGoHome: () => void;
  isLocalMode?: boolean;
  onExitLocal?: () => void;
  user?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  onCreateNew, 
  onSelectProject, 
  onDeleteProject,
  onDownloadProject,
  onGoHome,
  isLocalMode,
  onExitLocal,
  user,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { profile, refresh } = useUsage(user || null, isLocalMode);
  
  const drafts = projects.filter(p => !p.brandKit);
  const completed = projects.filter(p => !!p.brandKit);

  const handleSignOut = async () => {
    if (supabase && !isLocalMode) {
      await supabase.auth.signOut();
    } else if (onExitLocal) {
      onExitLocal();
    }
  };

  return (
    <div className="brand-page dashboard-container">
      <div className="nav-top-bar">
        <button onClick={onGoHome} className="nav-link-btn">
          ← HOME
        </button>
        <button onClick={handleSignOut} className="nav-link-btn">
          {isLocalMode ? '[ EXIT SESSION ]' : '[ SIGN OUT ]'}
        </button>
      </div>

      <BrandHeader 
        onTitleClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        subtitle="Your Brand Workshop"
      />

      {/* Status Header Card */}
      <div className="dashboard-status-header">
        <div className="dashboard-status-info">
          <p className="dashboard-status-label">
            {isLocalMode ? '◈ LOCAL MODE' : '◈ CLOUD SYNC'}
          </p>
          <h3>
            <strong>{isLocalMode ? 'Local Session' : (user?.email || 'Welcome')}</strong>
          </h3>
          {!isLocalMode && (
            <p className="dashboard-status-sub">
              {projects.length} project{projects.length !== 1 ? 's' : ''} saved
            </p>
          )}
        </div>
        
        {!isLocalMode && profile && (
          <div className="dashboard-credits">
            <span className="dashboard-credits-count" style={{ color: profile.available_generations > 0 ? 'var(--ink)' : '#d32f2f' }}>
              {profile.available_generations === -1 ? '∞' : profile.available_generations}
            </span>
            <span className="dashboard-credits-label">
              {profile.available_generations === -1 ? 'unlimited' : 'credits'}
            </span>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="nav-link-btn dashboard-purchase-btn"
              style={{ color: profile.available_generations === 0 ? '#d32f2f' : 'var(--ink)' }}
            >
              {profile.available_generations === -1 
                ? '[ Full Access ]' 
                : profile.available_generations === 0 
                  ? '[ Purchase ]' 
                  : '[ Add More ]'}
            </button>
          </div>
        )}
        
        {isLocalMode && (
          <p className="dashboard-status-local">
            Using your own API key.<br />
            Unlimited generations.
          </p>
        )}
      </div>
      
      {/* Create New Button */}
      <div className="dashboard-create-section">
        <button onClick={onCreateNew} className="dashboard-create-btn">
          [ + CREATE NEW BRAND ]
        </button>
      </div>

      {/* Drafts Section */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          <span>✎ DRAFTS</span>
          <span className="dashboard-section-count">{drafts.length}</span>
        </h2>
        
        <div className="dashboard-project-list">
          {drafts.length === 0 && (
            <div className="dashboard-empty">
              <p className="dashboard-empty-text">No drafts yet</p>
              <button onClick={onCreateNew} className="nav-link-btn dashboard-empty-btn">
                Start your first brand →
              </button>
            </div>
          )}
          {drafts.map(project => (
            <div 
              key={project.id} 
              className="dashboard-project-item dashboard-project-draft"
              onClick={() => onSelectProject(project)}
            >
              <div className="project-info">
                <span className="project-name">{project.formData.brandName || 'Untitled Draft'}</span>
                <span className="project-date">Last edit: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <span className="project-badge project-badge-draft">DRAFT</span>
              <div className="project-actions">
                <button 
                  className="project-actions-btn"
                  onClick={(e) => onDownloadProject(project, e)}
                  title="Download"
                >
                  [↓]
                </button>
                <button 
                  className="project-actions-btn project-actions-delete"
                  onClick={(e) => onDeleteProject(project.id, e)}
                >
                  [✕]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Brand Kits Section */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          <span>◆ BRAND KITS</span>
          <span className="dashboard-section-count">{completed.length}</span>
        </h2>

        <div className="dashboard-project-list">
          {completed.length === 0 && (
            <div className="dashboard-empty">
              <p className="dashboard-empty-text">
                Complete a brand questionnaire to generate your first kit
              </p>
            </div>
          )}
          {completed.map(project => (
            <div 
              key={project.id} 
              className="dashboard-project-item dashboard-project-complete"
              onClick={() => onSelectProject(project)}
            >
              <div className="project-info">
                <span className="project-name">{project.formData.brandName}</span>
                <span className="project-date">Created: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <span className="project-badge project-badge-complete">COMPLETE</span>
              <div className="project-actions">
                <button className="project-actions-btn" onClick={(e) => onDownloadProject(project, e)}>[↓]</button>
                <button className="project-actions-btn project-actions-delete" onClick={(e) => onDeleteProject(project.id, e)}>[✕]</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPaymentModal && user && (
        <PaymentModal
          userId={user.id}
          userEmail={user.email || ''}
          currentCredits={profile?.available_generations || 0}
          onSuccess={() => {
            refresh();
            setShowPaymentModal(false);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
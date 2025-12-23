import React from 'react';
import { BrandProject } from '../types';
import BrandHeader from './BrandHeader';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface DashboardProps {
  projects: BrandProject[];
  onCreateNew: () => void;
  onSelectProject: (project: BrandProject) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onDownloadProject: (project: BrandProject, e: React.MouseEvent) => void;
  onGoHome: () => void;
  isLocalMode?: boolean;
  onExitLocal?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  onCreateNew, 
  onSelectProject, 
  onDeleteProject,
  onDownloadProject,
  onGoHome,
  isLocalMode,
  onExitLocal
}) => {
  const drafts = projects.filter(p => !p.brandKit);
  const completed = projects.filter(p => !!p.brandKit);

  const handleSignOut = () => {
    if (auth) {
      signOut(auth).catch(error => console.error("Error signing out", error));
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
        subtitle={isLocalMode ? 'Local Project Storage' : 'Your Cloud Brands'}
      />
      
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <button onClick={onCreateNew} className="brand-submit-btn" style={{ fontSize: '16px' }}>
          [ + CREATE NEW BRAND ]
        </button>
      </div>

      <div className="dashboard-section">
        <div style={{ 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          letterSpacing: '2px', 
          marginBottom: '24px', 
          color: '#888',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>DRAFTS</span>
          <div style={{ height: '1px', background: 'var(--line)', flex: 1 }}></div>
        </div>
        
        <div className="dashboard-project-list">
          {drafts.length === 0 && (
            <div style={{ opacity: 0.4, fontStyle: 'italic', padding: '24px', textAlign: 'center' }}>
              No current drafts.
            </div>
          )}
          {drafts.map(project => (
            <div 
              key={project.id} 
              className="dashboard-project-item"
              onClick={() => onSelectProject(project)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="project-name">{project.formData.brandName || 'Untitled Draft'}</span>
                <span className="project-date">Last edit: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  className="project-actions-btn"
                  onClick={(e) => onDownloadProject(project, e)}
                  title="Download"
                >
                  [SAVE]
                </button>
                <button 
                  className="project-actions-btn"
                  onClick={(e) => onDeleteProject(project.id, e)}
                  style={{ color: '#d32f2f' }}
                >
                  [✕]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <div style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            marginBottom: '24px', 
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>BRAND KITS</span>
            <div style={{ height: '1px', background: 'var(--line)', flex: 1 }}></div>
        </div>

        <div className="dashboard-project-list">
          {completed.length === 0 && (
            <div style={{ opacity: 0.4, fontStyle: 'italic', padding: '24px', textAlign: 'center' }}>
              No completed brand kits yet.
            </div>
          )}
          {completed.map(project => (
            <div 
              key={project.id} 
              className="dashboard-project-item"
              onClick={() => onSelectProject(project)}
              style={{ borderLeft: '3px solid var(--ink)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="project-name">{project.formData.brandName}</span>
                <span className="project-date">Finalized: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="project-actions-btn" onClick={(e) => onDownloadProject(project, e)}>[SAVE]</button>
                <button className="project-actions-btn" onClick={(e) => onDeleteProject(project.id, e)} style={{ color: '#d32f2f' }}>[✕]</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React from 'react';
import { ProjectStatus } from '../types';

interface ProjectResultStateProps {
  brandName: string;
  status: ProjectStatus;
  onRefresh: () => void;
  onBackToQuestions: () => void;
  onBackToDashboard: () => void;
}

const getCopy = (status: ProjectStatus) => {
  if (status === 'generating') {
    return {
      kicker: '[ RESULT NOT SAVED YET ]',
      title: 'This workbook does not have a saved brand result yet.',
      message:
        'The project is marked as generating, but nothing has been stored in the result library yet.',
      notes: [
        'If another tab is still running the generation step, give it a moment and refresh this page.',
        'If the provider ran out of credits or the tab was interrupted, your questionnaire answers are still safe.',
        'Return to the workbook when you are ready to retry generation.',
      ],
    };
  }

  if (status === 'generated') {
    return {
      kicker: '[ RESULT UNAVAILABLE ]',
      title: 'The workbook says generated, but the saved result is missing.',
      message:
        'Refresh once to check for a delayed save. If it still does not appear, reopen the workbook and generate again.',
      notes: [
        'Brand Mosaic renders this page from saved result data, not from raw questionnaire answers.',
        'Your questionnaire answers remain available in the workbook.',
      ],
    };
  }

  return {
    kicker: '[ NO RESULT YET ]',
    title: 'This workbook is still in draft.',
    message:
      'A brand result has not been generated for this project yet. Open the workbook to review the answers and generate when ready.',
    notes: [
      'The result page only appears after a synthesized brand direction has been saved.',
      'Your questionnaire answers can still be edited at any time.',
    ],
  };
};

const ProjectResultState: React.FC<ProjectResultStateProps> = ({
  brandName,
  status,
  onRefresh,
  onBackToQuestions,
  onBackToDashboard,
}) => {
  const copy = getCopy(status);

  return (
    <div className="brand-page project-result-state">
      <div className="project-missing-card project-result-card">
        <p className="project-result-kicker">{copy.kicker}</p>
        <h2>{copy.title}</h2>
        <p className="project-result-name">Workbook: {brandName}</p>
        <p>{copy.message}</p>

        <ul className="project-result-notes">
          {copy.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <div className="project-result-actions">
          <button type="button" className="brand-edit-btn" onClick={onRefresh}>
            [ REFRESH RESULT ]
          </button>
          <button type="button" className="brand-submit-btn" onClick={onBackToQuestions}>
            [ OPEN WORKBOOK ]
          </button>
          <button type="button" className="brand-edit-btn" onClick={onBackToDashboard}>
            [ BACK TO DASHBOARD ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectResultState;

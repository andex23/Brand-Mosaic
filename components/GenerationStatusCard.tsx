import React from 'react';
import { GenerationStatusNotice } from '../types';

interface GenerationStatusCardProps {
  status: GenerationStatusNotice;
  onDismiss?: () => void;
}

const STEPS = [
  { key: 'saving', label: 'Saving workbook answers' },
  { key: 'synthesizing', label: 'Synthesizing the full brand direction' },
  { key: 'persisting', label: 'Saving the generated result to this project' },
] as const;

const stepOrder = ['saving', 'synthesizing', 'persisting'] as const;

const GenerationStatusCard: React.FC<GenerationStatusCardProps> = ({ status, onDismiss }) => {
  if (status.phase === 'idle') return null;

  const currentStepIndex = stepOrder.indexOf(status.phase as (typeof stepOrder)[number]);
  const isFailure = status.phase === 'failed';

  return (
    <div
      className={`generation-status-card ${isFailure ? 'generation-status-card-failure' : 'generation-status-card-progress'}`}
      aria-live="polite"
    >
      <div className="generation-status-header">
        <div>
          <p className="generation-status-kicker">
            {isFailure ? '[ GENERATION STOPPED ]' : '[ GENERATION IN PROGRESS ]'}
          </p>
          <h2 className="generation-status-title">
            {status.title || (isFailure ? 'The brand result was not saved.' : 'Building your brand direction...')}
          </h2>
        </div>

        {isFailure && onDismiss && (
          <button type="button" className="generation-status-dismiss" onClick={onDismiss}>
            [ DISMISS ]
          </button>
        )}
      </div>

      {status.message && <p className="generation-status-message">{status.message}</p>}

      {!isFailure && (
        <ol className="generation-status-steps">
          {STEPS.map((step, index) => {
            const state =
              index < currentStepIndex ? 'complete' : index === currentStepIndex ? 'active' : 'pending';

            return (
              <li
                key={step.key}
                className={`generation-status-step generation-status-step-${state}`}
              >
                <span className="generation-status-step-mark">
                  {state === 'complete' ? '✓' : state === 'active' ? '→' : '·'}
                </span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {Boolean(status.notes?.length) && (
        <ul className="generation-status-notes">
          {status.notes?.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      {status.actionHref && status.actionLabel && (
        <div className="generation-status-actions">
          <a
            className="generation-status-link"
            href={status.actionHref}
            target="_blank"
            rel="noreferrer"
          >
            {status.actionLabel} {'->'}
          </a>
        </div>
      )}
    </div>
  );
};

export default GenerationStatusCard;

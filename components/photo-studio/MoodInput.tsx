import React, { useEffect, useRef } from 'react';
import { MoodInterpretation, SceneType } from '../../types';
import { interpretMood } from './InterpretationEngine';

interface MoodInputProps {
  moodText: string;
  onMoodChange: (text: string) => void;
  interpretation: MoodInterpretation | null;
  onInterpretationChange: (interp: MoodInterpretation) => void;
  selectedScenes: SceneType[];
  onConfirm: () => void;
  onBack: () => void;
}

const MoodInput: React.FC<MoodInputProps> = ({
  moodText,
  onMoodChange,
  interpretation,
  onInterpretationChange,
  selectedScenes,
  onConfirm,
  onBack,
}) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced interpretation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const result = interpretMood(moodText, selectedScenes);
      onInterpretationChange(result);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [moodText, selectedScenes]);

  // Run once on mount to set default interpretation
  useEffect(() => {
    if (!interpretation) {
      onInterpretationChange(interpretMood('', selectedScenes));
    }
  }, []);

  const handleSkip = () => {
    onMoodChange('');
    onInterpretationChange(interpretMood('', selectedScenes));
    onConfirm();
  };

  return (
    <div className="ps-mood-input">
      <h3 className="ps-section-title">Mood Direction</h3>
      <p className="ps-section-desc">
        Optionally describe a mood. The system interprets this as directional intent
        — scene rules take precedence.
      </p>

      <textarea
        className="ps-mood-textarea"
        placeholder='Leave empty for default styling, or describe a mood... e.g. "warm autumn morning", "clean minimalist", "moody industrial"'
        value={moodText}
        onChange={(e) => onMoodChange(e.target.value)}
        rows={3}
        maxLength={200}
      />

      {moodText && (
        <div className="ps-mood-charcount">
          {moodText.length}/200
        </div>
      )}

      {/* Interpretation Feedback */}
      {interpretation && (
        <div className="ps-mood-feedback">
          <div className="ps-mood-feedback-title">Interpreted as:</div>
          <div className="ps-mood-row">
            <span className="ps-mood-label">Temperature</span>
            <span className="ps-mood-value">{interpretation.temperature}</span>
          </div>
          <div className="ps-mood-row">
            <span className="ps-mood-label">Energy</span>
            <span className="ps-mood-value">{interpretation.energy}</span>
          </div>
          <div className="ps-mood-row">
            <span className="ps-mood-label">Material</span>
            <span className="ps-mood-value">
              {interpretation.materialBias === 'none' ? '— (scene default)' : interpretation.materialBias}
            </span>
          </div>
          <div className="ps-mood-row">
            <span className="ps-mood-label">Light</span>
            <span className="ps-mood-value">{interpretation.lightQuality}</span>
          </div>

          {interpretation.overrideNotes.length > 0 && (
            <div className="ps-mood-overrides">
              <span className="ps-mood-label">Adjustments</span>
              {interpretation.overrideNotes.map((note, i) => (
                <span key={i} className="ps-mood-override-item">
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ps-nav-buttons">
        <button className="nav-link-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="ps-nav-right">
          <button className="nav-link-btn" onClick={handleSkip}>
            Skip mood →
          </button>
          <button className="brand-submit-btn" onClick={onConfirm}>
            [ GENERATE SCENES ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodInput;

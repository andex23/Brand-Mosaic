import React, { useState } from 'react';

interface LogoGeneratorProps {
  logoPrompt?: string;
  onGenerate: (options: {
    prompt: string;
    style: string;
    aspectRatio: string;
  }) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const LogoGenerator: React.FC<LogoGeneratorProps> = ({
  logoPrompt = '',
  onGenerate,
  isGenerating,
  disabled = false,
}) => {
  const [style, setStyle] = useState<string>('minimalist');
  const [aspectRatio, setAspectRatio] = useState<string>('square');

  const handleGenerate = () => {
    if (disabled || isGenerating || !logoPrompt) return;
    onGenerate({ prompt: logoPrompt, style, aspectRatio });
  };

  return (
    <div className="logo-generator-panel">
      <h3 className="logo-generator-title">[ LOGO GENERATION ]</h3>

      {logoPrompt ? (
        <>
          <div className="logo-generator-prompt">
            <span className="kit-note-label">Prompt</span>
            <p>{logoPrompt}</p>
          </div>

          <div className="logo-generator-grid">
            <label className="logo-generator-field">
              <span className="logo-generator-label">Style</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isGenerating}
                className="logo-generator-select"
              >
                <option value="minimalist">Minimalist</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="abstract">Abstract</option>
              </select>
            </label>

            <label className="logo-generator-field">
              <span className="logo-generator-label">Aspect Ratio</span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isGenerating}
                className="logo-generator-select"
              >
                <option value="square">Square (1:1)</option>
                <option value="wide">Wide (16:9)</option>
                <option value="tall">Tall (9:16)</option>
              </select>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={disabled || isGenerating}
            className="brand-submit-btn logo-generator-btn"
          >
            {isGenerating ? '[ GENERATING... ]' : '[ GENERATE LOGO ]'}
          </button>
        </>
      ) : (
        <div className="logo-generator-empty">
          Logo prompt not available yet. Add more detail or unlock the full analysis to generate a stronger direction.
        </div>
      )}
    </div>
  );
};

export default LogoGenerator;

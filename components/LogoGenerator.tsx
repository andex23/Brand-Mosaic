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
    <div
      style={{
        marginTop: '30px',
        padding: '30px',
        border: '2px solid var(--line, #ddd)',
        background: 'rgba(255, 255, 255, 0.5)',
      }}
    >
      <h3
        style={{
          fontSize: '20px',
          marginBottom: '20px',
          fontFamily: 'serif',
          color: 'var(--ink, #222)',
        }}
      >
        [ LOGO GENERATION ]
      </h3>

      {logoPrompt ? (
        <>
          <div style={{ marginBottom: '20px', lineHeight: '1.6', fontSize: '14px' }}>
            <strong>Prompt:</strong>
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.03)',
                border: '1px solid var(--line, #ddd)',
                fontStyle: 'italic',
              }}
            >
              {logoPrompt}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                Style:
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--line, #ddd)',
                  background: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="minimalist">Minimalist</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="abstract">Abstract</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                Aspect Ratio:
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--line, #ddd)',
                  background: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="square">Square (1:1)</option>
                <option value="wide">Wide (16:9)</option>
                <option value="tall">Tall (9:16)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={disabled || isGenerating}
            className="brand-submit-btn"
            style={{
              width: '100%',
              opacity: disabled || isGenerating ? 0.5 : 1,
              cursor: disabled || isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? '[ GENERATING... ]' : '[ GENERATE LOGO ]'}
          </button>
        </>
      ) : (
        <div
          style={{
            fontSize: '14px',
            fontStyle: 'italic',
            opacity: 0.6,
            textAlign: 'center',
            padding: '20px',
          }}
        >
          Logo prompt not available. Please upgrade to access logo generation.
        </div>
      )}
    </div>
  );
};

export default LogoGenerator;







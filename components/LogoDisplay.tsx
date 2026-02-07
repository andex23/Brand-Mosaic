import React from 'react';

interface LogoDisplayProps {
  logoUrl: string;
  onRegenerate?: () => void;
  onDownload?: () => void;
  isGenerating?: boolean;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({
  logoUrl,
  onRegenerate,
  onDownload,
  isGenerating = false,
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = 'brand-logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onDownload) onDownload();
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
        [ GENERATED LOGO ]
      </h3>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          background: '#fff',
          border: '1px solid var(--line, #ddd)',
          minHeight: '300px',
        }}
      >
        {isGenerating ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '14px',
                fontStyle: 'italic',
                opacity: 0.6,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              Generating your logo...
            </div>
          </div>
        ) : (
          <img
            src={logoUrl}
            alt="Generated Logo"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
            }}
          />
        )}
      </div>

      {!isGenerating && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
            justifyContent: 'center',
          }}
        >
          <button onClick={handleDownload} className="brand-submit-btn">
            [ DOWNLOAD LOGO ]
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="brand-submit-btn"
              style={{
                background: 'transparent',
                color: 'var(--ink, #222)',
                opacity: 0.8,
              }}
            >
              [ REGENERATE ]
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LogoDisplay;







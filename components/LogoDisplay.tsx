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
    onDownload?.();
  };

  return (
    <div className="logo-display-panel">
      <h3 className="logo-display-title">[ GENERATED LOGO ]</h3>

      <div className="logo-display-frame">
        {isGenerating ? (
          <div className="logo-display-loading">Generating your logo...</div>
        ) : (
          <img src={logoUrl} alt="Generated logo" className="logo-display-image" />
        )}
      </div>

      {!isGenerating && (
        <div className="logo-display-actions">
          <button onClick={handleDownload} className="brand-submit-btn">
            [ DOWNLOAD LOGO ]
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} className="brand-edit-btn">
              [ REGENERATE ]
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LogoDisplay;

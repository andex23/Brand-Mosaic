import React from 'react';
import { GeneratedScene } from '../../types';

interface SceneResultsProps {
  results: GeneratedScene[];
  productName: string;
  onStartOver: () => void;
  onBackToDashboard: () => void;
}

const SCENE_LABELS: Record<string, string> = {
  studio: 'STUDIO',
  lifestyle: 'LIFESTYLE',
  editorial: 'EDITORIAL',
};

const SceneResults: React.FC<SceneResultsProps> = ({
  results,
  productName,
  onStartOver,
  onBackToDashboard,
}) => {

  const handleDownload = (scene: GeneratedScene) => {
    const link = document.createElement('a');
    link.href = scene.imageBase64;
    link.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-${scene.sceneType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    results.forEach((scene, i) => {
      // Stagger downloads slightly to avoid browser blocking
      setTimeout(() => handleDownload(scene), i * 300);
    });
  };

  return (
    <div className="ps-results">
      <h3 className="ps-section-title">Generated Scenes</h3>
      <p className="ps-section-desc">
        {results.length} scene{results.length > 1 ? 's' : ''} generated for {productName}.
      </p>

      <div className={`ps-results-grid ${results.length === 1 ? 'ps-results-single' : ''}`}>
        {results.map((scene, i) => (
          <div key={i} className="ps-result-card">
            <div className="ps-result-header">
              <span className="ps-result-label">
                {SCENE_LABELS[scene.sceneType] || scene.sceneType.toUpperCase()}
              </span>
              <span className="ps-result-provider">via {scene.provider}</span>
            </div>

            <div className="ps-result-image-container">
              <img
                src={scene.imageBase64}
                alt={`${scene.sceneType} scene of ${productName}`}
                className="ps-result-image"
              />
            </div>

            <button
              className="brand-submit-btn"
              onClick={() => handleDownload(scene)}
            >
              [ DOWNLOAD ]
            </button>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="ps-results-actions">
        {results.length > 1 && (
          <button className="brand-submit-btn" onClick={handleDownloadAll}>
            [ DOWNLOAD ALL ]
          </button>
        )}
        <button
          className="brand-submit-btn ps-btn-secondary"
          onClick={onStartOver}
        >
          [ NEW SESSION ]
        </button>
        <button
          className="nav-link-btn"
          onClick={onBackToDashboard}
        >
          ← Dashboard
        </button>
      </div>
    </div>
  );
};

export default SceneResults;

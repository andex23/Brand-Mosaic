import React from 'react';
import { GeneratedScene } from '../../types';

interface SceneResultsProps {
  results: GeneratedScene[];
  productName: string;
  originalImage: string; // base64 of original product image
  onStartOver: () => void;
  onBackToDashboard: () => void;
}

const SCENE_LABELS: Record<string, string> = {
  studio: 'Studio',
  lifestyle: 'Lifestyle',
  editorial: 'Editorial',
};

// Download icon SVG (minimal, notebook style)
const DownloadIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SceneResults: React.FC<SceneResultsProps> = ({
  results,
  productName,
  originalImage,
  onStartOver,
  onBackToDashboard,
}) => {

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadScene = (scene: GeneratedScene) => {
    handleDownload(
      scene.imageBase64,
      `${productName.replace(/\s+/g, '-').toLowerCase()}-${scene.sceneType}.png`
    );
  };

  const handleDownloadOriginal = () => {
    handleDownload(
      originalImage,
      `${productName.replace(/\s+/g, '-').toLowerCase()}-original.png`
    );
  };

  const handleDownloadAll = () => {
    // Download original first
    handleDownloadOriginal();
    // Then each scene with stagger
    results.forEach((scene, i) => {
      setTimeout(() => handleDownloadScene(scene), (i + 1) * 300);
    });
  };

  // Build the grid cells: Original + generated scenes
  const allCells = [
    { label: 'Original', image: originalImage, isOriginal: true, scene: null as GeneratedScene | null },
    ...results.map(scene => ({
      label: SCENE_LABELS[scene.sceneType] || scene.sceneType,
      image: scene.imageBase64,
      isOriginal: false,
      scene,
    })),
  ];

  return (
    <div className="ps-canvas">
      {/* Canvas Header */}
      <div className="ps-canvas-header">
        <div className="ps-canvas-title">
          <span className="ps-canvas-product-name">{productName}</span>
          <span className="ps-canvas-count">{results.length} scene{results.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          className="ps-canvas-download-all"
          onClick={handleDownloadAll}
          title="Download all images"
        >
          <DownloadIcon size={16} />
          <span>Download All</span>
        </button>
      </div>

      {/* 2x2 Grid Canvas */}
      <div className={`ps-canvas-grid ps-canvas-grid-${allCells.length}`}>
        {allCells.map((cell, i) => (
          <div key={i} className={`ps-canvas-cell ${cell.isOriginal ? 'ps-canvas-cell-original' : ''}`}>
            {/* Cell label */}
            <div className="ps-canvas-cell-header">
              <span className="ps-canvas-cell-label">{cell.label}</span>
              <button
                className="ps-canvas-cell-download"
                onClick={() => {
                  if (cell.isOriginal) {
                    handleDownloadOriginal();
                  } else if (cell.scene) {
                    handleDownloadScene(cell.scene);
                  }
                }}
                title={`Download ${cell.label}`}
              >
                <DownloadIcon size={14} />
              </button>
            </div>

            {/* Image */}
            <div className="ps-canvas-cell-image">
              <img
                src={cell.image}
                alt={`${cell.label} — ${productName}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions — minimal */}
      <div className="ps-canvas-actions">
        <button
          className="nav-link-btn"
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

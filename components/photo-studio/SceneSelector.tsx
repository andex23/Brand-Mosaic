import React from 'react';
import { SceneType, SceneConfig } from '../../types';

interface SceneSelectorProps {
  selectedScenes: SceneType[];
  onChangeSelection: (scenes: SceneType[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}

// ── Scene Configuration (hardcoded per spec) ──────────

export const SCENE_CONFIGS: Record<SceneType, SceneConfig> = {
  studio: {
    type: 'studio',
    label: 'STUDIO',
    description: 'Neutral background, soft even lighting, centered framing. No props, no context.',
    useCase: 'Product pages, catalogs, line sheets',
    rules: {
      backgroundStyle: 'seamless solid neutral background, white or light gray infinity curve',
      lightingStyle: 'soft even studio lighting, no harsh shadows',
      compositionStyle: 'centered composition, product fills 60-70% of frame',
      propsPolicy: 'none',
      negativePromptAdditions: ['props', 'surfaces', 'lifestyle', 'human elements'],
    },
  },
  lifestyle: {
    type: 'lifestyle',
    label: 'LIFESTYLE',
    description: 'Realistic minimal interior, natural light, product in context without distraction.',
    useCase: 'Website storytelling, social media, product features',
    rules: {
      backgroundStyle: 'realistic minimal interior environment',
      lightingStyle: 'natural ambient light, daytime bias',
      compositionStyle: 'product remains primary focus, no clutter',
      propsPolicy: 'minimal-contextual',
      negativePromptAdditions: ['faces', 'bodies', 'busy interiors', 'decorative overload'],
    },
  },
  editorial: {
    type: 'editorial',
    label: 'EDITORIAL',
    description: 'Architectural settings, directional light, asymmetric composition. Restrained authority.',
    useCase: 'Campaigns, lookbooks, editorial features',
    rules: {
      backgroundStyle: 'architectural or spatial settings, minimal materials',
      lightingStyle: 'directional lighting, controlled shadows',
      compositionStyle: 'asymmetry, negative space, unconventional framing',
      propsPolicy: 'architectural-only',
      negativePromptAdditions: ['over-stylization', 'visual noise', 'trend aesthetics'],
    },
  },
};

const SCENE_ICONS: Record<SceneType, string> = {
  studio: '[  ]',
  lifestyle: '[~~]',
  editorial: '[/\\]',
};

const SceneSelector: React.FC<SceneSelectorProps> = ({
  selectedScenes,
  onChangeSelection,
  onConfirm,
  onBack,
}) => {
  const handleToggle = (sceneType: SceneType) => {
    if (selectedScenes.includes(sceneType)) {
      onChangeSelection(selectedScenes.filter(s => s !== sceneType));
    } else if (selectedScenes.length < 3) {
      onChangeSelection([...selectedScenes, sceneType]);
    }
  };

  return (
    <div className="ps-scene-selector">
      <h3 className="ps-section-title">Scene Types</h3>
      <p className="ps-section-desc">
        Select 1 to 3 scenes. One image will be generated per scene.
      </p>

      <div className="ps-scene-grid">
        {(Object.keys(SCENE_CONFIGS) as SceneType[]).map(type => {
          const config = SCENE_CONFIGS[type];
          const isSelected = selectedScenes.includes(type);

          return (
            <div
              key={type}
              className={`ps-scene-card ${isSelected ? 'ps-scene-selected' : ''}`}
              onClick={() => handleToggle(type)}
            >
              <div className="ps-scene-icon">{SCENE_ICONS[type]}</div>
              <div className="ps-scene-label">{config.label}</div>
              <div className="ps-scene-desc">{config.description}</div>
              <div className="ps-scene-usecase">{config.useCase}</div>
              <div className="ps-scene-check">
                {isSelected ? '[x]' : '[ ]'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ps-scene-count">
        {selectedScenes.length} of 3 selected
      </div>

      <div className="ps-nav-buttons">
        <button className="nav-link-btn" onClick={onBack}>
          ← Back
        </button>
        <button
          className="brand-submit-btn"
          onClick={onConfirm}
          disabled={selectedScenes.length === 0}
        >
          {selectedScenes.length === 0
            ? '[ SELECT A SCENE ]'
            : `[ CONTINUE WITH ${selectedScenes.length} SCENE${selectedScenes.length > 1 ? 'S' : ''} ]`}
        </button>
      </div>
    </div>
  );
};

export default SceneSelector;

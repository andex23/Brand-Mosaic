import React, { useState } from 'react';
import BrandHeader from '../BrandHeader';
import ProductInput from './ProductInput';
import BusinessContext from './BusinessContext';
import SceneSelector from './SceneSelector';
import MoodInput from './MoodInput';
import SceneResults from './SceneResults';
import { generateScenes } from '../../lib/sceneGeneration';
import type {
  ProductInputData,
  SceneType,
  MoodInterpretation,
  GeneratedScene,
  BusinessContextData,
} from '../../types';
import type { ErrorOptions } from '../../lib/errors';
import type { User } from '@supabase/supabase-js';

interface PhotoStudioPageProps {
  onBackToDashboard: () => void;
  onGoHome: () => void;
  user: User | null;
  isLocalMode: boolean;
  canGenerate: () => boolean;
  isFreeTier: () => boolean;
  recordGeneration: (
    projectId: string,
    source: 'server' | 'user_provided',
    type: 'brand_kit' | 'logo' | 'scene'
  ) => Promise<boolean>;
  showError: (code: string, options?: ErrorOptions) => void;
  showSuccess: (message: string) => void;
}

type Step = 'input' | 'context' | 'scenes' | 'mood' | 'generating' | 'results';

const STEP_LABELS = ['PRODUCT', 'CONTEXT', 'SCENES', 'MOOD', 'GENERATE'];

function stepIndex(step: Step): number {
  const map: Record<Step, number> = {
    input: 0,
    context: 1,
    scenes: 2,
    mood: 3,
    generating: 4,
    results: 4,
  };
  return map[step];
}

const PhotoStudioPage: React.FC<PhotoStudioPageProps> = ({
  onBackToDashboard,
  onGoHome,
  user,
  isLocalMode,
  canGenerate,
  isFreeTier,
  recordGeneration,
  showError,
  showSuccess,
}) => {
  // Wizard state
  const [step, setStep] = useState<Step>('input');
  const [product, setProduct] = useState<ProductInputData | null>(null);
  const [businessContext, setBusinessContext] = useState<BusinessContextData | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<SceneType[]>([]);
  const [moodText, setMoodText] = useState('');
  const [interpretation, setInterpretation] = useState<MoodInterpretation | null>(null);
  const [results, setResults] = useState<GeneratedScene[]>([]);

  // Generation state
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressScene, setProgressScene] = useState<SceneType | null>(null);

  const currentStepIdx = stepIndex(step);

  // ── Handlers ──────────────────────────────────────

  const handleProductConfirm = (p: ProductInputData) => {
    setProduct(p);
    setStep('context');
  };

  const handleContextConfirm = (ctx: BusinessContextData) => {
    setBusinessContext(ctx);
    setStep('scenes');
  };

  const handleContextSkip = () => {
    setBusinessContext(null);
    setStep('scenes');
  };

  const handleScenesConfirm = () => {
    if (selectedScenes.length === 0) {
      showError('scene/no-scenes-selected');
      return;
    }
    setStep('mood');
  };

  const handleGenerate = async () => {
    if (!product || selectedScenes.length === 0) return;

    // Credit check
    if (!isLocalMode && !canGenerate()) {
      showError('payment/insufficient-credits', {
        message: 'You need credits to generate scenes. Purchase credits to continue.',
      });
      return;
    }

    // Free tier gate
    if (!isLocalMode && isFreeTier()) {
      showError('payment/insufficient-credits', {
        message: 'Photo Studio requires credits. Purchase credits to access scene generation.',
      });
      return;
    }

    // Get API key
    const apiKey = isLocalMode
      ? localStorage.getItem('user_gemini_api_key')
      : import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      showError('api/key-not-found');
      return;
    }

    setStep('generating');
    setProgressTotal(selectedScenes.length);
    setProgressCurrent(0);

    try {
      const generated = await generateScenes(
        {
          product,
          scenes: selectedScenes,
          moodText,
          interpretation: interpretation || {
            temperature: 'neutral',
            energy: 'calm',
            materialBias: 'none',
            lightQuality: 'soft diffused',
            rawInput: '',
            wasOverridden: false,
            overrideNotes: [],
          },
          businessContext: businessContext || undefined,
        },
        apiKey,
        (current, total, sceneType) => {
          setProgressCurrent(current);
          setProgressTotal(total);
          setProgressScene(sceneType);
        },
      );

      setResults(generated);
      setStep('results');

      // Record usage
      if (!isLocalMode) {
        for (const scene of generated) {
          await recordGeneration(`photo-studio-${scene.generatedAt}`, 'server', 'scene');
        }
      }

      showSuccess('Scene photography generated!');
    } catch (err: any) {
      console.error('Scene generation failed:', err);
      showError('scene/generation-failed', {
        message: err.message || 'Scene generation failed. Please try again.',
      });
      setStep('mood'); // Go back to mood step on failure
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setProduct(null);
    setBusinessContext(null);
    setSelectedScenes([]);
    setMoodText('');
    setInterpretation(null);
    setResults([]);
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressScene(null);
  };

  // ── Render ────────────────────────────────────────

  return (
    <div className="brand-page">
      {/* Top Navigation */}
      <div className="nav-top-bar">
        <button onClick={onBackToDashboard} className="nav-link-btn">
          ← DASHBOARD
        </button>
        <button onClick={onGoHome} className="nav-link-btn">
          [ EXIT TO HOME ]
        </button>
      </div>

      <BrandHeader
        onTitleClick={onBackToDashboard}
        subtitle="Photo Studio"
      />

      {/* Step Indicator */}
      <div className="ps-step-indicator">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={`ps-step ${currentStepIdx >= i ? 'ps-step-active' : ''}`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Step Content */}
      {step === 'input' && (
        <ProductInput
          onConfirm={handleProductConfirm}
          isLocalMode={isLocalMode}
          showError={showError}
        />
      )}

      {step === 'context' && (
        <BusinessContext
          context={businessContext}
          onConfirm={handleContextConfirm}
          onBack={() => setStep('input')}
          onSkip={handleContextSkip}
          productName={product?.productName || 'Product'}
        />
      )}

      {step === 'scenes' && (
        <SceneSelector
          selectedScenes={selectedScenes}
          onChangeSelection={setSelectedScenes}
          onConfirm={handleScenesConfirm}
          onBack={() => setStep('context')}
        />
      )}

      {step === 'mood' && (
        <MoodInput
          moodText={moodText}
          onMoodChange={setMoodText}
          interpretation={interpretation}
          onInterpretationChange={setInterpretation}
          selectedScenes={selectedScenes}
          onConfirm={handleGenerate}
          onBack={() => setStep('scenes')}
        />
      )}

      {step === 'generating' && (
        <div className="ps-generating">
          <div className="ps-generating-text">
            Generating {progressScene?.toUpperCase() || ''} scene...
          </div>
          <div className="ps-generating-progress">
            {progressCurrent} of {progressTotal} scenes
          </div>
          <div className="ps-generating-hint">
            This may take 15–30 seconds per scene.
          </div>
        </div>
      )}

      {step === 'results' && (
        <SceneResults
          results={results}
          productName={product?.productName || 'Product'}
          originalImage={product?.imageBase64 || ''}
          onStartOver={handleStartOver}
          onBackToDashboard={onBackToDashboard}
        />
      )}
    </div>
  );
};

export default PhotoStudioPage;

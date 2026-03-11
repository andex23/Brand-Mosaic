import React, { useEffect, useRef, useState } from 'react';
import BrandHeader from './BrandHeader';
import BrandForm from './BrandForm';
import GenerationStatusCard from './GenerationStatusCard';
import { BrandFormData, GenerationStatusNotice } from '../types';
import { defaultBrandFormData } from '../lib/brandWorkbook';

interface BrandFormPageProps {
  initialData?: BrandFormData;
  projectName?: string;
  onSaveAndAnalyze: (data: BrandFormData) => Promise<void>;
  onSaveDraft: (data: BrandFormData) => Promise<void>;
  onBack: () => void;
  onSignOut: () => void;
  isAnalyzing: boolean;
  generationStatus: GenerationStatusNotice;
  onDismissGenerationStatus: () => void;
}

const BrandFormPage: React.FC<BrandFormPageProps> = ({
  initialData,
  projectName,
  onSaveAndAnalyze,
  onSaveDraft,
  onBack,
  onSignOut,
  isAnalyzing,
  generationStatus,
  onDismissGenerationStatus,
}) => {
  const [formData, setFormData] = useState<BrandFormData>(defaultBrandFormData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const lastSavedData = useRef<BrandFormData>(initialData || defaultBrandFormData);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    const resolvedData = initialData || defaultBrandFormData;
    setFormData(resolvedData);
    lastSavedData.current = resolvedData;
    hasInitialized.current = true;
  }, [initialData]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (JSON.stringify(formData) !== JSON.stringify(lastSavedData.current) && !isSavingRef.current) {
      setSaveStatus((current) => (current === 'saving' ? current : 'dirty'));
    }

    const timer = setTimeout(async () => {
      if (isSavingRef.current) return;
      if (JSON.stringify(formData) === JSON.stringify(lastSavedData.current)) return;

      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        await onSaveDraft(formData);
        lastSavedData.current = formData;
        setLastSavedAt(new Date().toISOString());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [formData, onSaveDraft]);

  const handleFormSubmit = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await onSaveAndAnalyze(formData);
  };

  const handleManualSave = async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      await onSaveDraft(formData);
      lastSavedData.current = formData;
      setLastSavedAt(new Date().toISOString());
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  };

  return (
    <div className="brand-page">
      <div className="nav-top-bar">
        <button onClick={onBack} className="nav-link-btn">
          ← DASHBOARD
        </button>
        <button onClick={onSignOut} className="nav-link-btn">
          [ SIGN OUT ]
        </button>
      </div>

      <BrandHeader
        onTitleClick={onBack}
        subtitle={projectName || formData.brandName ? `Editing: ${projectName || formData.brandName}` : 'Defining your identity'}
      />

      <GenerationStatusCard
        status={generationStatus}
        onDismiss={onDismissGenerationStatus}
      />

      <BrandForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
        onSaveDraft={handleManualSave}
        isAnalyzing={isAnalyzing}
        generationPhase={generationStatus.phase}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
      />
    </div>
  );
};

export default BrandFormPage;

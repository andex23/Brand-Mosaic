import React, { useState, useEffect, useRef } from 'react';
import BrandHeader from './BrandHeader';
import BrandForm from './BrandForm';
import { BrandFormData } from '../types';

interface BrandFormPageProps {
  initialData?: BrandFormData;
  onSaveAndAnalyze: (data: BrandFormData) => void;
  onSaveDraft: (data: BrandFormData, exit?: boolean) => void;
  onBack: () => void;
  onGoHome: () => void;
  isAnalyzing: boolean;
}

const defaultFormData: BrandFormData = {
  brandName: '',
  offering: '',
  purpose: '',
  problem: '',
  tone: [],
  feeling: '',
  adjectives: '',
  palette: '',
  customPalette: '',
  customColor1: '#000000',
  customColor2: '#ffffff',
  vibe: [],
  customVibe: '',
  moodBoardKeywords: '',
  typography: '',
  customFont: '',
  audience: [],
  customerCare: '',
  differentiation: '',
  competitors: '',
  tagline: '',
  logoExists: '',
  logoPreference: '',
  fashion: '',
  soundtrack: '',
  inspiration: '',
};

const BrandFormPage: React.FC<BrandFormPageProps> = ({ 
  initialData, 
  onSaveAndAnalyze,
  onSaveDraft,
  onBack,
  onGoHome,
  isAnalyzing
}) => {
  const [formData, setFormData] = useState<BrandFormData>(defaultFormData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const hasInitialized = useRef(false);
  const lastSavedData = useRef<BrandFormData>(initialData || defaultFormData);

  useEffect(() => {
    if (initialData && !hasInitialized.current) {
      setFormData(initialData);
      lastSavedData.current = initialData;
      hasInitialized.current = true;
    } else if (!initialData && !hasInitialized.current) {
       hasInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(formData) !== JSON.stringify(lastSavedData.current)) {
        setSaveStatus('saving');
        onSaveDraft(formData, false);
        lastSavedData.current = formData;
        setTimeout(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }, 600);
      }
    }, 3000); // 3 second debounce for autosave

    return () => clearTimeout(timer);
  }, [formData, onSaveDraft]);

  const handleFormSubmit = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onSaveAndAnalyze(formData);
  };

  const handleManualSave = () => {
    setSaveStatus('saving');
    onSaveDraft(formData, false);
    lastSavedData.current = formData;
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  return (
    <div className="brand-page">
      <div className="nav-top-bar">
        <button onClick={onBack} className="nav-link-btn">
          ← DASHBOARD
        </button>
        <button onClick={onGoHome} className="nav-link-btn">
          [ EXIT TO HOME ]
        </button>
      </div>
      
      <BrandHeader 
        onTitleClick={onBack} 
        subtitle={formData.brandName ? `Editing: ${formData.brandName}` : 'Defining your identity'}
      />
      
      <BrandForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
        onSaveDraft={handleManualSave}
        isAnalyzing={isAnalyzing}
        saveStatus={saveStatus}
      />
    </div>
  );
};

export default BrandFormPage;
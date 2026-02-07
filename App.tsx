import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BrandFormPage from './components/BrandFormPage';
import BrandKit from './components/BrandKit';
import HomePage from './components/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorToast from './components/ErrorToast';
import { BrandFormData, BrandKit as BrandKitType, BrandProject, KitSectionId, BrandKitLocks } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './lib/supabase';
import { useError } from './hooks/useError';
import { useUsage } from './hooks/useUsage';
import type { User } from '@supabase/supabase-js';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Generate limited prompt for free tier users
const generateLimitedPrompt = (data: BrandFormData): string => {
  return `Analyze this brand data and generate a BASIC JSON brand kit with LIMITED fields: ${JSON.stringify(data)}
  
  Only include these fields:
  - brandEssence (brief, max 50 words)
  - summaryParagraph (brief, max 100 words)
  - keywords (max 3)
  - toneOfVoice (max 3)
  - suggestedTagline
  - colorPaletteSuggestions (max 2 colors only)
  
  DO NOT include: brandArchetype, visualDirection, fontPairing, logoPrompt, targetAudienceSummary.`;
};

// Generate full prompt for paid users
const generateFullPrompt = (data: BrandFormData): string => {
  return `Analyze this brand data and generate a comprehensive JSON brand kit: ${JSON.stringify(data)}
  
  Include all fields with rich, detailed content.`;
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'form' | 'kit'>('home');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Ephemeral shared project for anonymous viewers
  const [sharedProject, setSharedProject] = useState<BrandProject | null>(null);

  const { toasts, showError, showSuccess, removeToast } = useError();
  const { profile, canGenerate, isFreeTier, recordGeneration } = useUsage(user, isLocalMode);

  useEffect(() => {
    // Always start from home page - don't auto-load local sessions
    // Users must explicitly choose to continue
    
    if (!supabase) {
      // Supabase not configured, stay on home
      setAuthLoading(false);
      setCurrentView('home');
      return;
    }

    // Get initial session for authenticated users
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        // Only auto-redirect if user is authenticated with Supabase
        setIsLocalMode(false);
        loadProjectsForUser(session.user.id);
        setCurrentView('dashboard');
      } else {
        // No session, show home page
        setCurrentView('home');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLocalMode(false);
        loadProjectsForUser(session.user.id);
        setCurrentView('dashboard');
      } else {
        setProjects([]);
        setIsLocalMode(false);
        setCurrentView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProjectsForUser = (uid: string) => {
    const saved = localStorage.getItem(`brand_projects_${uid}`);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse projects", e);
        showError('db/load-failed');
      }
    }
  };

  // Parse share link - works for both anonymous and authenticated users
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const json = decodeURIComponent(Array.prototype.map.call(atob(shareData), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const parsed: BrandProject = JSON.parse(json);
        
        if (user || isLocalMode) {
          // Authenticated/local user: check if already exists, otherwise save
          const savedProjects = [...projects];
          const exists = savedProjects.find(p => p.createdAt === parsed.createdAt);
          if (exists) {
            setCurrentProjectId(exists.id);
            setSharedProject(null);
          } else {
            const newProject: BrandProject = {
              ...parsed,
              id: `shared-${Date.now()}`,
              kitLocks: parsed.kitLocks || {},
            };
            setProjects([newProject, ...savedProjects]);
            setCurrentProjectId(newProject.id);
            setSharedProject(null);
          }
          showSuccess('Shared project loaded!');
        } else {
          // Anonymous user: show ephemeral read-only view
          setSharedProject({
            ...parsed,
            kitLocks: parsed.kitLocks || {},
          });
        }
        setCurrentView('kit');
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error("Error parsing share link", e);
        showError('db/load-failed');
      }
    }
  }, [user, isLocalMode]);
  
  // Auto-import pending shared kit after auth/local start
  useEffect(() => {
    if ((user || isLocalMode) && !authLoading) {
      const pendingData = sessionStorage.getItem('pending_shared_project');
      if (pendingData) {
        try {
          const pending: BrandProject = JSON.parse(pendingData);
          const newProject: BrandProject = {
            ...pending,
            id: `imported-${Date.now()}`,
            name: `${pending.name} (Copy)`,
          };
          setProjects(prev => [newProject, ...prev]);
          setCurrentProjectId(newProject.id);
          setCurrentView('kit');
          sessionStorage.removeItem('pending_shared_project');
          showSuccess('Project duplicated to your dashboard!');
        } catch (e) {
          console.error("Error importing pending project", e);
        }
      }
    }
  }, [user, isLocalMode, authLoading]);
  
  // Handle duplicate shared kit
  const handleDuplicateShared = () => {
    const projectToDuplicate = sharedProject || projects.find(p => p.id === currentProjectId);
    if (!projectToDuplicate) return;
    
    if (user || isLocalMode) {
      // Clone into projects immediately
      const newProject: BrandProject = {
        ...projectToDuplicate,
        id: `copy-${Date.now()}`,
        name: `${projectToDuplicate.name} (Copy)`,
        createdAt: Date.now(),
      };
      setProjects(prev => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
      setSharedProject(null);
      setCurrentView('kit');
      showSuccess('Project duplicated!');
    } else {
      // Anonymous: store in sessionStorage and redirect to home
      sessionStorage.setItem('pending_shared_project', JSON.stringify(projectToDuplicate));
      setSharedProject(null);
      setCurrentView('home');
      showSuccess('Sign in or start local to save this kit!');
    }
  };

  useEffect(() => {
    const uid = user ? user.id : (isLocalMode ? 'local-guest' : null);
    if (uid && !authLoading) {
      localStorage.setItem(`brand_projects_${uid}`, JSON.stringify(projects));
    }
  }, [projects, user, isLocalMode, authLoading]);

  const handleCreateNew = () => {
    setCurrentProjectId(null);
    setCurrentView('form');
  };

  const handleSelectProject = (project: BrandProject) => {
    setCurrentProjectId(project.id);
    setCurrentView(project.brandKit ? 'kit' : 'form');
  };

  const handleSaveDraft = (data: BrandFormData, exit: boolean = false) => {
    let projectId = currentProjectId;
    let newProjects = [...projects];
    if (!projectId) {
      projectId = generateId();
      const newProject: BrandProject = { id: projectId, name: data.brandName || 'Untitled', createdAt: Date.now(), formData: data };
      newProjects = [newProject, ...newProjects];
      setCurrentProjectId(projectId);
    } else {
      newProjects = newProjects.map(p => p.id === projectId ? { ...p, formData: data, name: data.brandName || p.name } : p);
    }
    setProjects(newProjects);
    if (exit) {
      setCurrentProjectId(null);
      setCurrentView('dashboard');
    }
  };

  const handleSaveAndAnalyze = async (data: BrandFormData) => {
    // Check if user can generate (has credits)
    if (!isLocalMode && !canGenerate()) {
      showError('payment/insufficient-credits', {
        message: 'You have no available generations. Please purchase credits to continue.',
      });
      return;
    }

    setIsAnalyzing(true);
    let projectId = currentProjectId || generateId();
    let newProjects = [...projects];
    if (!currentProjectId) {
      newProjects = [{ id: projectId, name: data.brandName || 'Untitled', createdAt: Date.now(), formData: data }, ...newProjects];
    } else {
      newProjects = newProjects.map(p => p.id === projectId ? { ...p, formData: data, name: data.brandName || p.name } : p);
    }
    setProjects(newProjects);
    setCurrentProjectId(projectId);

    try {
      const isFree = !isLocalMode && isFreeTier();
      const prompt = isFree ? generateLimitedPrompt(data) : generateFullPrompt(data);
      
      // Get API key: local mode uses localStorage, cloud mode uses env var
      const apiKey = isLocalMode 
        ? localStorage.getItem('user_gemini_api_key') 
        : import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found. Please check your configuration.');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandEssence: { type: Type.STRING },
              summaryParagraph: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              toneOfVoice: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetAudienceSummary: { type: Type.STRING },
              visualDirection: { type: Type.STRING },
              brandArchetype: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, explanation: { type: Type.STRING } } },
              suggestedTagline: { type: Type.STRING },
              colorPaletteSuggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, usage: { type: Type.STRING } } } },
              fontPairing: { type: Type.OBJECT, properties: { headlineFont: { type: Type.STRING }, bodyFont: { type: Type.STRING }, note: { type: Type.STRING } } },
              logoPrompt: { type: Type.STRING },
            }
          }
        }
      });

      if (response.text) {
        let kit: BrandKitType = JSON.parse(response.text);
        
        // Preserve locked fields from previous kit
        const existingProject = projects.find(p => p.id === projectId);
        if (existingProject?.brandKit && existingProject.kitLocks) {
          const locks = existingProject.kitLocks;
          const prevKit = existingProject.brandKit;
          
          if (locks.brandEssence && prevKit.brandEssence) {
            kit = { ...kit, brandEssence: prevKit.brandEssence };
          }
          if (locks.summaryParagraph && prevKit.summaryParagraph) {
            kit = { ...kit, summaryParagraph: prevKit.summaryParagraph };
          }
          if (locks.keywords && prevKit.keywords) {
            kit = { ...kit, keywords: prevKit.keywords };
          }
          if (locks.toneOfVoice && prevKit.toneOfVoice) {
            kit = { ...kit, toneOfVoice: prevKit.toneOfVoice };
          }
          if (locks.brandArchetype && prevKit.brandArchetype) {
            kit = { ...kit, brandArchetype: prevKit.brandArchetype };
          }
          if (locks.suggestedTagline && prevKit.suggestedTagline) {
            kit = { ...kit, suggestedTagline: prevKit.suggestedTagline };
          }
          if (locks.colorPaletteSuggestions && prevKit.colorPaletteSuggestions) {
            kit = { ...kit, colorPaletteSuggestions: prevKit.colorPaletteSuggestions };
          }
          if (locks.fontPairing && prevKit.fontPairing) {
            kit = { ...kit, fontPairing: prevKit.fontPairing };
          }
          if (locks.logoPrompt && prevKit.logoPrompt) {
            kit = { ...kit, logoPrompt: prevKit.logoPrompt };
          }
        }
        
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, brandKit: kit } : p));
        
        // Record generation (deduct credit)
        if (!isLocalMode) {
          await recordGeneration(projectId, 'server', 'brand_kit');
        }
        
        if (isFree) {
          showSuccess('Free trial brand kit generated! Upgrade to unlock all features.');
        } else {
          showSuccess('Brand kit generated successfully!');
        }
        
        setCurrentView('kit');
      }
    } catch (e: any) {
      console.error("AI Analysis failed", e);
      
      if (e.message?.includes('API key')) {
        showError('api/invalid-key');
      } else if (e.message?.includes('rate limit') || e.message?.includes('429')) {
        showError('api/rate-limit');
      } else if (e.message?.includes('quota')) {
        showError('api/quota-exceeded');
      } else {
        showError('api/generation-failed');
      }
      
      // Use mock data as fallback
      console.warn("Using mock data due to API failure.");
      const mockKit: BrandKitType = {
          "brandEssence": "EcoSip is the intersection of sustainability and smart technology, offering a refreshing, clean, and guilt-free hydration experience for the modern, eco-conscious individual.",
          "summaryParagraph": "EcoSip represents a commitment to a cleaner planet without compromising on convenience or style. By integrating self-cleaning UV-C technology into a sleek, sustainable vessel, EcoSip empowers users to stay hydrated and healthy while actively reducing plastic waste. The brand exudes a sense of purity, innovation, and responsibility, appealing to those who value both personal health and environmental stewardship.",
          "keywords": ["Sustainable", "Innovative", "Pure", "Minimalist", "Conscious"],
          "toneOfVoice": ["Informative but not preachy", "Optimistic", "Clean and direct", "Empowering"],
          "targetAudienceSummary": "Primary audience consists of health-conscious Millennials and Gen Z individuals who prioritize sustainability and tech-enabled convenience. They are active, urban-dwelling, and willing to invest in quality products that align with their values.",
          "visualDirection": "A clean, nature-inspired aesthetic that blends organic tones (Forest Green, Clay) with modern, sanitary whites and greys. The design language should be minimal, highlighting the product's technology and eco-friendly materials.",
          "brandArchetype": {
            "name": "The Creator / The Caregiver",
            "explanation": "EcoSip embodies the Creator through its innovative product design and the Caregiver through its mission to protect the planet and the user's health."
          },
          "suggestedTagline": "Purity in Every Sip.",
          "colorPaletteSuggestions": [
            { "name": "Forest Canopy", "hex": "#2E4A3D", "usage": "Primary brand color, logos, headers" },
            { "name": "Clay Earth", "hex": "#CCA483", "usage": "Accent color, buttons, highlights" },
            { "name": "Clean White", "hex": "#F5F5F5", "usage": "Backgrounds, white space" },
            { "name": "Slate Tech", "hex": "#4A5568", "usage": "Text, details" }
          ],
          "fontPairing": {
            "headlineFont": "Inter or Helvetica Now",
            "bodyFont": "Roboto or Open Sans",
            "note": "Clean, legible sans-serifs that convey modernity and simplicity."
          },
          "logoPrompt": "A minimalist line-art icon depicting a water drop merging with a leaf, enclosed in a circle. Clean strokes, forest green color. No text in the icon."
      };
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, brandKit: mockKit } : p));
      setCurrentView('kit');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Compute active project: sharedProject takes precedence for anonymous viewers
  const activeProject = sharedProject || projects.find(p => p.id === currentProjectId);
  const isViewingShared = !!sharedProject;

  // Lock toggle handler
  const handleToggleLock = (sectionId: KitSectionId) => {
    if (!currentProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        const currentLocks = p.kitLocks || {};
        return {
          ...p,
          kitLocks: {
            ...currentLocks,
            [sectionId]: !currentLocks[sectionId]
          }
        };
      }
      return p;
    }));
  };

  // Section regeneration handler (Brand Essence only for now)
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleRegenerateSection = async (sectionId: KitSectionId) => {
    // Only Brand Essence supported for now
    if (sectionId !== 'brandEssence') return;
    
    // Check permissions
    if (!isLocalMode && isFreeTier()) {
      showError('payment/insufficient-credits', {
        message: 'Section regeneration is a paid feature. Please upgrade to continue.',
      });
      return;
    }

    if (!activeProject?.brandKit || !activeProject.formData) {
      showError('unknown', { message: 'No brand kit to regenerate.' });
      return;
    }

    setIsRegenerating(true);

    try {
      const apiKey = isLocalMode 
        ? localStorage.getItem('user_gemini_api_key') 
        : import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found.');
      }

      const prompt = `Based on this brand data: ${JSON.stringify(activeProject.formData)}
      
And the current brand kit context: ${JSON.stringify(activeProject.brandKit)}

Generate ONLY a new brand essence (a single sentence capturing the core identity of this brand). Return JSON with only the brandEssence field.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandEssence: { type: Type.STRING }
            }
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        if (result.brandEssence) {
          setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId && p.brandKit) {
              return {
                ...p,
                brandKit: {
                  ...p.brandKit,
                  brandEssence: result.brandEssence
                }
              };
            }
            return p;
          }));
          showSuccess('Brand Essence regenerated!');
        }
      }
    } catch (e: any) {
      console.error("Section regeneration failed", e);
      showError('api/generation-failed', { message: 'Failed to regenerate section. Please try again.' });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (authLoading) return <div className="brand-page" style={{ textAlign: 'center' }}>[ LOADING MOSAIC... ]</div>;

  return (
    <>
      <ErrorToast toasts={toasts} onDismiss={removeToast} />
      {currentView === 'home' && <HomePage onLocalStart={() => { localStorage.setItem('brand_local_user', 'true'); setIsLocalMode(true); setCurrentView('dashboard'); loadProjectsForUser('local-guest'); }} />}
      {currentView === 'dashboard' && <Dashboard projects={projects} onCreateNew={handleCreateNew} onSelectProject={handleSelectProject} onDeleteProject={(id, e) => { e.stopPropagation(); if (confirm('Delete?')) setProjects(prev => prev.filter(p => p.id !== id)); }} onDownloadProject={(p, e) => { e.stopPropagation(); const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${p.name}.json`; a.click(); showSuccess('Project downloaded!'); }} onGoHome={() => setCurrentView('home')} isLocalMode={isLocalMode} onExitLocal={() => { localStorage.removeItem('brand_local_user'); setIsLocalMode(false); setCurrentView('home'); }} user={user} />}
      {currentView === 'form' && <BrandFormPage initialData={activeProject?.formData} onSaveAndAnalyze={handleSaveAndAnalyze} onSaveDraft={handleSaveDraft} onBack={() => setCurrentView('dashboard')} onGoHome={() => setCurrentView('home')} isAnalyzing={isAnalyzing} />}
      {currentView === 'kit' && activeProject?.brandKit && <BrandKit kit={activeProject.brandKit} formData={activeProject.formData} onEdit={() => setCurrentView('form')} onBackToDashboard={() => setCurrentView('dashboard')} onGoHome={() => setCurrentView('home')} readOnly={isViewingShared || activeProject.id.startsWith('shared-')} isFreeTier={!isLocalMode && isFreeTier()} user={user} isLocalMode={isLocalMode} projectId={isViewingShared ? null : currentProjectId} kitLocks={activeProject.kitLocks || {}} onToggleLock={handleToggleLock} onRegenerateSection={handleRegenerateSection} isRegenerating={isRegenerating} onDuplicate={handleDuplicateShared} />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
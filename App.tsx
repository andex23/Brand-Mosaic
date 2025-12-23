import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BrandFormPage from './components/BrandFormPage';
import BrandKit from './components/BrandKit';
import HomePage from './components/HomePage';
import { BrandFormData, BrandKit as BrandKitType, BrandProject } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'form' | 'kit'>('home');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      const localUser = localStorage.getItem('brand_local_user');
      if (localUser) {
        setIsLocalMode(true);
        loadProjectsForUser('local-guest');
        setCurrentView('dashboard');
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setIsLocalMode(false);
        loadProjectsForUser(currentUser.uid);
        setCurrentView('dashboard');
      } else {
        setProjects([]);
        setCurrentView('home');
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProjectsForUser = (uid: string) => {
    const saved = localStorage.getItem(`brand_projects_${uid}`);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const json = decodeURIComponent(Array.prototype.map.call(atob(shareData), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const sharedProject: BrandProject = JSON.parse(json);
        if (user || isLocalMode) {
          const uid = user ? user.uid : 'local-guest';
          const savedProjects = [...projects];
          const exists = savedProjects.find(p => p.createdAt === sharedProject.createdAt);
          if (exists) {
            setCurrentProjectId(exists.id);
            setCurrentView('kit');
          } else {
            sharedProject.id = `shared-${Date.now()}`;
            setProjects([sharedProject, ...savedProjects]);
            setCurrentProjectId(sharedProject.id);
            setCurrentView('kit');
          }
        }
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error("Error sharing", e);
      }
    }
  }, [user, isLocalMode]);

  useEffect(() => {
    const uid = user ? user.uid : (isLocalMode ? 'local-guest' : null);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this brand data and generate a JSON brand kit: ${JSON.stringify(data)}`,
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
        const kit: BrandKitType = JSON.parse(response.text);
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, brandKit: kit } : p));
        setCurrentView('kit');
      }
    } catch (e) {
      alert("AI Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeProject = projects.find(p => p.id === currentProjectId);

  if (authLoading) return <div className="brand-page" style={{ textAlign: 'center' }}>[ LOADING MOSAIC... ]</div>;

  return (
    <>
      {currentView === 'home' && <HomePage onLocalStart={() => { localStorage.setItem('brand_local_user', 'true'); setIsLocalMode(true); setCurrentView('dashboard'); loadProjectsForUser('local-guest'); }} />}
      {currentView === 'dashboard' && <Dashboard projects={projects} onCreateNew={handleCreateNew} onSelectProject={handleSelectProject} onDeleteProject={(id, e) => { e.stopPropagation(); if (confirm('Delete?')) setProjects(prev => prev.filter(p => p.id !== id)); }} onDownloadProject={(p, e) => { e.stopPropagation(); const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${p.name}.json`; a.click(); }} onGoHome={() => setCurrentView('home')} isLocalMode={isLocalMode} onExitLocal={() => { localStorage.removeItem('brand_local_user'); setIsLocalMode(false); setCurrentView('home'); }} />}
      {currentView === 'form' && <BrandFormPage initialData={activeProject?.formData} onSaveAndAnalyze={handleSaveAndAnalyze} onSaveDraft={handleSaveDraft} onBack={() => setCurrentView('dashboard')} onGoHome={() => setCurrentView('home')} isAnalyzing={isAnalyzing} />}
      {currentView === 'kit' && activeProject?.brandKit && <BrandKit kit={activeProject.brandKit} formData={activeProject.formData} onEdit={() => setCurrentView('form')} onBackToDashboard={() => setCurrentView('dashboard')} onGoHome={() => setCurrentView('home')} readOnly={activeProject.id.startsWith('shared-')} />}
    </>
  );
};

export default App;
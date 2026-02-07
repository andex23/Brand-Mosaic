import React, { useState } from 'react';
import { BrandKit as BrandKitType, BrandFormData, BrandKitLocks, KitSectionId } from '../types';
import BrandHeader from './BrandHeader';
import BrandSummary from './BrandSummary';
import LogoGenerator from './LogoGenerator';
import LogoDisplay from './LogoDisplay';
import PaymentModal from './PaymentModal';
import { useError } from '../hooks/useError';
import { useUsage } from '../hooks/useUsage';
import { generateLogo } from '../lib/logoGeneration';
import { saveLogoToProject } from '../lib/projects';
import type { User } from '@supabase/supabase-js';

interface BrandKitProps {
  kit: BrandKitType;
  formData: BrandFormData;
  onEdit: () => void;
  onBackToDashboard: () => void;
  onGoHome: () => void;
  readOnly?: boolean;
  isFreeTier?: boolean;
  user: User | null;
  isLocalMode?: boolean;
  projectId: string | null;
  kitLocks?: BrandKitLocks;
  onToggleLock?: (sectionId: KitSectionId) => void;
  onRegenerateSection?: (sectionId: KitSectionId) => void;
  isRegenerating?: boolean;
  onDuplicate?: () => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  contentToCopy?: string;
  sectionId?: KitSectionId;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  canRegenerate?: boolean;
}

const BrandKitSection: React.FC<SectionProps> = ({ 
  title, 
  children, 
  contentToCopy,
  sectionId,
  isLocked = false,
  onToggleLock,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
    }
  };

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock?.();
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked && !isRegenerating) {
      onRegenerate?.();
    }
  };

  return (
    <div className={`kit-section ${isLocked ? 'kit-section-locked' : ''}`}>
      <div className="kit-section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="kit-section-title">
          {title} <span className="kit-toggle-icon">{isOpen ? '[-]' : '[+]'}</span>
        </div>
        <div className="kit-section-actions">
          {onToggleLock && (
            <button 
              onClick={handleLockToggle} 
              className={`kit-lock-btn ${isLocked ? 'locked' : ''}`}
              title={isLocked ? 'Unlock section' : 'Lock section'}
            >
              {isLocked ? '[LOCKED]' : '[LOCK]'}
            </button>
          )}
          {canRegenerate && onRegenerate && (
            <button 
              onClick={handleRegenerate} 
              className="kit-regen-btn"
              disabled={isLocked || isRegenerating}
              title={isLocked ? 'Unlock to regenerate' : 'Regenerate this section'}
            >
              {isRegenerating ? '[...]' : '[REGEN]'}
            </button>
          )}
          {contentToCopy && (
            <button onClick={handleCopy} className="kit-copy-btn">
              [COPY]
            </button>
          )}
        </div>
      </div>
      <div className={`kit-section-body ${isOpen ? '' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

const BrandKit: React.FC<BrandKitProps> = ({ 
  kit, 
  formData, 
  onEdit, 
  onBackToDashboard, 
  onGoHome, 
  readOnly = false,
  isFreeTier = false,
  user,
  isLocalMode = false,
  projectId,
  kitLocks = {},
  onToggleLock,
  onRegenerateSection,
  isRegenerating = false,
  onDuplicate,
}) => {
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const { showError, showSuccess } = useError();
  const { recordGeneration, refresh } = useUsage(user, isLocalMode);

  const handleGenerateLogo = async (options: {
    prompt: string;
    style: string;
    aspectRatio: string;
  }) => {
    // Check if feature is available
    if (isFreeTier && !isLocalMode) {
      showError('payment/insufficient-credits', {
        message: 'Logo generation is available for paid users. Please upgrade to continue.',
      });
      return;
    }

    if (!projectId) {
      showError('unknown', { message: 'Project not found. Please save your brand kit first.' });
      return;
    }

    setIsGeneratingLogo(true);

    try {
      // Get API key for logo generation
      const apiKey = isLocalMode 
        ? localStorage.getItem('user_gemini_api_key') 
        : import.meta.env.VITE_GEMINI_API_KEY;
      
      const result = await generateLogo({
        prompt: options.prompt,
        style: options.style as any,
        aspectRatio: options.aspectRatio as any,
        colorPalette: kit.colorPaletteSuggestions?.map(c => c.hex) || [],
        apiKey: apiKey || undefined,
      });

      if (result.imageUrl) {
        setGeneratedLogoUrl(result.imageUrl);
        
        // Save logo to project
        await saveLogoToProject(projectId, result.imageUrl);
        
        // Record generation for non-local users
        if (!isLocalMode && user) {
          await recordGeneration(projectId, 'server', 'logo');
        }
        
        showSuccess('Logo generated successfully!');
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Logo generation error:', error);
      if (error.message?.includes('prompt')) {
        showError('api/logo-invalid-prompt');
      } else {
        showError('api/logo-generation-failed');
      }
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleShare = async () => {
    const projectData = {
      id: 'shared-brand',
      name: formData.brandName,
      createdAt: Date.now(),
      formData: formData,
      brandKit: kit,
      kitLocks: kitLocks, // Include locks in share payload
    };

    try {
      const json = JSON.stringify(projectData);
      const base64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
      const url = `${window.location.origin}${window.location.pathname}?share=${base64}`;
      await navigator.clipboard.writeText(url);
      showSuccess('Shareable link copied to clipboard!');
    } catch (e) {
      showError('unknown', { message: 'Failed to generate shareable link.' });
    }
  };

  return (
    <div className="brand-page">
      <div className="nav-top-bar">
        {!readOnly ? (
          <button onClick={onBackToDashboard} className="nav-link-btn">
            ← DASHBOARD
          </button>
        ) : (
          <button onClick={onGoHome} className="nav-link-btn">
            ← HOME
          </button>
        )}
        {/* Hide SHARE/PRINT for read-only shared views */}
        {!readOnly && (
          <div className="nav-actions">
            <button onClick={handleShare} className="nav-link-btn">
              [SHARE]
            </button>
            <button onClick={() => window.print()} className="nav-link-btn">
              [PRINT]
            </button>
          </div>
        )}
      </div>

      <BrandHeader 
        onTitleClick={!readOnly ? onBackToDashboard : onGoHome} 
        subtitle={formData.brandName ? `Brand Identity: ${formData.brandName}` : 'The Mosaic Output'}
      />

      <div className="kit-container">
        
        <BrandKitSection 
          title="Brand Essence" 
          contentToCopy={kit.brandEssence}
          sectionId="brandEssence"
          isLocked={kitLocks.brandEssence}
          onToggleLock={!readOnly && onToggleLock ? () => onToggleLock('brandEssence') : undefined}
          onRegenerate={!readOnly && onRegenerateSection ? () => onRegenerateSection('brandEssence') : undefined}
          isRegenerating={isRegenerating}
          canRegenerate={!readOnly && !isFreeTier}
        >
          <div className="kit-essence">{kit.brandEssence}</div>
        </BrandKitSection>

        <BrandKitSection title="Summary" contentToCopy={kit.summaryParagraph}>
          <div className="kit-paragraph">{kit.summaryParagraph}</div>
          <div className="kit-keywords">
            {kit.keywords?.map((k, i) => (
              <span key={i} className="kit-keyword">{k}</span>
            ))}
          </div>
        </BrandKitSection>

        <div className="kit-grid">
           <BrandKitSection title="Archetype">
             <div className="kit-archetype-name">{kit.brandArchetype?.name}</div>
             <div className="kit-archetype-desc">{kit.brandArchetype?.explanation}</div>
           </BrandKitSection>

           <BrandKitSection title="Tone of Voice">
             <ul className="kit-tone-list">
               {kit.toneOfVoice?.map((tone, i) => (
                 <li key={i}>{tone}</li>
               ))}
             </ul>
           </BrandKitSection>
        </div>

        <BrandKitSection title="Color Palette">
          <div className="kit-colors-grid">
            {kit.colorPaletteSuggestions?.map((color, i) => (
              <div key={i} className="kit-color-item">
                <div className="kit-swatch" style={{ backgroundColor: color.hex }}></div>
                <div className="kit-color-info">
                  <span className="kit-color-name">{color.name}</span>
                  <span className="kit-color-hex">{color.hex}</span>
                  <span className="kit-color-usage">{color.usage}</span>
                </div>
              </div>
            ))}
          </div>
        </BrandKitSection>

        <div className="kit-grid">
          <BrandKitSection title="Typography">
            <div className="kit-typography-box">
              <div className="kit-font-label">Headline</div>
              <div className="kit-font-headline">{kit.fontPairing?.headlineFont}</div>
              <div className="kit-font-label">Body</div>
              <div className="kit-font-body">{kit.fontPairing?.bodyFont}</div>
              <div className="kit-font-note">{kit.fontPairing?.note}</div>
            </div>
          </BrandKitSection>

          <BrandKitSection title="Tagline" contentToCopy={kit.suggestedTagline}>
            <div className="kit-tagline">"{kit.suggestedTagline}"</div>
          </BrandKitSection>
        </div>

        {!isFreeTier && kit.logoPrompt && (
          <BrandKitSection title="Logo Visual Prompt" contentToCopy={kit.logoPrompt}>
             <div className="kit-logo-prompt">
               {kit.logoPrompt}
             </div>
          </BrandKitSection>
        )}

        {!readOnly && !isFreeTier && kit.logoPrompt && (
          <LogoGenerator
            logoPrompt={kit.logoPrompt}
            onGenerate={handleGenerateLogo}
            isGenerating={isGeneratingLogo}
            disabled={isFreeTier && !isLocalMode}
          />
        )}

        {generatedLogoUrl && (
          <LogoDisplay
            logoUrl={generatedLogoUrl}
            onRegenerate={() => {
              setGeneratedLogoUrl(null);
            }}
            onDownload={() => showSuccess('Logo downloaded!')}
            isGenerating={isGeneratingLogo}
          />
        )}

        {isFreeTier && !isLocalMode && (
          <div className="kit-upgrade-box">
            <h3 className="kit-upgrade-title">[ UPGRADE TO UNLOCK ]</h3>
            <p className="kit-upgrade-text">
              Get access to full brand analysis, logo generation, and more features for just $5.
            </p>
            <button 
              className="brand-submit-btn"
              onClick={() => setShowPaymentModal(true)}
              disabled={!user}
            >
              [ PURCHASE CREDITS ]
            </button>
          </div>
        )}

        <BrandKitSection title="Original Input Recap">
          <BrandSummary formData={formData} onEdit={onEdit} readOnly={readOnly} />
        </BrandKitSection>

      </div>

      <div className="brand-actions kit-actions">
        {readOnly ? (
          <button onClick={onDuplicate} className="brand-submit-btn kit-duplicate-btn">
            [ DUPLICATE THIS KIT ]
          </button>
        ) : (
          <button onClick={handleShare} className="brand-submit-btn kit-share-btn">
            [ COPY LINK ]
          </button>
        )}
      </div>

      {showPaymentModal && user && (
        <PaymentModal
          userId={user.id}
          userEmail={user.email || ''}
          onSuccess={() => {
            refresh();
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default BrandKit;
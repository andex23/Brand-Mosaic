import React, { useState } from 'react';
import { BrandKit as BrandKitType, BrandFormData } from '../types';
import BrandHeader from './BrandHeader';
import BrandSummary from './BrandSummary';

interface BrandKitProps {
  kit: BrandKitType;
  formData: BrandFormData;
  onEdit: () => void;
  onBackToDashboard: () => void;
  onGoHome: () => void;
  readOnly?: boolean;
}

const BrandKitSection: React.FC<{ title: string; children: React.ReactNode; contentToCopy?: string }> = ({ 
  title, 
  children, 
  contentToCopy 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      alert('Copied to clipboard');
    }
  };

  return (
    <div className="kit-section">
      <div 
        className="kit-section-header" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div className="kit-section-title">
          {title} <span className="kit-toggle-icon" style={{ marginLeft: '8px', opacity: 0.5 }}>{isOpen ? '[-]' : '[+]'}</span>
        </div>
        {contentToCopy && (
          <button onClick={handleCopy} className="kit-copy-btn" style={{ fontSize: '10px', background: 'none', border: '1px solid #ccc', cursor: 'pointer', padding: '2px 6px' }}>
            [ COPY ]
          </button>
        )}
      </div>
      <div className={`kit-section-body ${isOpen ? '' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

const BrandKit: React.FC<BrandKitProps> = ({ kit, formData, onEdit, onBackToDashboard, onGoHome, readOnly = false }) => {
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  const handleGenerateLogo = () => {
    setIsGeneratingLogo(true);
    setTimeout(() => {
      setIsGeneratingLogo(false);
      alert("Logo generation would happen here via Imagen.");
    }, 1500);
  };

  const handleShare = () => {
    const projectData = {
      id: 'shared-brand',
      name: formData.brandName,
      createdAt: Date.now(),
      formData: formData,
      brandKit: kit
    };

    try {
      const json = JSON.stringify(projectData);
      const base64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
      const url = `${window.location.origin}${window.location.pathname}?share=${base64}`;
      navigator.clipboard.writeText(url).then(() => alert("Shareable link copied!"));
    } catch (e) {
      alert("Share generation failed.");
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
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={handleShare} className="nav-link-btn">
            [ SHARE ]
          </button>
          <button onClick={() => window.print()} className="nav-link-btn">
            [ PRINT ]
          </button>
        </div>
      </div>

      <BrandHeader 
        onTitleClick={!readOnly ? onBackToDashboard : onGoHome} 
        subtitle={formData.brandName ? `Brand Identity: ${formData.brandName}` : 'The Mosaic Output'}
      />

      <div className="kit-container">
        
        <BrandKitSection title="Brand Essence" contentToCopy={kit.brandEssence}>
          <div className="kit-essence">{kit.brandEssence}</div>
        </BrandKitSection>

        <BrandKitSection title="Summary" contentToCopy={kit.summaryParagraph}>
          <div className="kit-paragraph">{kit.summaryParagraph}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {kit.keywords?.map((k, i) => (
              <span key={i} style={{ border: '1px solid var(--line)', padding: '4px 12px', fontSize: '12px', borderRadius: '12px' }}>{k}</span>
            ))}
          </div>
        </BrandKitSection>

        <div className="kit-grid">
           <BrandKitSection title="Archetype">
             <div style={{ fontWeight: 700, marginBottom: '4px' }}>{kit.brandArchetype?.name}</div>
             <div style={{ fontSize: '14px', opacity: 0.8 }}>{kit.brandArchetype?.explanation}</div>
           </BrandKitSection>

           <BrandKitSection title="Tone of Voice">
             <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '15px' }}>
               {kit.toneOfVoice?.map((tone, i) => (
                 <li key={i} style={{ marginBottom: '4px' }}>{tone}</li>
               ))}
             </ul>
           </BrandKitSection>
        </div>

        <BrandKitSection title="Color Palette">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {kit.colorPaletteSuggestions?.map((color, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="kit-swatch" style={{ backgroundColor: color.hex }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 700 }}>{color.name}</span>
                  <span style={{ fontFamily: 'monospace' }}>{color.hex}</span>
                  <span style={{ fontSize: '12px', opacity: 0.7, fontStyle: 'italic' }}>{color.usage}</span>
                </div>
              </div>
            ))}
          </div>
        </BrandKitSection>

        <div className="kit-grid">
          <BrandKitSection title="Typography">
            <div style={{ border: '1px solid var(--line)', padding: '16px', background: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Headline</div>
              <div style={{ fontSize: '18px', fontFamily: 'serif', marginBottom: '12px' }}>{kit.fontPairing?.headlineFont}</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Body</div>
              <div style={{ fontSize: '16px', fontFamily: 'sans-serif' }}>{kit.fontPairing?.bodyFont}</div>
              <div style={{ marginTop: '12px', fontSize: '11px', fontStyle: 'italic' }}>{kit.fontPairing?.note}</div>
            </div>
          </BrandKitSection>

          <BrandKitSection title="Tagline" contentToCopy={kit.suggestedTagline}>
            <div className="kit-essence" style={{ fontSize: '20px' }}>"{kit.suggestedTagline}"</div>
          </BrandKitSection>
        </div>

        <BrandKitSection title="Logo Visual Prompt" contentToCopy={kit.logoPrompt}>
           <div style={{ background: '#fff', padding: '16px', fontSize: '13px', fontFamily: 'monospace', marginBottom: '16px', border: '1px solid var(--line)', lineHeight: '1.6' }}>
             {kit.logoPrompt}
           </div>
           {!readOnly && (
             <button 
               onClick={handleGenerateLogo}
               className="brand-submit-btn"
               disabled={isGeneratingLogo}
               style={{ fontSize: '12px', padding: '10px 20px' }}
             >
               {isGeneratingLogo ? '[ GENERATING... ]' : '[ GENERATE LOGO PREVIEW ]'}
             </button>
           )}
        </BrandKitSection>

        <BrandKitSection title="Original Input Recap">
          <BrandSummary formData={formData} onEdit={onEdit} readOnly={readOnly} />
        </BrandKitSection>

      </div>

      <div className="brand-actions" style={{ marginTop: '56px', justifyContent: 'center' }}>
        <button onClick={handleShare} className="brand-submit-btn" style={{ width: '100%', maxWidth: '300px' }}>
          [ COPY SHAREABLE KIT LINK ]
        </button>
      </div>

    </div>
  );
};

export default BrandKit;
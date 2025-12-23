import React, { useState } from 'react';
import { BrandFormData } from '../types';

interface BrandSummaryProps {
  formData: BrandFormData;
  onEdit: () => void;
  aiAnalysis?: string;
  readOnly?: boolean;
}

const SummarySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="brand-summary-section" style={{ marginBottom: '24px' }}>
      <div 
        className="brand-summary-section-title" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontWeight: 700,
          color: '#666',
          marginBottom: '16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          userSelect: 'none',
          borderBottom: '1px solid #eee',
          paddingBottom: '8px'
        }}
      >
        <span>{title}</span>
        <span className="summary-toggle-icon">{isOpen ? '[-]' : '[+]'}</span>
      </div>
      <div className={`brand-summary-body ${isOpen ? '' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="brand-summary-item">
    <span className="brand-summary-label">{label}</span>
    <span className="brand-summary-value">{value || '—'}</span>
  </div>
);

const BrandSummary: React.FC<BrandSummaryProps> = ({ formData, onEdit, aiAnalysis, readOnly = false }) => {
  if (!formData) return null;

  // Logic to display custom palette with swatches
  let paletteDisplay: React.ReactNode = formData.palette;
  if (formData.palette === 'Custom') {
    paletteDisplay = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span>{formData.customPalette || 'Custom'}</span>
        {formData.customColor1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '16px', height: '16px', background: formData.customColor1, border: '1px solid #ccc' }}></div>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>{formData.customColor1}</span>
          </div>
        )}
        {formData.customColor2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '16px', height: '16px', background: formData.customColor2, border: '1px solid #ccc' }}></div>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>{formData.customColor2}</span>
          </div>
        )}
      </div>
    );
  }

  // Helper to join arrays or return string
  const displayValue = (val: string | string[]) => {
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : '—';
    }
    return val;
  };

  // Enhanced logic for Custom Vibe display
  const vibeArray = Array.isArray(formData.vibe) ? [...formData.vibe] : [];
  const customVibeIndex = vibeArray.indexOf('Custom');
  let vibeDisplayStr = '';
  
  if (customVibeIndex > -1 && formData.customVibe) {
    // Replace "Custom" with the actual custom text for display
    const displayArray = [...vibeArray];
    displayArray[customVibeIndex] = `${formData.customVibe} (Custom)`;
    vibeDisplayStr = displayArray.join(', ');
  } else {
    vibeDisplayStr = vibeArray.join(', ');
  }

  const typographyDisplay = formData.typography === 'Custom' && formData.customFont
    ? `Custom: ${formData.customFont}`
    : formData.typography;

  return (
    <div className="brand-summary">
      <div className="brand-header">
        <div className="brand-title">SUMMARY</div>
        <div className="brand-header-line"></div>
      </div>

      <div className="brand-summary-list">
        
        {/* AI Analysis Section */}
        {aiAnalysis && (
          <div className="brand-summary-section" style={{ marginBottom: '32px' }}>
             <div className="brand-summary-section-title" style={{ color: '#000', borderBottom: '2px solid #000' }}>
               BRAND MOSAIC
             </div>
             <div style={{ fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
               {aiAnalysis}
             </div>
          </div>
        )}

        <SummarySection title="Core Identity">
          <SummaryItem label="Brand Name" value={formData.brandName} />
          <SummaryItem label="Offering" value={formData.offering} />
          <SummaryItem label="Purpose" value={formData.purpose} />
          <SummaryItem label="Problem Solved" value={formData.problem} />
        </SummarySection>

        <SummarySection title="Personality">
          <SummaryItem label="Tone" value={displayValue(formData.tone)} />
          <SummaryItem label="Feeling" value={formData.feeling} />
          <SummaryItem label="Adjectives" value={formData.adjectives} />
        </SummarySection>

        <SummarySection title="Visual Direction">
          <SummaryItem label="Palette" value={paletteDisplay} />
          <SummaryItem label="Vibe" value={vibeDisplayStr} />
          <SummaryItem label="Mood Keywords" value={formData.moodBoardKeywords} />
          <SummaryItem label="Typography" value={typographyDisplay} />
        </SummarySection>

        <SummarySection title="Audience">
          <SummaryItem label="Target Audience" value={displayValue(formData.audience)} />
          <SummaryItem label="Customer Values" value={formData.customerCare} />
        </SummarySection>

        <SummarySection title="Differentiation">
          <SummaryItem label="Differentiator" value={formData.differentiation} />
          <SummaryItem label="Competitors" value={formData.competitors} />
        </SummarySection>

        <SummarySection title="Brand Assets">
          <SummaryItem label="Tagline" value={formData.tagline} />
          <SummaryItem label="Existing Logo" value={formData.logoExists} />
          {formData.logoExists === 'Yes' ? (
            <SummaryItem label="Uploaded File" value={formData.logoFileName || "No file uploaded"} />
          ) : (
             <SummaryItem label="Logo Preference" value={formData.logoPreference} />
          )}
        </SummarySection>

        <SummarySection title="Flavor">
          <SummaryItem label="Fashion Style" value={formData.fashion} />
          <SummaryItem label="Soundtrack" value={formData.soundtrack} />
          <SummaryItem label="Inspiration" value={formData.inspiration} />
        </SummarySection>

      </div>

      {!readOnly && (
        <div className="brand-actions">
          <button onClick={onEdit} className="brand-edit-btn">
            [ EDIT ANSWERS ]
          </button>
          <div className="flex-spacer" style={{ display: 'none' }}></div>
          <button onClick={() => window.print()} className="brand-edit-btn">
            [ EXPORT PDF ]
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandSummary;
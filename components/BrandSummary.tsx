import React, { useState } from 'react';
import { BrandFormData } from '../types';

interface BrandSummaryProps {
  formData: BrandFormData;
  onEdit: () => void;
  aiAnalysis?: string;
  readOnly?: boolean;
}

const SummarySection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="brand-summary-section">
      <button
        type="button"
        className="brand-summary-section-title"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className="summary-toggle-icon">{isOpen ? '[-]' : '[+]'}</span>
      </button>
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

  const formatValue = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—';
    }
    return value || '—';
  };

  const vibeArray = Array.isArray(formData.vibe) ? [...formData.vibe] : [];
  const customVibeIndex = vibeArray.indexOf('Custom');
  if (customVibeIndex > -1 && formData.customVibe) {
    vibeArray[customVibeIndex] = `${formData.customVibe} (Custom)`;
  }

  const typographyValue = formData.typography === 'Custom' && formData.customFont
    ? `${formData.customFont} (Custom)`
    : formData.typography;

  const paletteDisplay = formData.palette === 'Custom' ? (
    <div className="brand-summary-palette-display">
      <span>{formData.customPalette || 'Custom palette'}</span>
      <div className="brand-summary-swatches">
        {formData.customColor1 && (
          <div className="brand-summary-swatch-item">
            <div className="brand-summary-swatch" style={{ background: formData.customColor1 }}></div>
            <span>{formData.customColor1}</span>
          </div>
        )}
        {formData.customColor2 && (
          <div className="brand-summary-swatch-item">
            <div className="brand-summary-swatch" style={{ background: formData.customColor2 }}></div>
            <span>{formData.customColor2}</span>
          </div>
        )}
      </div>
    </div>
  ) : (formData.palette || '—');

  return (
    <div className="brand-summary">
      {aiAnalysis && (
        <div className="brand-summary-ai-note">
          <div className="brand-summary-ai-title">Brand Mosaic</div>
          <div className="brand-summary-ai-copy">{aiAnalysis}</div>
        </div>
      )}

      <div className="brand-summary-list">
        <SummarySection title="Brand Basics" defaultOpen>
          <SummaryItem label="Brand Name" value={formData.brandName} />
          <SummaryItem label="Offering" value={formData.offering} />
          <SummaryItem label="Purpose" value={formData.purpose} />
          <SummaryItem label="Problem Solved" value={formData.problem} />
        </SummarySection>

        <SummarySection title="Audience">
          <SummaryItem label="Target Audience" value={formatValue(formData.audience)} />
          <SummaryItem label="Customer Values" value={formData.customerCare} />
        </SummarySection>

        <SummarySection title="Personality">
          <SummaryItem label="Tone" value={formatValue(formData.tone)} />
          <SummaryItem label="Feeling" value={formData.feeling} />
          <SummaryItem label="Adjectives" value={formData.adjectives} />
        </SummarySection>

        <SummarySection title="Visual Direction">
          <SummaryItem label="Palette" value={paletteDisplay} />
          <SummaryItem label="Vibe" value={vibeArray.join(', ') || '—'} />
          <SummaryItem label="Mood Keywords" value={formData.moodBoardKeywords} />
          <SummaryItem label="Typography" value={typographyValue} />
          <SummaryItem label="Fashion Cue" value={formData.fashion} />
          <SummaryItem label="Soundtrack" value={formData.soundtrack} />
          <SummaryItem label="Inspiration" value={formData.inspiration} />
        </SummarySection>

        <SummarySection title="Differentiation">
          <SummaryItem label="Differentiator" value={formData.differentiation} />
          <SummaryItem label="Competitors" value={formData.competitors} />
          <SummaryItem label="Tagline" value={formData.tagline} />
        </SummarySection>

        <SummarySection title="Brand Assets" defaultOpen={false}>
          <SummaryItem label="Existing Logo" value={formData.logoExists} />
          {formData.logoExists === 'Yes' ? (
            <SummaryItem label="Uploaded File" value={formData.logoFileName || 'No file uploaded'} />
          ) : (
            <SummaryItem label="Logo Preference" value={formData.logoPreference} />
          )}
        </SummarySection>
      </div>

      {!readOnly && (
        <div className="brand-actions brand-summary-actions">
          <button onClick={onEdit} className="brand-edit-btn">
            [ EDIT ANSWERS ]
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandSummary;

import React, { useRef } from 'react';
import BrandQuestionRow from './BrandQuestionRow';
import { BrandFormData } from '../types';

interface BrandFormProps {
  formData: BrandFormData;
  setFormData: React.Dispatch<React.SetStateAction<BrandFormData>>;
  onSubmit: () => void;
  isAnalyzing?: boolean;
}

// Helper icon for the manual upload row to match BrandQuestionRow style
const StarIcon = () => (
  <svg className="brand-star-icon" viewBox="0 0 24 24">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const BrandForm: React.FC<BrandFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isAnalyzing = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Updated to handle string or string[]
  const handleChange = (name: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomPalette = (val: string) => {
    setFormData((prev) => ({ ...prev, customPalette: val }));
  };

  const handleCustomColorChange = (index: number, val: string) => {
    if (index === 0) {
      setFormData((prev) => ({ ...prev, customColor1: val }));
    } else if (index === 1) {
      setFormData((prev) => ({ ...prev, customColor2: val }));
    }
  };

  const handleCustomVibe = (val: string) => {
    setFormData((prev) => ({ ...prev, customVibe: val }));
  };

  const handleCustomFont = (val: string) => {
    setFormData((prev) => ({ ...prev, customFont: val }));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, logoFileName: e.target.files![0].name }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnalyzing) {
      onSubmit();
    }
  };

  return (
    <form className="brand-form" onSubmit={handleSubmit}>
      {/* CORE IDENTITY */}
      <BrandQuestionRow
        label="What’s your brand name?"
        name="brandName"
        type="input"
        value={formData.brandName}
        onChange={handleChange}
        placeholder="Your company name or project title"
      />
      <BrandQuestionRow
        label="What do you sell or offer?"
        subLabel="(One short sentence)"
        name="offering"
        type="input"
        value={formData.offering}
        onChange={handleChange}
        placeholder="Products, services, digital, physical..."
      />
      <BrandQuestionRow
        label="Why does this brand exist?"
        subLabel="(The purpose)"
        name="purpose"
        type="input"
        value={formData.purpose}
        onChange={handleChange}
      />
      <BrandQuestionRow
        label="What problem does your brand solve?"
        name="problem"
        type="input"
        value={formData.problem}
        onChange={handleChange}
        placeholder="Simple but powerful..."
      />

      {/* PERSONALITY */}
      <BrandQuestionRow
        label="What tone should your brand have?"
        subLabel="(Select all that apply)"
        name="tone"
        type="checkbox-group"
        options={['Calm', 'Bold', 'Elegant', 'Playful', 'Minimal', 'Street', 'Luxury', 'Corporate', 'Friendly', 'Witty', 'Serious', 'Warm']}
        value={formData.tone}
        onChange={handleChange}
      />
      <BrandQuestionRow
        label="How should people feel when they see your brand?"
        subLabel="(One word)"
        name="feeling"
        type="input"
        value={formData.feeling}
        onChange={handleChange}
        placeholder="e.g. Safe, Excited, Creative..."
      />
      <BrandQuestionRow
        label="Which three adjectives describe your brand best?"
        name="adjectives"
        type="input"
        value={formData.adjectives}
        onChange={handleChange}
        placeholder="e.g. Clean, modern, expressive"
      />

      {/* VISUAL DIRECTION */}
      <BrandQuestionRow
        label="What is your preferred color palette?"
        name="palette"
        type="select"
        options={[
          'Milk + Charcoal (Minimal)',
          'Sand + Terracotta (Earthy)',
          'Navy + Ice (Corporate/Tech)',
          'Forest + Clay (Natural)',
          'Black + Neon (Bold)',
          'Pastels (Soft)',
          'Monochrome (Stark)',
          'Custom'
        ]}
        value={formData.palette}
        onChange={handleChange}
        enableCustomInput={true}
        customValue={formData.customPalette}
        onCustomChange={handleCustomPalette}
        customPlaceholder="Name or describe your colors..."
        colorPickerValues={[formData.customColor1 || '#000000', formData.customColor2 || '#ffffff']}
        onColorPickerChange={handleCustomColorChange}
      />
      <BrandQuestionRow
        label="What visual vibe fits your brand?"
        subLabel="(Select up to 2)"
        name="vibe"
        type="checkbox-group"
        options={[
          'Minimal Modern (Clean lines, uncluttered)',
          'Vintage Retro (Nostalgic, classic feel)',
          'Soft Luxury (Elegant, muted, expensive)',
          'Streetwear Grit (Urban, raw, bold)',
          'Playful Pop (Bright, fun, energetic)',
          'Corporate Clean (Professional, trustworthy)',
          'Futuristic / Tech (Sleek, digital, neon)',
          'Rustic / Handmade (Organic, earthy, textured)',
          'Custom'
        ]}
        value={formData.vibe}
        onChange={handleChange}
        enableCustomInput={true}
        customValue={formData.customVibe}
        onCustomChange={handleCustomVibe}
        customPlaceholder="Describe the vibe..."
        maxSelections={2}
      />
      <BrandQuestionRow
        label="What typography style do you prefer?"
        name="typography"
        type="select"
        options={[
          'Typewriter / Mono (e.g., Courier, Space Mono)',
          'Clean Sans Serif (e.g., Helvetica, Inter, Roboto)',
          'Geometric Sans (e.g., Futura, Century Gothic)',
          'Classic Serif (e.g., Garamond, Caslon, Times)',
          'Modern Serif (e.g., Bodoni, Didot, Playfair)',
          'Display / Editorial (e.g., Value Serif, Ogg)',
          'Playful / Rounded (e.g., Comic Neue, Quicksand)',
          'Bold / Impact (e.g., Oswald, Anton, Impact)',
          'Handwritten / Script (e.g., Signature style)',
          'Custom'
        ]}
        value={formData.typography}
        onChange={handleChange}
        enableCustomInput={true}
        customValue={formData.customFont}
        onCustomChange={handleCustomFont}
        customPlaceholder="Name a font or style..."
      />

      {/* AUDIENCE */}
      <BrandQuestionRow
        label="Who is your target audience?"
        subLabel="(Select all that apply)"
        name="audience"
        type="checkbox-group"
        options={[
          'Teens (Gen Z)',
          'Young Adults (Millennials)',
          'Adults (Gen X)',
          'Professionals / Corporate',
          'High-income Lifestyle',
          'Creatives / Artists',
          'General Public',
          'Parents / Families'
        ]}
        value={formData.audience}
        onChange={handleChange}
      />
      <BrandQuestionRow
        label="What do your customers care about most?"
        name="customerCare"
        type="input"
        value={formData.customerCare}
        onChange={handleChange}
        placeholder="Style, price, quality, status, simplicity..."
      />

      {/* DIFFERENTIATION */}
      <BrandQuestionRow
        label="What makes your brand different?"
        name="differentiation"
        type="input"
        value={formData.differentiation}
        onChange={handleChange}
        placeholder="The thing that sets you apart..."
      />
      <BrandQuestionRow
        label="Who are your competitors?"
        name="competitors"
        type="input"
        value={formData.competitors}
        onChange={handleChange}
        placeholder="Optional..."
      />

      {/* ASSETS */}
      <BrandQuestionRow
        label="Do you have a tagline?"
        name="tagline"
        type="input"
        value={formData.tagline}
        onChange={handleChange}
      />
      <BrandQuestionRow
        label="Do you have an existing logo?"
        name="logoExists"
        type="radio"
        options={['Yes', 'No']}
        value={formData.logoExists}
        onChange={handleChange}
      />

      {/* CONDITIONAL LOGO UPLOAD OR PREFERENCE */}
      {formData.logoExists === 'Yes' ? (
        <div className="brand-question-row">
          <div className="brand-label-container">
            <StarIcon />
            <div className="brand-label">Upload your logo file</div>
          </div>
          <div className="brand-question-line"></div>
          
          <div className="brand-answer-container">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/png, image/jpeg, image/svg+xml"
            />
            
            <button 
              type="button" 
              className="brand-question-input"
              onClick={handleFileClick}
              style={{ 
                textAlign: 'left', 
                cursor: 'pointer',
                color: formData.logoFileName ? 'var(--ink)' : 'rgba(34, 34, 34, 0.5)',
                fontStyle: formData.logoFileName ? 'normal' : 'italic'
              }}
            >
              {formData.logoFileName ? `[ FILE: ${formData.logoFileName} ]` : '[ CLICK TO UPLOAD FILE ]'}
            </button>
          </div>
        </div>
      ) : (
        <BrandQuestionRow
          label="Do you prefer an icon, wordmark, or both?"
          name="logoPreference"
          type="select"
          options={['Icon only', 'Wordmark only', 'Both (Combination Mark)', 'No preference']}
          value={formData.logoPreference}
          onChange={handleChange}
        />
      )}

      {/* EXTRA FLAVOR */}
      <BrandQuestionRow
        label="If your brand were a person, how would they dress?"
        name="fashion"
        type="input"
        value={formData.fashion}
        onChange={handleChange}
        placeholder="Minimal, street, chic, luxury, retro..."
      />
      <BrandQuestionRow
        label="If your brand had a soundtrack, what genre would it be?"
        name="soundtrack"
        type="input"
        value={formData.soundtrack}
        onChange={handleChange}
        placeholder="Jazz, ambient, trap, pop, alt-R&B..."
      />
      <BrandQuestionRow
        label="What brands inspire you?"
        name="inspiration"
        type="input"
        value={formData.inspiration}
        onChange={handleChange}
        placeholder="List 1 or 2 brands..."
      />

      <div className="brand-actions">
        <button 
          type="submit" 
          className="brand-submit-btn" 
          disabled={isAnalyzing}
          style={{ opacity: isAnalyzing ? 0.6 : 1, cursor: isAnalyzing ? 'wait' : 'pointer' }}
        >
          {isAnalyzing ? '[ ANALYZING IDENTITY... ]' : '[ GENERATE SUMMARY ]'}
        </button>
      </div>
    </form>
  );
};

export default BrandForm;
import React, { useMemo, useRef, useState } from 'react';
import BrandQuestionRow from './BrandQuestionRow';
import { BrandFormData, GenerationStatusPhase } from '../types';

interface BrandFormProps {
  formData: BrandFormData;
  setFormData: React.Dispatch<React.SetStateAction<BrandFormData>>;
  onSubmit: () => Promise<void> | void;
  onSaveDraft?: () => Promise<void> | void;
  isAnalyzing?: boolean;
  generationPhase?: GenerationStatusPhase;
  saveStatus?: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
  lastSavedAt?: string | null;
}

interface FormSection {
  id: string;
  title: string;
  note: string;
  prompt: string;
}

const FORM_SECTIONS: FormSection[] = [
  {
    id: 'basics',
    title: 'Brand Basics',
    note: 'Set the foundation clearly before the system starts interpreting it.',
    prompt: 'Answer these like you are writing the first page of a thoughtful brand workbook.',
  },
  {
    id: 'purpose',
    title: 'Brand Purpose',
    note: 'Clarify why the brand exists and the problem it helps solve.',
    prompt: 'This is the strategic reason behind the work, not the marketing slogan.',
  },
  {
    id: 'audience',
    title: 'Audience',
    note: 'Describe who the brand serves and what that audience actually cares about.',
    prompt: 'A useful audience definition makes the output feel sharper and less generic.',
  },
  {
    id: 'personality',
    title: 'Personality',
    note: 'Give the brand a tone, attitude, and emotional feel people can recognize.',
    prompt: 'Choose signals you can actually carry through design, copy, and product decisions.',
  },
  {
    id: 'visual',
    title: 'Visual Direction',
    note: 'Shape the visual world so the final kit can feel grounded and specific.',
    prompt: 'Think in mood, materials, typography, and references rather than perfect finished assets.',
  },
  {
    id: 'differentiation',
    title: 'Differentiation',
    note: 'Define what sets the brand apart and what supporting assets already exist.',
    prompt: 'This is where the brand starts becoming clearly ownable.',
  },
];

const StarIcon = () => (
  <svg className="brand-star-icon" viewBox="0 0 24 24">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const BrandForm: React.FC<BrandFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onSaveDraft,
  isAnalyzing = false,
  generationPhase = 'idle',
  saveStatus = 'idle',
  lastSavedAt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const currentSection = FORM_SECTIONS[currentSectionIndex];
  const isLastSection = currentSectionIndex === FORM_SECTIONS.length - 1;

  const formatSavedTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));

  const saveLabel = useMemo(() => {
    if (isAnalyzing) return 'Generation is in progress';
    if (saveStatus === 'dirty') return 'Changes waiting to save';
    if (saveStatus === 'saving') return 'Saving draft...';
    if (saveStatus === 'saved') {
      return lastSavedAt ? `Saved at ${formatSavedTime(lastSavedAt)}` : 'Draft saved';
    }
    if (saveStatus === 'error') return 'Save failed. Retry below';
    return 'Autosave ready';
  }, [isAnalyzing, lastSavedAt, saveStatus]);

  const submitLabel = useMemo(() => {
    if (generationPhase === 'saving') return '[ SAVING ANSWERS... ]';
    if (generationPhase === 'synthesizing') return '[ WRITING BRAND DIRECTION... ]';
    if (generationPhase === 'persisting') return '[ SAVING RESULT... ]';
    if (isLastSection) return '[ GENERATE BRAND KIT ]';
    return '[ SAVE + CONTINUE ]';
  }, [generationPhase, isLastSection]);

  const handleChange = (name: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomPalette = (value: string) => {
    setFormData((prev) => ({ ...prev, customPalette: value }));
  };

  const handleCustomColorChange = (index: number, value: string) => {
    if (index === 0) {
      setFormData((prev) => ({ ...prev, customColor1: value }));
    } else {
      setFormData((prev) => ({ ...prev, customColor2: value }));
    }
  };

  const handleCustomVibe = (value: string) => {
    setFormData((prev) => ({ ...prev, customVibe: value }));
  };

  const handleCustomFont = (value: string) => {
    setFormData((prev) => ({ ...prev, customFont: value }));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, logoFileName: e.target.files![0].name }));
    }
  };

  const goToSection = (index: number) => {
    setCurrentSectionIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentSectionIndex > 0) {
      goToSection(currentSectionIndex - 1);
    }
  };

  const handleAdvance = async () => {
    if (isLastSection) {
      await onSubmit();
      return;
    }

    await onSaveDraft?.();
    goToSection(currentSectionIndex + 1);
  };

  const renderSection = () => {
    switch (currentSection.id) {
      case 'basics':
        return (
          <>
            <BrandQuestionRow
              label="What’s your brand name?"
              name="brandName"
              type="input"
              value={formData.brandName}
              onChange={handleChange}
              placeholder="Your company name or project title"
              helperText="Use the working name you want the brand kit to center."
            />
            <BrandQuestionRow
              label="What do you sell or offer?"
              subLabel="(One short sentence)"
              name="offering"
              type="textarea"
              value={formData.offering}
              onChange={handleChange}
              placeholder="Products, services, digital, physical..."
              helperText="Keep this plain and direct so the output understands the business quickly."
            />
          </>
        );
      case 'purpose':
        return (
          <>
            <BrandQuestionRow
              label="Why does this brand exist?"
              subLabel="(The purpose)"
              name="purpose"
              type="textarea"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="What is the deeper reason this brand should exist?"
              helperText="This becomes part of the mission and strategic summary."
            />
            <BrandQuestionRow
              label="What problem does your brand solve?"
              name="problem"
              type="textarea"
              value={formData.problem}
              onChange={handleChange}
              placeholder="Simple but powerful..."
              helperText="Describe the tension, gap, or frustration the brand should help resolve."
            />
          </>
        );
      case 'audience':
        return (
          <>
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
                'Parents / Families',
              ]}
              value={formData.audience}
              onChange={handleChange}
              helperText="Pick the broad groups first, then use the next answer to show what matters to them."
            />
            <BrandQuestionRow
              label="What do your customers care about most?"
              name="customerCare"
              type="textarea"
              value={formData.customerCare}
              onChange={handleChange}
              placeholder="Style, price, quality, status, simplicity..."
              helperText="Think about the needs, values, or tastes that drive their decisions."
            />
          </>
        );
      case 'personality':
        return (
          <>
            <BrandQuestionRow
              label="What tone should your brand have?"
              subLabel="(Select all that apply)"
              name="tone"
              type="checkbox-group"
              options={['Calm', 'Bold', 'Elegant', 'Playful', 'Minimal', 'Street', 'Luxury', 'Corporate', 'Friendly', 'Witty', 'Serious', 'Warm']}
              value={formData.tone}
              onChange={handleChange}
              helperText="Choose the traits you would want to protect across design, writing, and decision-making."
            />
            <BrandQuestionRow
              label="How should people feel when they see your brand?"
              subLabel="(One word)"
              name="feeling"
              type="input"
              value={formData.feeling}
              onChange={handleChange}
              placeholder="e.g. Safe, Excited, Creative..."
              helperText="This helps turn the brand into an emotional experience rather than just a look."
            />
            <BrandQuestionRow
              label="Which three adjectives describe your brand best?"
              name="adjectives"
              type="input"
              value={formData.adjectives}
              onChange={handleChange}
              placeholder="e.g. Clean, modern, expressive"
              helperText="Comma-separated adjectives work best here."
            />
          </>
        );
      case 'visual':
        return (
          <>
            <BrandQuestionRow
              label="What is your preferred color palette?"
              name="palette"
              type="select"
              options={[
                'Milk + Charcoal',
                'Sand + Terracotta',
                'Navy + Ice',
                'Forest + Clay',
                'Black + Neon',
                'Pastels',
                'Monochrome',
                'Custom',
              ]}
              value={formData.palette}
              onChange={handleChange}
              enableCustomInput={true}
              customValue={formData.customPalette}
              onCustomChange={handleCustomPalette}
              customPlaceholder="Name or describe your colors..."
              colorPickerValues={[formData.customColor1 || '#000000', formData.customColor2 || '#ffffff']}
              onColorPickerChange={handleCustomColorChange}
              helperText="Use this to set the mood, not to lock yourself into final brand standards."
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
                'Custom',
              ]}
              value={formData.vibe}
              onChange={handleChange}
              enableCustomInput={true}
              customValue={formData.customVibe}
              onCustomChange={handleCustomVibe}
              customPlaceholder="Describe the vibe..."
              maxSelections={2}
              helperText="Choose the worlds you want the brand to live in."
            />
            <BrandQuestionRow
              label="Mood Board Keywords"
              subLabel="(Comma separated)"
              name="moodBoardKeywords"
              type="input"
              value={formData.moodBoardKeywords}
              onChange={handleChange}
              placeholder="e.g. cinematic, grain, noir, neon, damp"
              helperText="Materials, moods, textures, scenes, and visual references all work here."
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
                'Custom',
              ]}
              value={formData.typography}
              onChange={handleChange}
              enableCustomInput={true}
              customValue={formData.customFont}
              onCustomChange={handleCustomFont}
              customPlaceholder="Name a font or style..."
              helperText="Choose the tone of typography, not necessarily the exact production font."
            />
            <BrandQuestionRow
              label="If your brand were a person, how would they dress?"
              name="fashion"
              type="input"
              value={formData.fashion}
              onChange={handleChange}
              placeholder="Minimal, street, chic, luxury, retro..."
              helperText="A quick shortcut for styling and visual taste."
            />
            <BrandQuestionRow
              label="If your brand had a soundtrack, what genre would it be?"
              name="soundtrack"
              type="input"
              value={formData.soundtrack}
              onChange={handleChange}
              placeholder="Jazz, ambient, trap, pop, alt-R&B..."
              helperText="Useful for mood, rhythm, and emotional texture."
            />
            <BrandQuestionRow
              label="What brands inspire you?"
              name="inspiration"
              type="input"
              value={formData.inspiration}
              onChange={handleChange}
              placeholder="List 1 or 2 brands..."
              helperText="These can be direct competitors or just visual inspirations."
            />
          </>
        );
      case 'differentiation':
        return (
          <>
            <BrandQuestionRow
              label="What makes your brand different?"
              name="differentiation"
              type="textarea"
              value={formData.differentiation}
              onChange={handleChange}
              placeholder="The thing that sets you apart..."
              helperText="This should help the final brand summary feel owned, not generic."
            />
            <BrandQuestionRow
              label="Who are your competitors?"
              name="competitors"
              type="input"
              value={formData.competitors}
              onChange={handleChange}
              placeholder="Optional..."
              helperText="Optional, but useful for context and differentiation."
            />
            <BrandQuestionRow
              label="Do you have a tagline?"
              name="tagline"
              type="input"
              value={formData.tagline}
              onChange={handleChange}
              helperText="If you do not, Brand Mosaic will still suggest a direction."
            />
            <BrandQuestionRow
              label="Do you have an existing logo?"
              name="logoExists"
              type="radio"
              options={['Yes', 'No']}
              value={formData.logoExists}
              onChange={handleChange}
              helperText="This helps the output know whether to guide a fresh direction or work around an existing mark."
            />

            {formData.logoExists === 'Yes' ? (
              <div className="brand-question-row brand-question-upload">
                <div className="brand-label-container">
                  <StarIcon />
                  <div className="brand-label">
                    Upload your logo file
                    <div className="brand-question-helper">
                      Optional, but helpful if you want the prompt to respect what already exists.
                    </div>
                  </div>
                </div>
                <div className="brand-question-line"></div>

                <div className="brand-answer-container brand-answer-open">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpeg, image/svg+xml"
                  />

                  <button
                    type="button"
                    className="brand-question-input brand-upload-btn"
                    onClick={handleFileClick}
                    style={{
                      textAlign: 'left',
                      color: formData.logoFileName ? 'var(--ink)' : 'rgba(34, 34, 34, 0.5)',
                      fontStyle: formData.logoFileName ? 'normal' : 'italic',
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
                helperText="This gives the logo prompt a clearer strategic direction."
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <form
      className="brand-form brand-form-stepped"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isAnalyzing) {
          void handleAdvance();
        }
      }}
    >
      <div className="brand-form-progress-wrap">
        <div className="brand-form-progress-meta">
          <span className="brand-form-progress-label">[ SECTION {currentSectionIndex + 1} OF {FORM_SECTIONS.length} ]</span>
          <span className={`save-status visible form-save-status ${saveStatus}`}>{saveLabel}</span>
        </div>

        <div className="brand-form-stepper">
          {FORM_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={`brand-step-chip ${index === currentSectionIndex ? 'active' : ''} ${index < currentSectionIndex ? 'complete' : ''}`}
              onClick={() => goToSection(index)}
            >
              <span className="brand-step-chip-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="brand-form-section-sheet">
        <div className="brand-form-section-header">
          <div className="brand-form-section-index">{String(currentSectionIndex + 1).padStart(2, '0')}</div>
          <div className="brand-form-section-copy">
            <h2 className="brand-form-section-title">{currentSection.title}</h2>
            <p className="brand-form-section-note">{currentSection.note}</p>
            <div className="brand-form-section-prompt">{currentSection.prompt}</div>
          </div>
        </div>

        <div className="brand-form-section-fields">
          {renderSection()}
        </div>
      </div>

      <div className="brand-actions brand-form-actions">
        <div className="brand-form-actions-left">
          {currentSectionIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="brand-edit-btn"
              disabled={isAnalyzing}
            >
              [ BACK ]
            </button>
          )}
        </div>

        <div className="brand-form-actions-right">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="brand-edit-btn"
              disabled={isAnalyzing}
            >
              [ SAVE DRAFT ]
            </button>
          )}

          <button
            type="submit"
            className="brand-submit-btn"
            disabled={isAnalyzing}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BrandForm;

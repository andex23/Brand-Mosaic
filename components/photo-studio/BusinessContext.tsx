import React, { useState } from 'react';
import type { BusinessContextData } from '../../types';

interface BusinessContextProps {
  context: BusinessContextData | null;
  onConfirm: (ctx: BusinessContextData) => void;
  onBack: () => void;
  onSkip: () => void;
  productName: string;
}

const TONE_OPTIONS = [
  'Minimal & Clean',
  'Bold & Energetic',
  'Warm & Inviting',
  'Luxurious & Premium',
  'Playful & Fun',
  'Natural & Organic',
  'Technical & Modern',
  'Rustic & Handmade',
];

const BusinessContext: React.FC<BusinessContextProps> = ({
  context,
  onConfirm,
  onBack,
  onSkip,
  productName,
}) => {
  const [brandName, setBrandName] = useState(context?.businessName || '');
  const [aboutBrand, setAboutBrand] = useState(
    // Reconstruct from existing context if editing
    context
      ? [context.businessDescription, context.targetAudience, context.productPurpose]
          .filter(Boolean)
          .join('. ')
      : ''
  );
  const [brandTone, setBrandTone] = useState(context?.brandTone || '');

  const handleConfirm = () => {
    onConfirm({
      businessName: brandName.trim(),
      businessDescription: aboutBrand.trim(),
      targetAudience: '',
      productPurpose: '',
      brandTone: brandTone.trim(),
    });
  };

  const hasAnyInput = brandName || aboutBrand || brandTone;

  return (
    <div className="ps-business-context">
      <h3 className="ps-section-title">About Your Brand</h3>
      <p className="ps-section-desc">
        A quick summary helps the AI style your "{productName}" scenes
        to match your brand.
      </p>

      <div className="ps-context-form">
        {/* Brand Name */}
        <div className="ps-context-field">
          <label className="ps-context-label">Brand name</label>
          <input
            type="text"
            className="brand-question-input"
            placeholder="e.g. Soleil Skincare"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </div>

        {/* Single combined description */}
        <div className="ps-context-field">
          <label className="ps-context-label">Tell us about your brand and this product</label>
          <textarea
            className="ps-context-textarea"
            placeholder="e.g. We make handmade organic skincare for women 25-40 who value sustainability. This moisturizer hydrates and protects sensitive skin with natural ingredients..."
            value={aboutBrand}
            onChange={(e) => setAboutBrand(e.target.value)}
            rows={4}
          />
        </div>

        {/* Visual tone chips */}
        <div className="ps-context-field">
          <label className="ps-context-label">Visual tone</label>
          <div className="ps-tone-options">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone}
                className={`ps-tone-chip ${brandTone === tone ? 'ps-tone-chip-active' : ''}`}
                onClick={() => setBrandTone(brandTone === tone ? '' : tone)}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ps-context-actions">
        <button
          className="brand-submit-btn"
          onClick={handleConfirm}
          disabled={!hasAnyInput}
        >
          [ CONTINUE ]
        </button>
        <button className="nav-link-btn" onClick={onSkip}>
          Skip — generate without brand context
        </button>
        <button className="nav-link-btn" onClick={onBack}>
          &larr; Back to product
        </button>
      </div>
    </div>
  );
};

export default BusinessContext;

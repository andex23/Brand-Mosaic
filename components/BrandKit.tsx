import React, { useEffect, useMemo, useState } from 'react';
import {
  BrandKit as BrandKitType,
  BrandFormData,
  BrandKitLocks,
  KitSectionId,
  RegenerableKitSectionId,
  SavedBrandResult,
} from '../types';
import BrandHeader from './BrandHeader';
import BrandSummary from './BrandSummary';
import LogoGenerator from './LogoGenerator';
import LogoDisplay from './LogoDisplay';
import ErrorToast from './ErrorToast';
import ThemeToggle from './ThemeToggle';
import { useError } from '../hooks/useError';
import { generateLogo } from '../lib/logoGeneration';

interface BrandKitProps {
  kit: BrandKitType;
  formData: BrandFormData;
  onEdit: () => void;
  onBackToDashboard: () => void;
  onSignOut: () => void;
  onCopyLink: () => Promise<void> | void;
  onExportPdf: () => Promise<void> | void;
  readOnly?: boolean;
  projectId: string;
  kitLocks?: BrandKitLocks;
  onToggleLock?: (sectionId: KitSectionId) => void;
  onRegenerateSection?: (sectionId: RegenerableKitSectionId) => void;
  isRegenerating?: boolean;
  onDuplicate?: () => void;
  onPersistGeneratedLogo?: (logoUrl: string) => Promise<void>;
  initialLogoUrl?: string | null;
  resultHistory: SavedBrandResult[];
  activeResultId: string;
  onSelectResult: (resultId: string) => void;
}

interface NotebookSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  contentToCopy?: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  canRegenerate?: boolean;
}

const SECTION_NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'essence', label: 'Essence' },
  { id: 'personality', label: 'Personality' },
  { id: 'palette', label: 'Palette' },
  { id: 'typography', label: 'Typography' },
  { id: 'logo', label: 'Logo' },
  { id: 'voice', label: 'Voice' },
  { id: 'imagery', label: 'Imagery' },
  { id: 'applications', label: 'Applications' },
  { id: 'recap', label: 'Recap' },
];

const uniqueValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const joinAsSentence = (values: string[]) => {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
};

const inferFontPreviewClass = (fontName: string) => {
  const value = fontName.toLowerCase();

  if (
    value.includes('mono') ||
    value.includes('courier') ||
    value.includes('typewriter') ||
    value.includes('space mono')
  ) {
    return 'kit-type-preview-mono';
  }

  if (
    value.includes('serif') ||
    value.includes('garamond') ||
    value.includes('caslon') ||
    value.includes('times') ||
    value.includes('bodoni') ||
    value.includes('playfair') ||
    value.includes('didot')
  ) {
    return 'kit-type-preview-serif';
  }

  if (value.includes('script') || value.includes('handwritten') || value.includes('signature')) {
    return 'kit-type-preview-script';
  }

  return 'kit-type-preview-sans';
};

const NotebookSection: React.FC<NotebookSectionProps> = ({
  id,
  eyebrow,
  title,
  children,
  contentToCopy,
  isLocked = false,
  onToggleLock,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = false,
}) => {
  const handleCopy = async () => {
    if (!contentToCopy) return;
    await navigator.clipboard.writeText(contentToCopy);
  };

  return (
    <section id={id} className={`kit-sheet-section ${isLocked ? 'kit-section-locked' : ''}`}>
      <div className="kit-sheet-header">
        <div className="kit-sheet-heading">
          <div className="kit-sheet-eyebrow">{eyebrow}</div>
          <h2 className="kit-sheet-title">{title}</h2>
        </div>

        <div className="kit-sheet-actions">
          {onToggleLock && (
            <button
              type="button"
              className={`kit-lock-btn ${isLocked ? 'locked' : ''}`}
              onClick={onToggleLock}
            >
              {isLocked ? '[ LOCKED ]' : '[ LOCK ]'}
            </button>
          )}
          {canRegenerate && onRegenerate && (
            <button
              type="button"
              className="kit-regen-btn"
              disabled={isLocked || isRegenerating}
              onClick={onRegenerate}
            >
              {isRegenerating ? '[ ... ]' : '[ REGENERATE ]'}
            </button>
          )}
          {contentToCopy && (
            <button type="button" className="kit-copy-btn" onClick={handleCopy}>
              [ COPY ]
            </button>
          )}
        </div>
      </div>

      <div className="kit-sheet-body">{children}</div>
    </section>
  );
};

const BrandKit: React.FC<BrandKitProps> = ({
  kit,
  formData,
  onEdit,
  onBackToDashboard,
  onSignOut,
  onCopyLink,
  onExportPdf,
  readOnly = false,
  projectId,
  kitLocks = {},
  onToggleLock,
  onRegenerateSection,
  isRegenerating = false,
  onDuplicate,
  onPersistGeneratedLogo,
  initialLogoUrl,
  resultHistory,
  activeResultId,
  onSelectResult,
}) => {
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(initialLogoUrl || null);

  const { toasts, showError, showSuccess, removeToast } = useError();

  useEffect(() => {
    setGeneratedLogoUrl(initialLogoUrl || null);
  }, [initialLogoUrl, activeResultId]);

  const synthesizedFoundation = kit.brandFoundation;
  const synthesizedPersonality = kit.personalityProfile;
  const synthesizedMessaging = kit.messagingDirection;
  const synthesizedImagery = kit.imageryDirection;
  const synthesizedApplications = kit.applicationDirection;
  const synthesizedLogoDirection = kit.logoDirection;

  const personalityTraits = useMemo(
    () => uniqueValues([...(synthesizedPersonality?.traits || []), ...(kit.keywords || [])]),
    [kit.keywords, synthesizedPersonality?.traits]
  );
  const personalityTone = uniqueValues([...(synthesizedPersonality?.tone || []), ...(kit.toneOfVoice || [])]);
  const emotionalDescriptors = uniqueValues([...(synthesizedPersonality?.emotionalDescriptors || [])]);

  const brandEssenceText = kit.brandEssence || 'Brand essence not available yet.';
  const summaryParagraph =
    kit.summaryParagraph || 'Generate a brand result to see the synthesized strategic summary.';
  const audienceSummary = kit.targetAudienceSummary || 'Audience direction was not returned in this result yet.';
  const voiceSummaryText =
    synthesizedMessaging?.voiceSummary || 'Messaging direction was not returned in this result yet.';
  const avoidList =
    synthesizedMessaging?.avoidLanguage?.length
      ? synthesizedMessaging.avoidLanguage
      : ['generic branding cliches', 'empty claims', 'language that sounds louder than the actual offer'];

  const messageExamples =
    synthesizedMessaging?.messagingPillars?.length
      ? synthesizedMessaging.messagingPillars
      : [kit.suggestedTagline || 'Messaging pillars were not returned in this result yet.'];
  const taglineDirections =
    synthesizedMessaging?.taglineDirections?.length
      ? synthesizedMessaging.taglineDirections
      : [kit.suggestedTagline || 'Tagline directions were not returned in this result yet.'];

  const paletteItems = (kit.colorPaletteSuggestions || []).map((color, index) => ({
    ...color,
    role: ['Primary', 'Secondary', 'Accent', 'Support'][index] || 'Support',
  }));

  const headlineFont = kit.fontPairing?.headlineFont || 'Heading font not specified';
  const bodyFont = kit.fontPairing?.bodyFont || 'Body font not specified';
  const accentFont = headlineFont;
  const essenceMission = synthesizedFoundation?.mission || 'Mission summary was not returned in this result yet.';
  const essencePositioning =
    synthesizedFoundation?.positioning || 'Positioning summary was not returned in this result yet.';
  const essenceEmotion =
    synthesizedFoundation?.emotionalCharacter || 'Emotional character was not returned in this result yet.';
  const logoConceptSummary =
    synthesizedLogoDirection?.conceptSummary || 'Logo direction was not returned in this result yet.';

  const logoDirectionNotes =
    synthesizedLogoDirection?.creativeNotes?.length
      ? synthesizedLogoDirection.creativeNotes
      : ['Creative notes were not returned in this result yet.'];

  const imagerySummary =
    synthesizedImagery?.photographyDirection ||
    kit.visualDirection ||
    'Imagery direction was not returned in this result yet.';
  const imageryMood = synthesizedImagery?.mood || 'Mood direction was not returned in this result yet.';
  const imageryArtDirection =
    synthesizedImagery?.artDirection || 'Art direction was not returned in this result yet.';
  const imageryNotes = synthesizedImagery?.referenceCues?.length ? synthesizedImagery.referenceCues : [];

  const applications = synthesizedApplications
    ? [
        { title: 'Website', text: synthesizedApplications.website },
        { title: 'Social', text: synthesizedApplications.social },
        { title: 'Packaging / Collateral', text: synthesizedApplications.packaging },
        { title: 'Campaign Direction', text: synthesizedApplications.campaign },
      ]
    : [
        {
          title: 'Website',
          text: 'Use the essence, typography, and palette as the fixed system so the site reads clearly from hero through detail pages.',
        },
        {
          title: 'Social',
          text: 'Keep posts visually consistent and let captions repeat the same messaging priorities instead of inventing a new tone each time.',
        },
        {
          title: 'Packaging / Collateral',
          text: 'Carry the core palette and type hierarchy into labels, decks, cards, and printed material so the brand feels owned in every format.',
        },
        {
          title: 'Campaign Direction',
          text: 'Anchor campaigns in one recurring promise, then translate it into repeatable image cues, copy hooks, and rollout structure.',
        },
      ];

  const handleGenerateLogo = async (options: {
    prompt: string;
    style: string;
    aspectRatio: string;
  }) => {
    if (!projectId) {
      showError('unknown', { message: 'Project not found. Please save your brand kit first.' });
      return;
    }

    setIsGeneratingLogo(true);

    try {
      const result = await generateLogo({
        prompt: options.prompt,
        style: options.style as any,
        aspectRatio: options.aspectRatio as any,
        colorPalette: paletteItems.map((color) => color.hex),
      });

      if (result.imageUrl) {
        setGeneratedLogoUrl(result.imageUrl);
        await onPersistGeneratedLogo?.(result.imageUrl);

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

  const jumpToSection = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatVersionDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));

  return (
    <div className="brand-page">
      <ErrorToast toasts={toasts} onDismiss={removeToast} />

      <div className="nav-top-bar">
        <button onClick={onBackToDashboard} className="nav-link-btn">
          ← DASHBOARD
        </button>
        <div className="nav-top-actions">
          <ThemeToggle />
          {!readOnly ? (
            <button onClick={onSignOut} className="nav-link-btn">
              [ SIGN OUT ]
            </button>
          ) : (
            <span className="nav-link-btn nav-link-static">RESULT VIEW</span>
          )}
        </div>
      </div>

      <BrandHeader
        onTitleClick={onBackToDashboard}
        subtitle={formData.brandName ? `Brand Identity: ${formData.brandName}` : 'The Mosaic Output'}
      />

      <section id="overview" className="kit-overview-sheet">
        <div className="kit-overview-copy">
          <div className="kit-overview-kicker">Generated Brand Direction</div>
          <h2 className="kit-overview-title">
            {formData.brandName || 'Your brand'} now has a clearer working system.
          </h2>
          <p className="kit-overview-text">
            This workbook gathers your answers into a strategic summary you can use for design,
            copy, visuals, and decision-making.
          </p>
          <p className="kit-overview-summary">{summaryParagraph}</p>

          <div className="kit-overview-actions">
            <button type="button" className="brand-submit-btn" onClick={onExportPdf}>
              [ EXPORT PDF ]
            </button>

            {!readOnly ? (
              <>
                <button type="button" className="brand-edit-btn" onClick={onCopyLink}>
                  [ COPY LINK ]
                </button>
                <button type="button" className="brand-edit-btn" onClick={onEdit}>
                  [ EDIT ANSWERS ]
                </button>
              </>
            ) : (
              onDuplicate && (
                <button type="button" className="brand-edit-btn" onClick={onDuplicate}>
                  [ DUPLICATE THIS KIT ]
                </button>
              )
            )}
          </div>
        </div>

        <div className="kit-overview-aside">
          <div className="kit-overview-note">
            <span className="kit-overview-note-label">Archetype</span>
            <strong>{kit.brandArchetype?.name || 'Emerging Direction'}</strong>
            <p>{kit.brandArchetype?.explanation || 'The broader role this brand wants to play is still coming into focus.'}</p>
          </div>

          <div className="kit-overview-note">
            <span className="kit-overview-note-label">Keywords</span>
            <div className="kit-tag-row">
              {personalityTraits.slice(0, 6).map((item) => (
                <span key={item} className="kit-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="kit-overview-note kit-version-note">
            <span className="kit-overview-note-label">Workbook Versions</span>
            <div className="kit-version-stack">
              {resultHistory.map((result, index) => {
                const versionNumber = resultHistory.length - index;
                const isActive = result.id === activeResultId;
                const isLatest = index === 0;

                return (
                  <button
                    key={result.id}
                    type="button"
                    className={`kit-version-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectResult(result.id)}
                  >
                    <div className="kit-version-item-top">
                      <strong>Version {versionNumber}</strong>
                      {isLatest && <span className="kit-version-badge">Latest</span>}
                    </div>
                    <span>{formatVersionDate(result.createdAt)}</span>
                    <p>{result.result.brandEssence || 'Saved brand direction.'}</p>
                    {result.sourceModel && (
                      <span className="kit-version-model">{result.sourceModel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="kit-layout">
        <aside className="kit-toc">
          <div className="kit-toc-title">Notebook Map</div>
          <div className="kit-toc-list">
            {SECTION_NAV.map((section, index) => (
              <button
                key={section.id}
                type="button"
                className="kit-toc-link"
                onClick={() => jumpToSection(section.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="kit-main">
          <NotebookSection
            id="essence"
            eyebrow="Core Identity"
            title="Brand Essence"
            contentToCopy={`${brandEssenceText}\n\n${summaryParagraph}`}
            isLocked={kitLocks.brandEssence}
            onToggleLock={!readOnly && onToggleLock ? () => onToggleLock('brandEssence') : undefined}
            onRegenerate={!readOnly && onRegenerateSection ? () => onRegenerateSection('brandEssence') : undefined}
            isRegenerating={isRegenerating}
            canRegenerate={!readOnly}
          >
            <p className="kit-essence">{brandEssenceText}</p>

            <div className="kit-note-grid">
              <div className="kit-note-card">
                <span className="kit-note-label">Mission / Purpose</span>
                <p>{essenceMission}</p>
              </div>
              <div className="kit-note-card">
                <span className="kit-note-label">Positioning</span>
                <p>{essencePositioning}</p>
              </div>
              <div className="kit-note-card">
                <span className="kit-note-label">Audience</span>
                <p>{audienceSummary}</p>
              </div>
              <div className="kit-note-card">
                <span className="kit-note-label">Emotional Character</span>
                <p>{essenceEmotion}</p>
              </div>
            </div>
          </NotebookSection>

          <NotebookSection
            id="personality"
            eyebrow="How The Brand Feels"
            title="Brand Personality"
            contentToCopy={[...personalityTraits, ...personalityTone, ...emotionalDescriptors].join(', ')}
          >
            <div className="kit-personality-groups">
              <div className="kit-personality-group">
                <span className="kit-note-label">Traits</span>
                <div className="kit-tag-row">
                  {personalityTraits.map((item) => (
                    <span key={item} className="kit-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="kit-personality-group">
                <span className="kit-note-label">Tone</span>
                <div className="kit-tag-row">
                  {personalityTone.map((item) => (
                    <span key={item} className="kit-tag kit-tag-accent">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="kit-personality-group">
                <span className="kit-note-label">Emotional Feel</span>
                <div className="kit-tag-row">
                  {emotionalDescriptors.map((item) => (
                    <span key={item} className="kit-tag kit-tag-soft">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </NotebookSection>

          <NotebookSection
            id="palette"
            eyebrow="Visual System"
            title="Color Palette"
            contentToCopy={paletteItems.map((color) => `${color.role}: ${color.name} ${color.hex} — ${color.usage}`).join('\n')}
            onRegenerate={!readOnly && onRegenerateSection ? () => onRegenerateSection('colorPaletteSuggestions') : undefined}
            isRegenerating={isRegenerating}
            canRegenerate={!readOnly}
          >
            {paletteItems.length > 0 ? (
              <div className="kit-palette-grid">
                {paletteItems.map((color) => (
                  <div key={`${color.name}-${color.hex}`} className="kit-palette-card">
                    <div className="kit-palette-swatch" style={{ backgroundColor: color.hex }} />
                    <div className="kit-palette-meta">
                      <span className="kit-palette-role">{color.role}</span>
                      <strong>{color.name}</strong>
                      <span>{color.hex}</span>
                      <p>{color.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kit-empty-note">
                No palette suggestions were generated yet. Regenerate the result after refining the workbook if you want a clearer palette system.
              </div>
            )}
          </NotebookSection>

          <NotebookSection
            id="typography"
            eyebrow="Reading Rhythm"
            title="Typography"
            contentToCopy={`${headlineFont}\n${bodyFont}\n${kit.fontPairing?.note || 'Use the type pairing with restraint and consistency.'}`}
          >
            <div className="kit-type-grid">
              <div className="kit-type-card">
                <span className="kit-note-label">Display / Heading</span>
                <strong>{headlineFont}</strong>
                <div className={`kit-type-preview ${inferFontPreviewClass(headlineFont)}`}>Brand Mosaic</div>
                <p>Use for page titles, section headlines, and places where the brand should feel most expressive.</p>
              </div>

              <div className="kit-type-card">
                <span className="kit-note-label">Body</span>
                <strong>{bodyFont}</strong>
                <div className={`kit-type-preview ${inferFontPreviewClass(bodyFont)}`}>Clear, practical body copy for everyday reading.</div>
                <p>Use for paragraphs, supporting notes, and content that needs clarity first.</p>
              </div>

              <div className="kit-type-card">
                <span className="kit-note-label">Accent / Reference</span>
                <strong>{accentFont}</strong>
                <div className={`kit-type-preview ${inferFontPreviewClass(accentFont)}`}>A smaller styling cue for labels, pull quotes, or emphasis.</div>
                <p>{kit.fontPairing?.note || 'Treat this as a style cue rather than a strict final font prescription.'}</p>
              </div>
            </div>
          </NotebookSection>

          <NotebookSection
            id="logo"
            eyebrow="Mark Direction"
            title="Logo Direction"
            contentToCopy={kit.logoPrompt || ''}
            onRegenerate={!readOnly && onRegenerateSection ? () => onRegenerateSection('logoDirection') : undefined}
            isRegenerating={isRegenerating}
            canRegenerate={!readOnly}
          >
            <div className="kit-logo-layout">
              <div className="kit-logo-copy">
                <p className="kit-paragraph">{logoConceptSummary}</p>

                <div className="kit-note-grid">
                  {logoDirectionNotes.map((item) => (
                    <div key={item} className="kit-note-card">
                      <span className="kit-note-label">Creative Note</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kit-logo-prompt-block">
                <span className="kit-note-label">Logo Prompt</span>
                <p>{kit.logoPrompt || 'A full logo prompt becomes available when the analysis returns logo direction details.'}</p>
              </div>
            </div>

            {!readOnly && kit.logoPrompt && (
              <LogoGenerator
                logoPrompt={kit.logoPrompt}
                onGenerate={handleGenerateLogo}
                isGenerating={isGeneratingLogo}
                disabled={false}
              />
            )}

            {generatedLogoUrl && (
              <LogoDisplay
                logoUrl={generatedLogoUrl}
                onRegenerate={() => setGeneratedLogoUrl(null)}
                onDownload={() => showSuccess('Logo downloaded!')}
                isGenerating={isGeneratingLogo}
              />
            )}
          </NotebookSection>

          <NotebookSection
            id="voice"
            eyebrow="Messaging"
            title="Voice & Messaging"
            contentToCopy={`${voiceSummaryText}\n\n${messageExamples.join('\n')}\n\n${taglineDirections.join('\n')}`}
            onRegenerate={!readOnly && onRegenerateSection ? () => onRegenerateSection('messagingDirection') : undefined}
            isRegenerating={isRegenerating}
            canRegenerate={!readOnly}
          >
            <div className="kit-voice-grid">
              <div className="kit-voice-card">
                <span className="kit-note-label">Brand voice is...</span>
                <p>{voiceSummaryText}</p>
              </div>

              <div className="kit-voice-card">
                <span className="kit-note-label">Say it like this...</span>
                <ul className="kit-bullet-list">
                  {messageExamples.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="kit-voice-card">
                <span className="kit-note-label">Tagline directions...</span>
                <ul className="kit-bullet-list">
                  {taglineDirections.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="kit-voice-card">
                <span className="kit-note-label">Avoid sounding like...</span>
                <ul className="kit-bullet-list">
                  {avoidList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </NotebookSection>

          <NotebookSection
            id="imagery"
            eyebrow="Visual World"
            title="Imagery / Visual Direction"
            contentToCopy={`${imagerySummary}\n\n${imageryMood}\n\n${imageryArtDirection}\n\n${imageryNotes.join(', ')}`}
            onRegenerate={!readOnly && onRegenerateSection ? () => onRegenerateSection('imageryDirection') : undefined}
            isRegenerating={isRegenerating}
            canRegenerate={!readOnly}
          >
            <p className="kit-paragraph">{imagerySummary}</p>

            <div className="kit-note-grid">
              <div className="kit-note-card">
                <span className="kit-note-label">Mood Cues</span>
                <p>{imageryMood}</p>
              </div>
              <div className="kit-note-card">
                <span className="kit-note-label">Art Direction</span>
                <p>{imageryArtDirection}</p>
              </div>
              <div className="kit-note-card">
                <span className="kit-note-label">Photography Direction</span>
                <p>{imagerySummary}</p>
              </div>
              <div className="kit-note-card">
                <span className="kit-note-label">Reference Cues</span>
                <p>{imageryNotes.length > 0 ? joinAsSentence(imageryNotes) : 'Reference cues still need more detail.'}</p>
              </div>
            </div>

            {imageryNotes.length > 0 && (
              <div className="kit-reference-strip">
                <span className="kit-note-label">Reference Cues</span>
                <div className="kit-tag-row">
                  {uniqueValues(imageryNotes).map((item) => (
                    <span key={item} className="kit-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </NotebookSection>

          <NotebookSection
            id="applications"
            eyebrow="Use It In The World"
            title="Real-World Applications"
            contentToCopy={applications.map((item) => `${item.title}: ${item.text}`).join('\n')}
          >
            <div className="kit-application-grid">
              {applications.map((item) => (
                <div key={item.title} className="kit-application-card">
                  <span className="kit-note-label">{item.title}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </NotebookSection>

          <NotebookSection
            id="recap"
            eyebrow="Your Starting Material"
            title="Original Input Recap"
          >
            <div className="kit-recap-intro">
              Open any group below to compare the generated direction with the answers you originally gave.
            </div>
            <BrandSummary formData={formData} onEdit={onEdit} readOnly={true} />
          </NotebookSection>
        </div>
      </div>

    </div>
  );
};

export default BrandKit;

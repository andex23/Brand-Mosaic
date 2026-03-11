import { BrandFormData, BrandKit } from '../types';

interface BrandKitExportOptions {
  brandName: string;
  kit: BrandKit;
  formData: BrandFormData;
  exportedAt: string;
  sourceModel?: string;
  versionLabel?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderList = (items: string[]) =>
  items.length > 0
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-note">No notes saved for this section yet.</p>';

const renderPalette = (kit: BrandKit) =>
  kit.colorPaletteSuggestions.length > 0
    ? `<div class="palette-grid">
        ${kit.colorPaletteSuggestions
          .map(
            (color, index) => `<div class="palette-card">
                <div class="swatch" style="background:${escapeHtml(color.hex || '#f1ece2')}"></div>
                <div class="meta">
                  <div class="role">${['Primary', 'Secondary', 'Accent', 'Support'][index] || 'Support'}</div>
                  <strong>${escapeHtml(color.name || 'Unnamed')}</strong>
                  <span>${escapeHtml(color.hex || '')}</span>
                  <p>${escapeHtml(color.usage || '')}</p>
                </div>
              </div>`
          )
          .join('')}
      </div>`
    : '<p class="empty-note">Palette suggestions were not saved for this version yet.</p>';

const recapRows = (formData: BrandFormData) => {
  const items: Array<[string, string]> = [
    ['Brand name', formData.brandName],
    ['Offering', formData.offering],
    ['Purpose', formData.purpose],
    ['Problem solved', formData.problem],
    ['Audience', formData.audience.join(', ')],
    ['Customer priorities', formData.customerCare],
    ['Tone', formData.tone.join(', ')],
    ['Feeling', formData.feeling],
    ['Adjectives', formData.adjectives],
    ['Palette', [formData.palette, formData.customPalette].filter(Boolean).join(' / ')],
    ['Visual vibe', [...formData.vibe, formData.customVibe || ''].filter(Boolean).join(', ')],
    ['Mood keywords', formData.moodBoardKeywords],
    ['Typography', [formData.typography, formData.customFont].filter(Boolean).join(' / ')],
    ['Differentiation', formData.differentiation],
    ['Competitors', formData.competitors],
    ['Tagline input', formData.tagline],
    ['Logo preference', [formData.logoExists, formData.logoPreference].filter(Boolean).join(' / ')],
    ['Fashion cue', formData.fashion],
    ['Soundtrack cue', formData.soundtrack],
    ['Inspiration', formData.inspiration],
  ].filter(([, value]) => value && value.trim().length > 0);

  return items
    .map(
      ([label, value]) => `<div class="recap-row">
          <span>${escapeHtml(label)}</span>
          <p>${escapeHtml(value)}</p>
        </div>`
    )
    .join('');
};

const buildExportHtml = ({
  brandName,
  kit,
  formData,
  exportedAt,
  sourceModel,
  versionLabel,
}: BrandKitExportOptions) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(brandName)} Brand Workbook</title>
    <style>
      :root {
        color-scheme: light;
        --paper: #f7f1e7;
        --ink: #25201b;
        --muted: #6f665e;
        --line: rgba(37, 32, 27, 0.14);
        --accent: #b8753f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Georgia", "Times New Roman", serif;
        color: var(--ink);
        background: var(--paper);
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 48px 40px 72px;
      }
      .cover {
        padding: 28px 0 36px;
        border-bottom: 1px solid var(--line);
      }
      .kicker, .label, .role {
        font-family: "Arial", sans-serif;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-size: 11px;
        color: var(--muted);
      }
      h1, h2, h3, strong {
        font-weight: 600;
      }
      h1 {
        font-size: 40px;
        line-height: 1.1;
        margin: 14px 0 10px;
      }
      h2 {
        font-size: 22px;
        margin: 0 0 14px;
      }
      p {
        margin: 0;
        line-height: 1.65;
        font-size: 15px;
      }
      .cover-meta {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
        margin-top: 18px;
      }
      .cover-chip, .tag {
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 8px 12px;
        font-family: "Arial", sans-serif;
        font-size: 12px;
        background: rgba(255,255,255,0.5);
      }
      .section {
        padding: 28px 0;
        border-bottom: 1px solid var(--line);
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .note-card, .voice-card, .application-card, .type-card, .recap-row, .palette-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255,255,255,0.44);
      }
      .note-card, .voice-card, .application-card, .type-card, .recap-row {
        padding: 18px;
      }
      .tag-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .palette-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .palette-card {
        overflow: hidden;
      }
      .swatch {
        height: 120px;
        border-bottom: 1px solid var(--line);
      }
      .palette-card .meta {
        padding: 16px;
      }
      .palette-card strong, .type-card strong {
        display: block;
        font-size: 18px;
        margin: 6px 0;
      }
      ul {
        margin: 10px 0 0;
        padding-left: 18px;
      }
      li {
        margin: 8px 0;
        line-height: 1.55;
      }
      .type-grid, .voice-grid, .application-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .type-preview {
        margin: 12px 0;
        padding: 14px;
        border-radius: 12px;
        background: rgba(184, 117, 63, 0.08);
        font-size: 24px;
      }
      .summary {
        font-size: 18px;
        margin-top: 18px;
        max-width: 780px;
      }
      .empty-note {
        color: var(--muted);
      }
      .recap {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .recap-row span {
        display: block;
        margin-bottom: 8px;
      }
      @media print {
        main { padding: 24px 24px 48px; }
      }
      @media (max-width: 800px) {
        main { padding: 32px 20px 48px; }
        .grid-2, .palette-grid, .type-grid, .voice-grid, .application-grid, .recap {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="cover">
        <div class="kicker">Brand Mosaic Workbook Export</div>
        <h1>${escapeHtml(brandName)}</h1>
        <p>${escapeHtml(kit.brandEssence || 'Generated brand direction')}</p>
        <p class="summary">${escapeHtml(kit.summaryParagraph || 'This export captures the latest saved strategic direction for the workbook.')}</p>
        <div class="cover-meta">
          ${versionLabel ? `<span class="cover-chip">${escapeHtml(versionLabel)}</span>` : ''}
          <span class="cover-chip">${escapeHtml(new Date(exportedAt).toLocaleString())}</span>
          ${sourceModel ? `<span class="cover-chip">${escapeHtml(sourceModel)}</span>` : ''}
        </div>
      </section>

      <section class="section">
        <div class="label">Brand Essence</div>
        <h2>Core identity and positioning</h2>
        <div class="grid-2">
          <div class="note-card">
            <div class="label">Mission</div>
            <p>${escapeHtml(kit.brandFoundation?.mission || '')}</p>
          </div>
          <div class="note-card">
            <div class="label">Positioning</div>
            <p>${escapeHtml(kit.brandFoundation?.positioning || '')}</p>
          </div>
          <div class="note-card">
            <div class="label">Audience</div>
            <p>${escapeHtml(kit.targetAudienceSummary || '')}</p>
          </div>
          <div class="note-card">
            <div class="label">Emotional character</div>
            <p>${escapeHtml(kit.brandFoundation?.emotionalCharacter || '')}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Personality</div>
        <h2>Traits, tone, and feel</h2>
        <div class="tag-row">
          ${(kit.personalityProfile?.traits || kit.keywords || [])
            .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
            .join('')}
          ${(kit.personalityProfile?.tone || kit.toneOfVoice || [])
            .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
            .join('')}
          ${(kit.personalityProfile?.emotionalDescriptors || [])
            .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
            .join('')}
        </div>
      </section>

      <section class="section">
        <div class="label">Visual System</div>
        <h2>Color palette</h2>
        ${renderPalette(kit)}
      </section>

      <section class="section">
        <div class="label">Typography</div>
        <h2>Reading rhythm</h2>
        <div class="type-grid">
          <div class="type-card">
            <div class="label">Display / Heading</div>
            <strong>${escapeHtml(kit.fontPairing?.headlineFont || 'Not specified')}</strong>
            <div class="type-preview">Brand Mosaic</div>
            <p>Use for page titles, hero moments, and signature headings.</p>
          </div>
          <div class="type-card">
            <div class="label">Body</div>
            <strong>${escapeHtml(kit.fontPairing?.bodyFont || 'Not specified')}</strong>
            <div class="type-preview" style="font-size:18px;">Clear, practical body copy.</div>
            <p>Use for paragraphs, product details, and longer reading.</p>
          </div>
          <div class="type-card">
            <div class="label">Usage note</div>
            <strong>Pairing guidance</strong>
            <p>${escapeHtml(kit.fontPairing?.note || 'Treat the type pairing as a direction, then keep its use consistent.')}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Logo Direction</div>
        <h2>Mark concept and creative note</h2>
        <div class="grid-2">
          <div class="note-card">
            <div class="label">Concept summary</div>
            <p>${escapeHtml(kit.logoDirection?.conceptSummary || '')}</p>
            ${renderList(kit.logoDirection?.creativeNotes || [])}
          </div>
          <div class="note-card">
            <div class="label">Logo prompt</div>
            <p>${escapeHtml(kit.logoPrompt || '')}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Voice & Messaging</div>
        <h2>How the brand should sound</h2>
        <div class="voice-grid">
          <div class="voice-card">
            <div class="label">Voice summary</div>
            <p>${escapeHtml(kit.messagingDirection?.voiceSummary || '')}</p>
          </div>
          <div class="voice-card">
            <div class="label">Messaging pillars</div>
            ${renderList(kit.messagingDirection?.messagingPillars || [])}
          </div>
          <div class="voice-card">
            <div class="label">Tagline directions</div>
            ${renderList(kit.messagingDirection?.taglineDirections || [])}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Imagery</div>
        <h2>Photography and art direction</h2>
        <div class="grid-2">
          <div class="note-card">
            <div class="label">Photography direction</div>
            <p>${escapeHtml(kit.imageryDirection?.photographyDirection || kit.visualDirection || '')}</p>
          </div>
          <div class="note-card">
            <div class="label">Mood</div>
            <p>${escapeHtml(kit.imageryDirection?.mood || '')}</p>
          </div>
          <div class="note-card">
            <div class="label">Art direction</div>
            <p>${escapeHtml(kit.imageryDirection?.artDirection || '')}</p>
          </div>
          <div class="note-card">
            <div class="label">Reference cues</div>
            ${renderList(kit.imageryDirection?.referenceCues || [])}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Applications</div>
        <h2>How this direction can be used</h2>
        <div class="application-grid">
          <div class="application-card">
            <div class="label">Website</div>
            <p>${escapeHtml(kit.applicationDirection?.website || '')}</p>
          </div>
          <div class="application-card">
            <div class="label">Social</div>
            <p>${escapeHtml(kit.applicationDirection?.social || '')}</p>
          </div>
          <div class="application-card">
            <div class="label">Packaging / Campaign</div>
            <p>${escapeHtml(
              [kit.applicationDirection?.packaging, kit.applicationDirection?.campaign]
                .filter(Boolean)
                .join(' ')
            )}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Original Input Recap</div>
        <h2>Source notes from the workbook</h2>
        <div class="recap">${recapRows(formData)}</div>
      </section>
    </main>
  </body>
</html>`;

export const openBrandKitPdfExport = async (options: BrandKitExportOptions) => {
  const exportWindow = window.open('', '_blank', 'noopener,noreferrer');

  if (!exportWindow) {
    throw new Error('Export window blocked.');
  }

  exportWindow.document.open();
  exportWindow.document.write(buildExportHtml(options));
  exportWindow.document.close();
  exportWindow.focus();

  await new Promise((resolve) => window.setTimeout(resolve, 180));
  exportWindow.print();
};

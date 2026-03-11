import type { BrandFormData, BrandKit, RegenerableKitSectionId } from '../types.ts';

export const BRAND_WRITING_STANDARD = `
Writing standard:
- Be specific.
- Be concise.
- Be directional.
- Be tasteful.
- Be readable.
- Prefer sharp sentences over padded paragraphs.
- Prefer real strategic language over branding cliches.
- Every section should help a founder make better decisions.
- The result should feel like an intelligent creative strategist, not a chatbot summary.
- If the input is thin, stay restrained and practical instead of filling space with generic claims.
- Avoid cliches like: elevate, stand out, authentic storytelling, game-changing, innovative solutions, unforgettable, next-level, journey.
`;

const cleanText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const cleanList = (value: unknown, maxItems: number): string[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();

  return value
    .map((item) => cleanText(item))
    .filter((item) => {
      if (!item || seen.has(item.toLowerCase())) return false;
      seen.add(item.toLowerCase());
      return true;
    })
    .slice(0, maxItems);
};

export const normalizeBrandKit = (raw: Partial<BrandKit>): BrandKit => ({
  brandEssence: cleanText(raw.brandEssence),
  summaryParagraph: cleanText(raw.summaryParagraph),
  keywords: cleanList(raw.keywords, 6),
  toneOfVoice: cleanList(raw.toneOfVoice, 6),
  targetAudienceSummary: cleanText(raw.targetAudienceSummary),
  visualDirection: cleanText(raw.visualDirection),
  brandArchetype: {
    name: cleanText(raw.brandArchetype?.name),
    explanation: cleanText(raw.brandArchetype?.explanation),
  },
  suggestedTagline: cleanText(raw.suggestedTagline),
  colorPaletteSuggestions: Array.isArray(raw.colorPaletteSuggestions)
    ? raw.colorPaletteSuggestions
        .map((color) => ({
          name: cleanText(color?.name),
          hex: cleanText(color?.hex).toUpperCase(),
          usage: cleanText(color?.usage),
        }))
        .filter((color) => color.name || color.hex || color.usage)
        .slice(0, 4)
    : [],
  fontPairing: {
    headlineFont: cleanText(raw.fontPairing?.headlineFont),
    bodyFont: cleanText(raw.fontPairing?.bodyFont),
    note: cleanText(raw.fontPairing?.note),
  },
  logoPrompt: cleanText(raw.logoPrompt),
  brandFoundation:
    raw.brandFoundation &&
    (cleanText(raw.brandFoundation.mission) ||
      cleanText(raw.brandFoundation.positioning) ||
      cleanText(raw.brandFoundation.emotionalCharacter))
      ? {
          mission: cleanText(raw.brandFoundation.mission),
          positioning: cleanText(raw.brandFoundation.positioning),
          emotionalCharacter: cleanText(raw.brandFoundation.emotionalCharacter),
        }
      : undefined,
  personalityProfile:
    raw.personalityProfile &&
    (
      cleanList(raw.personalityProfile.traits, 6).length ||
      cleanList(raw.personalityProfile.tone, 6).length ||
      cleanList(raw.personalityProfile.emotionalDescriptors, 6).length
    )
      ? {
          traits: cleanList(raw.personalityProfile.traits, 6),
          tone: cleanList(raw.personalityProfile.tone, 6),
          emotionalDescriptors: cleanList(raw.personalityProfile.emotionalDescriptors, 6),
        }
      : undefined,
  messagingDirection:
    raw.messagingDirection &&
    (
      cleanText(raw.messagingDirection.voiceSummary) ||
      cleanList(raw.messagingDirection.messagingPillars, 5).length ||
      cleanList(raw.messagingDirection.avoidLanguage, 5).length ||
      cleanList(raw.messagingDirection.taglineDirections, 4).length
    )
      ? {
          voiceSummary: cleanText(raw.messagingDirection.voiceSummary),
          messagingPillars: cleanList(raw.messagingDirection.messagingPillars, 5),
          avoidLanguage: cleanList(raw.messagingDirection.avoidLanguage, 5),
          taglineDirections: cleanList(raw.messagingDirection.taglineDirections, 4),
        }
      : undefined,
  imageryDirection:
    raw.imageryDirection &&
    (
      cleanText(raw.imageryDirection.photographyDirection) ||
      cleanText(raw.imageryDirection.mood) ||
      cleanText(raw.imageryDirection.artDirection) ||
      cleanList(raw.imageryDirection.referenceCues, 6).length
    )
      ? {
          photographyDirection: cleanText(raw.imageryDirection.photographyDirection),
          mood: cleanText(raw.imageryDirection.mood),
          artDirection: cleanText(raw.imageryDirection.artDirection),
          referenceCues: cleanList(raw.imageryDirection.referenceCues, 6),
        }
      : undefined,
  applicationDirection:
    raw.applicationDirection &&
    (
      cleanText(raw.applicationDirection.website) ||
      cleanText(raw.applicationDirection.social) ||
      cleanText(raw.applicationDirection.packaging) ||
      cleanText(raw.applicationDirection.campaign)
    )
      ? {
          website: cleanText(raw.applicationDirection.website),
          social: cleanText(raw.applicationDirection.social),
          packaging: cleanText(raw.applicationDirection.packaging),
          campaign: cleanText(raw.applicationDirection.campaign),
        }
      : undefined,
  logoDirection:
    raw.logoDirection &&
    (cleanText(raw.logoDirection.conceptSummary) || cleanList(raw.logoDirection.creativeNotes, 5).length)
      ? {
          conceptSummary: cleanText(raw.logoDirection.conceptSummary),
          creativeNotes: cleanList(raw.logoDirection.creativeNotes, 5),
        }
      : undefined,
});

export const buildFullBrandKitPrompt = (data: BrandFormData): string => `You are Brand Mosaic, an intelligent creative strategist. Analyze the brand data below and return valid JSON only.

Brand input:
${JSON.stringify(data, null, 2)}

${BRAND_WRITING_STANDARD}

Synthesis rule:
- Do not map each questionnaire answer directly to one output field.
- Read the entire answer set first, then synthesize the brand as a whole.
- Cross-reference all answers before writing any section.

Field guidance:
- brandEssence: exactly 1 sentence, 16 to 26 words. This should define the brand's role, not flatter it.
- summaryParagraph: 2 or 3 sharp sentences, max 90 words.
- keywords: 4 to 6 strong descriptors. Specific, not trendy filler.
- toneOfVoice: 3 to 5 concise voice directions a founder can apply in copy reviews.
- targetAudienceSummary: 1 or 2 sentences on who the brand serves and what they care about.
- visualDirection: 2 or 3 short sentences on atmosphere, materials, composition, and image feel.
- brandArchetype.name: concise and believable. Avoid forced mythology.
- brandArchetype.explanation: 1 short sentence explaining why the archetype fits.
- suggestedTagline: short, elegant, usable in the real world.
- colorPaletteSuggestions: 3 or 4 colors max. Give each a distinct role and a practical usage note.
- fontPairing.headlineFont and bodyFont: realistic suggestions, not novelty fonts.
- fontPairing.note: 1 short sentence on how the pairing should be used.
- brandFoundation: synthesize the full answer set into mission, positioning, and emotionalCharacter. Do not copy the raw questionnaire wording.
- personalityProfile: synthesize traits, tone, and emotionalDescriptors by cross-referencing the full answer set.
- messagingDirection: synthesize voiceSummary, messagingPillars, avoidLanguage, and taglineDirections from the full answer set.
- imageryDirection: synthesize photographyDirection, mood, artDirection, and referenceCues from the full answer set.
- applicationDirection: synthesize website, social, packaging, and campaign guidance from the full answer set.
- logoDirection: synthesize conceptSummary and creativeNotes from the full answer set before writing the logoPrompt.
- logoPrompt: write this like a tight creative direction brief, not a rambling image prompt.

Do not use markdown. Do not mention AI. Do not hedge. Do not repeat the same idea across fields.`;

const SECTION_REGEN_RULES: Record<
  RegenerableKitSectionId,
  {
    label: string;
    fields: string[];
    guidance: string[];
  }
> = {
  brandEssence: {
    label: 'Brand Essence',
    fields: ['brandEssence', 'summaryParagraph', 'targetAudienceSummary', 'brandFoundation'],
    guidance: [
      'brandEssence must be exactly 1 sentence and stay between 16 and 26 words.',
      'summaryParagraph must sharpen the strategic summary without repeating the brandEssence sentence.',
      'brandFoundation must update mission, positioning, and emotionalCharacter together so the section reads as one system.',
    ],
  },
  messagingDirection: {
    label: 'Voice & Messaging',
    fields: ['toneOfVoice', 'suggestedTagline', 'messagingDirection'],
    guidance: [
      'Make the voice specific enough to guide real copy reviews.',
      'taglineDirections should feel usable, not slogan soup.',
      'avoidLanguage should call out patterns the founder should actively avoid.',
    ],
  },
  colorPaletteSuggestions: {
    label: 'Color Palette',
    fields: ['colorPaletteSuggestions', 'fontPairing'],
    guidance: [
      'Return 3 or 4 colors max.',
      'Every palette color must have a clear role and practical usage note.',
      'fontPairing should stay realistic and support the same visual world as the palette.',
    ],
  },
  logoDirection: {
    label: 'Logo Direction',
    fields: ['logoDirection', 'logoPrompt'],
    guidance: [
      'logoDirection should read like concise creative direction notes.',
      'logoPrompt must be tight, practical, and visually specific.',
      'Do not output image-model filler words or long prompt padding.',
    ],
  },
  imageryDirection: {
    label: 'Imagery Direction',
    fields: ['visualDirection', 'imageryDirection'],
    guidance: [
      'Keep the section grounded in photography, framing, materials, mood, and art direction.',
      'referenceCues should be useful shorthand, not vague adjectives.',
      'The updated section should help a founder brief a photographer or designer more clearly.',
    ],
  },
};

export const getSectionRegenerationLabel = (sectionId: RegenerableKitSectionId) =>
  SECTION_REGEN_RULES[sectionId].label;

export const buildSectionRegenerationPrompt = (
  sectionId: RegenerableKitSectionId,
  data: BrandFormData,
  currentKit: BrandKit
) => {
  const config = SECTION_REGEN_RULES[sectionId];

  return `You are Brand Mosaic, an intelligent creative strategist.

${BRAND_WRITING_STANDARD}

You are revising only the ${config.label} section of an existing brand workbook.

Brand input:
${JSON.stringify(data, null, 2)}

Current saved brand direction:
${JSON.stringify(currentKit, null, 2)}

Synthesis rule:
- Re-read the entire answer set first.
- Cross-reference the full workbook before changing any field.
- Revise only the fields requested below.
- Keep the rest of the brand system coherent with the current saved result.

Return valid JSON only with these fields:
${config.fields.join(', ')}

Section guidance:
${config.guidance.map((item) => `- ${item}`).join('\n')}

Do not use markdown. Do not mention AI. Do not repeat ideas already handled better elsewhere in the kit.`;
};

export const mergeRegeneratedBrandKitSection = (
  sectionId: RegenerableKitSectionId,
  currentKit: BrandKit,
  patch: Partial<BrandKit>
): BrandKit => {
  switch (sectionId) {
    case 'brandEssence':
      return normalizeBrandKit({
        ...currentKit,
        brandEssence: patch.brandEssence ?? currentKit.brandEssence,
        summaryParagraph: patch.summaryParagraph ?? currentKit.summaryParagraph,
        targetAudienceSummary: patch.targetAudienceSummary ?? currentKit.targetAudienceSummary,
        brandFoundation: patch.brandFoundation ?? currentKit.brandFoundation,
      });
    case 'messagingDirection':
      return normalizeBrandKit({
        ...currentKit,
        toneOfVoice: patch.toneOfVoice ?? currentKit.toneOfVoice,
        suggestedTagline: patch.suggestedTagline ?? currentKit.suggestedTagline,
        messagingDirection: patch.messagingDirection ?? currentKit.messagingDirection,
      });
    case 'colorPaletteSuggestions':
      return normalizeBrandKit({
        ...currentKit,
        colorPaletteSuggestions:
          patch.colorPaletteSuggestions ?? currentKit.colorPaletteSuggestions,
        fontPairing: patch.fontPairing ?? currentKit.fontPairing,
      });
    case 'logoDirection':
      return normalizeBrandKit({
        ...currentKit,
        logoDirection: patch.logoDirection ?? currentKit.logoDirection,
        logoPrompt: patch.logoPrompt ?? currentKit.logoPrompt,
      });
    case 'imageryDirection':
      return normalizeBrandKit({
        ...currentKit,
        visualDirection: patch.visualDirection ?? currentKit.visualDirection,
        imageryDirection: patch.imageryDirection ?? currentKit.imageryDirection,
      });
    default:
      return normalizeBrandKit({
        ...currentKit,
        ...patch,
      });
  }
};

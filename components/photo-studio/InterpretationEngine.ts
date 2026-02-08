/**
 * Interpretation Engine — Photo Studio
 *
 * Converts user mood text into bounded, structured modifiers.
 * Scene rules always override user intent. This is not a prompt playground.
 *
 * Process:
 *  1. Sanitize input (strip jargon, hype, URLs, emojis)
 *  2. Extract intent dimensions (temperature, energy, material, light)
 *  3. Resolve conflicts with scene rules
 *  4. Normalize to bounded modifiers
 */

import { MoodInterpretation, SceneType } from '../../types';

// ── Keyword Dictionaries ──────────────────────────────

const TEMPERATURE_KEYWORDS: Record<string, string[]> = {
  warm: [
    'warm', 'golden', 'amber', 'sunset', 'autumn', 'cozy', 'terracotta',
    'honey', 'rustic', 'copper', 'earth', 'earthy', 'sun', 'clay',
    'orange', 'yellow', 'candlelight', 'firelight', 'spice', 'sahara',
  ],
  cool: [
    'cool', 'cold', 'ice', 'winter', 'blue', 'silver', 'moonlight',
    'frost', 'arctic', 'steel', 'slate', 'ocean', 'marine', 'teal',
    'glacier', 'crisp', 'fresh', 'mint', 'lavender', 'twilight',
  ],
  neutral: [
    'neutral', 'balanced', 'clean', 'white', 'gray', 'grey', 'minimal',
    'pure', 'simple', 'clear', 'monochrome', 'matte',
  ],
};

const ENERGY_KEYWORDS: Record<string, string[]> = {
  calm: [
    'calm', 'serene', 'quiet', 'peaceful', 'zen', 'still', 'gentle',
    'soft', 'subtle', 'muted', 'whisper', 'tranquil', 'restful',
    'meditative', 'hushed', 'tender', 'delicate',
  ],
  vibrant: [
    'vibrant', 'bold', 'energetic', 'dynamic', 'bright', 'punchy',
    'saturated', 'intense', 'electric', 'vivid', 'loud', 'striking',
    'powerful', 'fierce', 'dramatic', 'strong',
  ],
  moderate: [
    'moderate', 'balanced', 'natural', 'organic', 'grounded', 'steady',
    'classic', 'everyday', 'approachable', 'comfortable',
  ],
};

const MATERIAL_KEYWORDS: Record<string, string[]> = {
  marble: ['marble', 'stone', 'elegant', 'refined', 'polished', 'veined'],
  wood: ['wood', 'wooden', 'natural', 'organic', 'rustic', 'earthy', 'cabin', 'oak', 'walnut', 'pine', 'grain'],
  concrete: ['concrete', 'industrial', 'urban', 'brutalist', 'raw', 'loft', 'cement', 'grey'],
  fabric: ['fabric', 'linen', 'textile', 'soft', 'draped', 'silk', 'cotton', 'velvet', 'woven', 'cloth'],
  metal: ['metal', 'chrome', 'steel', 'futuristic', 'modern', 'tech', 'aluminum', 'brushed', 'iron'],
  ceramic: ['ceramic', 'pottery', 'artisan', 'handmade', 'clay', 'terracotta', 'glazed'],
};

const LIGHT_QUALITY_KEYWORDS: Record<string, string[]> = {
  'soft diffused': ['soft', 'diffused', 'gentle', 'cloud', 'overcast', 'flat', 'even', 'ambient'],
  'golden hour': ['golden', 'sunset', 'sunrise', 'warm glow', 'amber light', 'magic hour'],
  'directional': ['dramatic', 'directional', 'shadow', 'contrast', 'moody', 'chiaroscuro', 'sculpted', 'angular'],
  'bright even': ['bright', 'clean', 'even', 'daylight', 'clear', 'crisp light', 'studio'],
};

// Words to strip during sanitization
const JARGON_WORDS = [
  '8k', '4k', 'hdr', 'cinematic', 'ultra', 'hyper', 'realistic',
  'photorealistic', 'octane', 'unreal', 'render', 'raytracing',
  'bokeh', 'depth of field', 'dslr', 'canon', 'nikon', 'sony',
  'masterpiece', 'best quality', 'award winning', 'trending',
  'artstation', 'deviantart', 'behance', 'dribbble',
];

const HYPE_WORDS = [
  'luxury', 'luxurious', 'premium', 'exclusive', 'aesthetic',
  'vibe', 'vibes', 'vibez', 'fire', 'lit', 'slay', 'iconic',
  'insane', 'amazing', 'gorgeous', 'stunning', 'breathtaking',
  'incredible', 'unbelievable', 'epic', 'legendary', 'goated',
];

// ── Sanitization ──────────────────────────────────────

function sanitizeInput(input: string): string {
  let text = input
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}]/gu, '')
    // Remove brand references (common brand names that add noise)
    .replace(/\b(ssense|zara|aesop|apple|nike|gucci|prada|chanel|dior|balenciaga|celine)\b/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Strip jargon
  for (const word of JARGON_WORDS) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Strip hype
  for (const word of HYPE_WORDS) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Clean up extra spaces left by stripping
  text = text.replace(/\s+/g, ' ').trim();

  // Cap at 200 characters
  return text.slice(0, 200);
}

// ── Classification Helpers ────────────────────────────

function classifyByKeywords<T extends string>(
  words: string[],
  dictionary: Record<T, string[]>,
  fallback: T
): T {
  let bestMatch: T = fallback;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(dictionary) as [T, string[]][]) {
    const score = words.filter(w =>
      (keywords as string[]).some(k => w.includes(k) || k.includes(w))
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

function classifyMaterial(words: string[]): string {
  let bestMatch = 'none';
  let bestScore = 0;

  for (const [material, keywords] of Object.entries(MATERIAL_KEYWORDS)) {
    const score = words.filter(w => keywords.some(k => w.includes(k))).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = material;
    }
  }

  return bestMatch;
}

function classifyLightQuality(words: string[]): string {
  let bestMatch = 'soft diffused';
  let bestScore = 0;

  for (const [quality, keywords] of Object.entries(LIGHT_QUALITY_KEYWORDS)) {
    const score = words.filter(w => keywords.some(k => w.includes(k) || k.includes(w))).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = quality;
    }
  }

  return bestMatch;
}

// ── Default Interpretation ────────────────────────────

function getDefaultInterpretation(
  rawInput: string,
  selectedScenes: SceneType[]
): MoodInterpretation {
  // Smart defaults per scene type
  const hasEditorial = selectedScenes.includes('editorial');
  const hasStudio = selectedScenes.includes('studio');

  return {
    temperature: 'neutral',
    energy: 'calm',
    materialBias: hasEditorial ? 'concrete' : 'none',
    lightQuality: hasEditorial ? 'directional' : hasStudio ? 'bright even' : 'soft diffused',
    rawInput,
    wasOverridden: false,
    overrideNotes: [],
  };
}

// ── Main Interpretation Function ──────────────────────

export function interpretMood(
  rawInput: string,
  selectedScenes: SceneType[]
): MoodInterpretation {
  const sanitized = sanitizeInput(rawInput);

  // If input is empty or became empty after sanitization, use defaults
  if (!sanitized || sanitized.length < 2) {
    return getDefaultInterpretation(rawInput, selectedScenes);
  }

  const words = sanitized.split(/[\s,]+/).filter(w => w.length > 1);
  const overrideNotes: string[] = [];
  let wasOverridden = false;

  // ── Step 2: Extract intent ──
  let temperature = classifyByKeywords(words, TEMPERATURE_KEYWORDS, 'neutral');
  let energy = classifyByKeywords(words, ENERGY_KEYWORDS, 'moderate');
  let materialBias = classifyMaterial(words);
  let lightQuality = classifyLightQuality(words);

  // ── Step 3: Conflict resolution (scene rules override) ──

  // STUDIO: Forces neutral/calm, no materials, soft/even light
  if (selectedScenes.includes('studio')) {
    if (selectedScenes.length === 1) {
      // Pure studio — strict enforcement
      if (temperature !== 'neutral') {
        overrideNotes.push(`Studio: temperature "${temperature}" → "neutral"`);
        temperature = 'neutral';
        wasOverridden = true;
      }
      if (energy === 'vibrant') {
        overrideNotes.push(`Studio: energy "vibrant" → "moderate"`);
        energy = 'moderate';
        wasOverridden = true;
      }
      if (materialBias !== 'none') {
        overrideNotes.push(`Studio: material "${materialBias}" removed (no props)`);
        materialBias = 'none';
        wasOverridden = true;
      }
      if (lightQuality !== 'soft diffused' && lightQuality !== 'bright even') {
        overrideNotes.push(`Studio: light "${lightQuality}" → "bright even"`);
        lightQuality = 'bright even';
        wasOverridden = true;
      }
    }
  }

  // LIFESTYLE: No dramatic lighting, energy caps at moderate
  if (selectedScenes.includes('lifestyle')) {
    if (lightQuality === 'directional') {
      overrideNotes.push(`Lifestyle: directional light → "soft diffused"`);
      lightQuality = 'soft diffused';
      wasOverridden = true;
    }
  }

  // EDITORIAL: Default to directional light if not explicitly soft
  if (selectedScenes.includes('editorial')) {
    if (lightQuality === 'bright even') {
      lightQuality = 'directional';
      // Not flagged as override — editorial preference, not conflict
    }
    if (materialBias === 'none') {
      materialBias = 'concrete'; // Editorial defaults to architectural
    }
  }

  return {
    temperature,
    energy,
    materialBias,
    lightQuality,
    rawInput,
    wasOverridden,
    overrideNotes,
  };
}

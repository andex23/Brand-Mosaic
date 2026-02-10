/**
 * Scene Generation Service — Photo Studio
 *
 * STATE-OF-THE-ART PROFESSIONAL PRODUCT PHOTOGRAPHY ENGINE
 *
 * Architecture:
 *  - Locked professional base prompts do 90% of the work
 *  - User mood input is clamped to ≤10% influence (color temp, energy only)
 *  - Scene structure, lighting, camera, and composition are NON-NEGOTIABLE
 *  - Quality > creativity. Believable > interesting. Conservative > experimental.
 *
 * Providers:
 *  1. Gemini 3 Pro Image "Nano Banana Pro" (primary — best quality)
 *  2. Gemini 2.5 Flash Image "Nano Banana" (fast fallback)
 *  3. Pollinations.ai / Flux (free fallback — text-to-image, no API key)
 */

import { GoogleGenAI } from '@google/genai';
import type {
  SceneType,
  MoodInterpretation,
  SceneGenerationRequest,
  GeneratedScene,
} from '../types';

// ══════════════════════════════════════════════════════════
// SYSTEM DIRECTIVE — Senior Commercial Photographer
// ══════════════════════════════════════════════════════════

const SYSTEM_DIRECTIVE = `You are a senior commercial product photographer with 20 years of experience shooting for high-end e-commerce, catalogs, and editorial campaigns.

YOUR MANDATE:
- Produce REAL, physically plausible product photography
- Every image must look like it was shot with professional equipment in a controlled environment
- Slightly boring is acceptable. Unrealistic is NOT.
- If the result would not be accepted on a professional product page, it has FAILED.

ABSOLUTE PROHIBITIONS:
- NO AI-looking artifacts, exaggeration, or synthetic appearance
- NO cinematic effects, lens flares, god rays, or dramatic color grading
- NO hyperreal shine, artificial gloss, or plastic-looking surfaces
- NO stylized lighting, neon accents, or gradient backgrounds
- NO text, watermarks, logos, or branding overlays
- NO distortion, hallucination, or modification of the product
- NO multiple copies of the product
- NO people, faces, hands, or body parts

PRODUCT FIDELITY IS SACRED:
- The product in the reference image must appear EXACTLY as-is
- Same shape, proportions, materials, colors, textures, details
- Product is always the clear focal point, properly scaled
- Material rendering must be physically accurate (metal looks like metal, glass like glass, fabric like fabric)`;

// ══════════════════════════════════════════════════════════
// LOCKED SCENE BASE PROMPTS — Non-negotiable foundations
// ══════════════════════════════════════════════════════════

interface PromptPair {
  positive: string;
  negative: string;
}

/**
 * Clamp user mood influence to subtle adjustments only.
 * Returns a short modifier string that can be appended to the locked base.
 * This string will NEVER change scene structure, lighting design, or camera logic.
 */
function buildMoodModifier(interp: MoodInterpretation): string {
  const mods: string[] = [];

  // Temperature: only a subtle shift in color science
  if (interp.temperature === 'warm') {
    mods.push('very slightly warm color temperature');
  } else if (interp.temperature === 'cool') {
    mods.push('very slightly cool color temperature');
  }
  // neutral = no modifier needed

  // Energy: only adjusts tonal range subtly
  if (interp.energy === 'calm') {
    mods.push('muted, restrained tonal palette');
  } else if (interp.energy === 'vibrant') {
    mods.push('slightly richer color saturation, maintaining realism');
  }
  // moderate = no modifier needed

  return mods.length > 0 ? mods.join(', ') : '';
}

/**
 * Build a subtle material surface hint for lifestyle/editorial.
 * Returns empty string for studio (no props allowed).
 */
function buildMaterialHint(interp: MoodInterpretation, sceneType: SceneType): string {
  if (sceneType === 'studio') return ''; // studio = no surfaces, no props
  if (interp.materialBias === 'none') return '';

  const materialMap: Record<string, string> = {
    marble: 'polished marble or stone surface',
    wood: 'natural light wood surface',
    concrete: 'matte concrete surface',
    fabric: 'clean linen or cotton textile surface',
    metal: 'brushed metal surface',
    ceramic: 'ceramic surface',
  };

  return materialMap[interp.materialBias] || '';
}

// ── LOCKED BASE: STUDIO ──────────────────────────────────

function buildStudioPrompt(product: string, interp: MoodInterpretation): PromptPair {
  const moodMod = buildMoodModifier(interp);

  return {
    positive: [
      // NON-NEGOTIABLE BASE (does 90% of the work)
      `Professional commercial product photography of ${product}`,
      'shot in a professional photography studio',
      'neutral off-white seamless paper background with very subtle warm grey tone',
      'soft diffused studio lighting from two large softboxes at 45-degree angles',
      'gentle fill light from below to reduce harsh shadows',
      'physically realistic soft shadows on the background surface',
      'accurate material rendering with true-to-life surface textures',
      'neutral color science, no color cast',
      'product centered in frame filling approximately 60-65% of the composition',
      'straight-on camera angle with very slight 10-degree overhead elevation',
      'sharp focus throughout the entire product with high depth of field',
      'shot on medium format digital camera, f/8-f/11 aperture',
      'high-end e-commerce catalog quality, ready for product page',
      'completely realistic, no AI artifacts, no synthetic appearance',
      // Subtle mood modifier (≤10% influence)
      moodMod,
    ].filter(Boolean).join('. ') + '.',

    negative: [
      // Comprehensive block list
      'props', 'decoration', 'surface texture', 'table', 'shelf', 'floor visible',
      'environment', 'room', 'interior', 'lifestyle elements', 'context objects',
      'hands', 'people', 'faces', 'bodies', 'fingers', 'human presence',
      'text', 'watermark', 'logo', 'branding', 'label overlay', 'typography',
      'distorted product', 'hallucinated features', 'wrong proportions', 'multiple products',
      'blurry', 'soft focus', 'motion blur', 'out of focus areas',
      'low quality', 'low resolution', 'jpeg artifacts', 'noise', 'grain',
      'illustration', 'painting', 'drawing', 'cartoon', 'anime', 'sketch',
      'dramatic lighting', 'rim light', 'spotlight', 'harsh shadows', 'deep shadows',
      'lens flare', 'god rays', 'light leaks', 'bokeh', 'chromatic aberration',
      'cinematic', 'film grain', 'color grading', 'split toning', 'cross processing',
      'neon', 'gradients', 'color splash', 'HDR effect', 'over-saturated',
      'hyperreal', 'glossy', 'plastic appearance', 'synthetic look', 'AI artifacts',
      'vignette', 'fisheye', 'wide angle distortion', 'tilt shift',
      'reflections of studio equipment', 'visible light source',
    ].join(', '),
  };
}

// ── LOCKED BASE: LIFESTYLE ───────────────────────────────

function buildLifestylePrompt(product: string, interp: MoodInterpretation): PromptPair {
  const moodMod = buildMoodModifier(interp);
  const materialHint = buildMaterialHint(interp, 'lifestyle');
  const surface = materialHint || 'clean natural light wood or white surface';

  return {
    positive: [
      // NON-NEGOTIABLE BASE
      `Lifestyle product photography of ${product}`,
      'placed naturally in a realistic minimal interior setting',
      `product resting on ${surface}`,
      'uncluttered calm environment with only 1-2 very subtle contextual elements',
      'soft natural daylight from a window source, ambient fill',
      'no direct sunlight or harsh beams',
      'physically accurate shadows, soft and natural',
      'neutral to warm natural color palette',
      'product is the clear primary focal point in the composition',
      'off-center product placement with breathing room and negative space',
      'shallow but controlled depth of field, product entirely sharp',
      'background gently out of focus but recognizably real',
      'environment feels lived-in but deliberately styled',
      'shot on full-frame camera, natural perspective',
      'high-end brand lifestyle photography quality',
      'completely realistic, no AI artifacts',
      // Subtle mood modifier
      moodMod,
    ].filter(Boolean).join('. ') + '.',

    negative: [
      'people', 'faces', 'hands', 'bodies', 'fashion posing', 'human presence',
      'cluttered background', 'busy interior', 'decorative overload', 'maximalist',
      'too many props', 'obvious staging', 'fake plants', 'stock photo feel',
      'text', 'watermark', 'logo', 'brand name', 'label', 'typography',
      'distorted product', 'hallucinated features', 'multiple copies', 'wrong scale',
      'illustration', 'painting', 'cartoon', 'synthetic look', 'AI appearance',
      'dramatic shadows', 'cinematic flares', 'surreal effects', 'HDR',
      'over-saturated colors', 'neon lighting', 'colored lighting gels',
      'lens flare', 'god rays', 'bokeh balls', 'light leaks',
      'heavy color grading', 'film emulation', 'cross processing',
      'hyperreal textures', 'plastic surfaces', 'artificial gloss',
      'studio lighting visible', 'flash photography', 'harsh direct light',
      'blurry product', 'motion blur', 'low quality', 'jpeg artifacts',
    ].join(', '),
  };
}

// ── LOCKED BASE: EDITORIAL ───────────────────────────────

function buildEditorialPrompt(product: string, interp: MoodInterpretation): PromptPair {
  const moodMod = buildMoodModifier(interp);
  const materialHint = buildMaterialHint(interp, 'editorial');
  const backdrop = materialHint
    ? `architectural ${materialHint} backdrop`
    : 'sculptural matte concrete or natural stone architectural backdrop';

  return {
    positive: [
      // NON-NEGOTIABLE BASE
      `Editorial product photography of ${product}`,
      `${backdrop} with considered spatial composition`,
      'intentional directional lighting from a single controlled source',
      'physically plausible shadows with clear directionality',
      'shadow edges are soft-medium, never harsh or razor-sharp',
      'restrained neutral color palette with quiet visual authority',
      'asymmetric composition with generous negative space',
      'product positioned as a sculptural focal object within the frame',
      'architectural sense of scale and environment',
      'no commercial gloss, no trend-driven styling, no decoration',
      'disciplined visual language, every element has purpose',
      'shot on medium format camera with professional lens',
      'art-directed campaign-grade photography',
      'completely realistic, absolutely no AI artifacts',
      // Subtle mood modifier
      moodMod,
    ].filter(Boolean).join('. ') + '.',

    negative: [
      'people', 'faces', 'hands', 'bodies', 'human presence',
      'cluttered', 'busy background', 'visual noise', 'over-stylized', 'maximalist',
      'text', 'watermark', 'logo', 'brand name', 'typography overlay',
      'distorted product', 'hallucinated features', 'multiple products', 'wrong proportions',
      'flat lighting', 'even lighting', 'no shadows', 'shadowless',
      'snapshot quality', 'amateur photography', 'phone camera',
      'commercial gloss', 'product catalog feel', 'stock photo',
      'illustration', 'painting', 'cartoon', 'digital art', 'AI appearance',
      'cinematic flare', 'lens flare', 'god rays', 'light leaks',
      'neon', 'gradients', 'color splash', 'trendy aesthetic',
      'surrealism', 'fantasy', 'sci-fi', 'futuristic',
      'heavy color grading', 'cross processing', 'film emulation',
      'hyperreal', 'plastic surfaces', 'artificial shine',
      'bokeh', 'tilt shift', 'fisheye', 'wide angle distortion',
      'blurry', 'low quality', 'jpeg artifacts', 'noise',
    ].join(', '),
  };
}

// ── Prompt Builder Dispatch ──────────────────────────────

const PROMPT_BUILDERS: Record<SceneType, (product: string, interp: MoodInterpretation) => PromptPair> = {
  studio: buildStudioPrompt,
  lifestyle: buildLifestylePrompt,
  editorial: buildEditorialPrompt,
};

// ── Multi-Scene Consistency ──────────────────────────────

function buildConsistencyPrefix(): string {
  return [
    'MULTI-SCENE CONSISTENCY: This is part of a multi-scene product shoot.',
    'Product must appear identical across all scenes: same proportions, same materials, same colors.',
    'Maintain consistent product scale and detail rendering.',
  ].join(' ') + ' ';
}

// ══════════════════════════════════════════════════════════
// QUALITY VALIDATION — Pomelli-like multi-sample rejection
// ══════════════════════════════════════════════════════════

/**
 * Validate image quality by checking basic structural metrics.
 * Returns a quality score 0-100. Scores below QUALITY_THRESHOLD
 * trigger a regeneration attempt.
 *
 * This enforces conservative defaults:
 * - Reject images that are too small (likely failed generation)
 * - Reject images that are suspiciously uniform (blank/solid)
 * - Accept everything else — the locked prompts do the heavy lifting
 */
const QUALITY_THRESHOLD = 30; // Low bar — prompt quality does the real work
const MAX_RETRIES = 2; // Max generation attempts per scene per model

function validateImageQuality(base64: string): { score: number; reason: string } {
  // Check data size — a real image should be at least ~10KB of base64
  const rawData = base64.replace(/^data:image\/\w+;base64,/, '');
  const sizeKB = Math.round((rawData.length * 3) / 4 / 1024);

  if (sizeKB < 5) {
    return { score: 0, reason: 'Image too small (likely failed generation)' };
  }
  if (sizeKB < 15) {
    return { score: 20, reason: 'Image suspiciously small' };
  }

  // Check for data URL validity
  if (!base64.startsWith('data:image/')) {
    return { score: 0, reason: 'Invalid image data format' };
  }

  // Passed basic checks — trust the locked prompts
  // Score based on size (larger = more detail = likely better)
  const sizeScore = Math.min(100, Math.round(sizeKB / 5));
  return { score: Math.max(40, sizeScore), reason: 'OK' };
}

// ══════════════════════════════════════════════════════════
// GEMINI GENERATION — Model cascade with quality validation
// ══════════════════════════════════════════════════════════

async function generateSceneWithGemini(
  productImageBase64: string,
  prompt: PromptPair,
  apiKey: string,
  sceneType: SceneType,
  additionalImages?: string[],
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const rawBase64 = productImageBase64.replace(/^data:image\/\w+;base64,/, '');

  const multiAngleNote = additionalImages && additionalImages.length > 0
    ? `\n\nADDITIONAL REFERENCE ANGLES: ${additionalImages.length} additional view(s) of the same product are provided. Use them to understand the product's complete 3D form, materials, and construction details. The first image is the primary view.`
    : '';

  const contentParts: any[] = [
    {
      text: `${SYSTEM_DIRECTIVE}

SCENE TYPE: ${sceneType.toUpperCase()}

SCENE SPECIFICATION:
${prompt.positive}
${multiAngleNote}

ABSOLUTE EXCLUSIONS (must not appear in the generated image):
${prompt.negative}

QUALITY MANDATE:
- Generate a single photograph that looks like a real photograph taken by a professional photographer
- If it looks like AI-generated art, it has FAILED
- Product must be identical to the reference image
- Lighting must be physically plausible
- No synthetic appearance, no artificial gloss, no hyperreal textures
- Conservative, disciplined, professional output ONLY`,
    },
    {
      inlineData: {
        mimeType: 'image/png',
        data: rawBase64,
      },
    },
  ];

  if (additionalImages && additionalImages.length > 0) {
    for (const img of additionalImages) {
      const raw = img.replace(/^data:image\/\w+;base64,/, '');
      contentParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: raw,
        },
      });
    }
  }

  // Model cascade: best quality → fast → legacy
  const modelsToTry = [
    'gemini-3-pro-image-preview',
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-exp',
  ];
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    // Multi-sample: try up to MAX_RETRIES per model, pick best
    let bestImage: string | null = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`[SceneGen] Model: ${modelName}, attempt ${attempt + 1}/${MAX_RETRIES}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contentParts,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          } as any,
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if ((part as any).inlineData?.mimeType?.startsWith('image/')) {
              const inlineData = (part as any).inlineData;
              const imageData = `data:${inlineData.mimeType};base64,${inlineData.data}`;

              // Quality validation
              const quality = validateImageQuality(imageData);
              console.log(`[SceneGen] Quality score: ${quality.score} (${quality.reason})`);

              if (quality.score > bestScore) {
                bestScore = quality.score;
                bestImage = imageData;
              }

              // If quality is good enough, accept immediately (no need for more samples)
              if (quality.score >= 60) {
                console.log(`[SceneGen] ✓ Accepted via ${modelName} (score: ${quality.score})`);
                return imageData;
              }
            }
          }
        }

        if (!bestImage) {
          lastError = new Error(`${modelName} returned no image in response`);
        }
      } catch (err: any) {
        console.warn(`[SceneGen] ${modelName} attempt ${attempt + 1} failed:`, err.message || err);
        lastError = err;
        break; // Don't retry this model if it errors — cascade to next
      }
    }

    // If we got an image but it was below threshold, still return it
    // (better than nothing — the prompts enforce quality)
    if (bestImage && bestScore >= QUALITY_THRESHOLD) {
      console.log(`[SceneGen] ✓ Best sample from ${modelName} (score: ${bestScore})`);
      return bestImage;
    }

    // If we got an image but it was REALLY bad, try next model
    if (bestImage && bestScore < QUALITY_THRESHOLD) {
      console.warn(`[SceneGen] Rejecting ${modelName} output (score: ${bestScore}), trying next model`);
      lastError = new Error(`${modelName} output quality too low (score: ${bestScore})`);
    }
  }

  throw lastError || new Error('Gemini did not return an acceptable image');
}

// ══════════════════════════════════════════════════════════
// POLLINATIONS FALLBACK — Free, no API key
// ══════════════════════════════════════════════════════════

async function generateSceneWithPollinations(
  prompt: PromptPair,
  productName: string,
): Promise<string> {
  console.log('[SceneGen] Trying Pollinations.ai (free fallback)...');

  const fullPrompt = [
    prompt.positive,
    `The product "${productName}" must be the clear focal point.`,
    'Real photograph, not AI art. Professional commercial photography. No text overlays.',
  ].join('. ');

  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model: 'flux',
    nologo: 'true',
    enhance: 'true',
  });

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`;
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) });

  if (!response.ok) {
    throw new Error(`Pollinations API error: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  console.log('[SceneGen] ✓ Pollinations fallback generated');
  return base64;
}

// ══════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ══════════════════════════════════════════════════════════

export async function generateScenes(
  request: SceneGenerationRequest,
  apiKey: string,
  onProgress?: (current: number, total: number, sceneType: SceneType) => void,
): Promise<GeneratedScene[]> {
  const results: GeneratedScene[] = [];
  const total = request.scenes.length;
  const multiScene = total > 1;
  const consistencyPrefix = multiScene ? buildConsistencyPrefix() : '';

  for (let i = 0; i < request.scenes.length; i++) {
    const sceneType = request.scenes[i];
    onProgress?.(i + 1, total, sceneType);

    // Build locked professional prompt
    const builder = PROMPT_BUILDERS[sceneType];
    const rawPrompt = builder(request.product.productName, request.interpretation);

    const prompt: PromptPair = {
      positive: consistencyPrefix + rawPrompt.positive,
      negative: rawPrompt.negative,
    };

    // Inject business context as SUBTLE brand tone guidance only
    // This must NEVER override scene structure, lighting, or composition
    if (request.businessContext) {
      const bc = request.businessContext;
      const contextParts: string[] = [];
      if (bc.businessName) contextParts.push(`Brand: ${bc.businessName}`);
      if (bc.businessDescription) contextParts.push(`About: ${bc.businessDescription}`);
      if (bc.brandTone) contextParts.push(`Brand tone: ${bc.brandTone}`);
      if (contextParts.length > 0) {
        prompt.positive += `\n\nBRAND CONTEXT (use only as subtle tonal guidance — do NOT change lighting, composition, or scene structure): ${contextParts.join('. ')}.`;
      }
    }

    if (request.brandContext?.colorPalette?.length) {
      prompt.positive += ` Very subtle color palette influence: ${request.brandContext.colorPalette.join(', ')}.`;
    }

    let imageBase64: string;
    let provider: 'gemini' | 'replicate' | 'pollinations';

    // Primary: Gemini (Nano Banana Pro cascade)
    try {
      imageBase64 = await generateSceneWithGemini(
        request.product.imageBase64,
        prompt,
        apiKey,
        sceneType,
        request.product.additionalImages,
      );
      provider = 'gemini';
    } catch (geminiError: any) {
      console.warn(`[SceneGen] Gemini failed for ${sceneType}:`, geminiError?.message || geminiError);

      // Fallback: Pollinations.ai (free, no API key)
      try {
        imageBase64 = await generateSceneWithPollinations(prompt, request.product.productName);
        provider = 'pollinations';
      } catch (pollinationsError: any) {
        console.error(`[SceneGen] All providers failed for ${sceneType}`);

        const geminiMsg = geminiError?.message || 'Unknown error';
        const pollMsg = pollinationsError?.message || 'Unknown error';
        let helpText = `Failed to generate ${sceneType} scene.\n`;

        if (geminiMsg.includes('API key') || geminiMsg.includes('401') || geminiMsg.includes('403')) {
          helpText += 'Your Gemini API key may be invalid or lack image generation access. Ensure it supports Gemini 3 Pro Image or Gemini 2.5 Flash Image.';
        } else if (geminiMsg.includes('quota') || geminiMsg.includes('429')) {
          helpText += 'Gemini rate limit reached. Wait a moment and try again.';
        } else {
          helpText += `Gemini: ${geminiMsg}. Pollinations: ${pollMsg}`;
        }

        throw new Error(helpText);
      }
    }

    results.push({
      sceneType,
      imageBase64,
      promptUsed: prompt.positive,
      generatedAt: Date.now(),
      provider,
    });
  }

  return results;
}

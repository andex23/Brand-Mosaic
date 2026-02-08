/**
 * Scene Generation Service — Photo Studio
 *
 * Generates product photography scenes using:
 *  1. Gemini 3 Pro Image "Nano Banana Pro" (primary — best quality)
 *  2. Gemini 2.5 Flash Image "Nano Banana" (fast fallback)
 *  3. Pollinations.ai / Flux (free fallback — text-to-image, no API key)
 *
 * This service constructs prompts from scene rules + mood interpretation,
 * enforces product fidelity, and maintains multi-scene consistency.
 */

import { GoogleGenAI } from '@google/genai';
import type {
  SceneType,
  MoodInterpretation,
  SceneGenerationRequest,
  GeneratedScene,
} from '../types';

// ── Scene Prompt Templates ────────────────────────────

interface PromptPair {
  positive: string;
  negative: string;
}

type PromptBuilder = (product: string, interp: MoodInterpretation) => PromptPair;

const PROMPT_TEMPLATES: Record<SceneType, PromptBuilder> = {

  studio: (product, interp) => ({
    positive: [
      `Professional product photography of ${product}`,
      `centered on seamless ${interp.temperature === 'warm' ? 'warm off-white' : interp.temperature === 'cool' ? 'cool light gray' : 'pure white'} infinity curve background`,
      `soft even studio lighting with diffused softboxes, no harsh shadows`,
      `product fills 65% of frame, straight-on angle with slight 15-degree elevation`,
      `commercial catalog photography, sharp focus on product details`,
      `color-accurate, physically plausible lighting`,
      `product is completely realistic and unmodified`,
    ].join(', '),
    negative: [
      'props', 'decoration', 'surface', 'table', 'shelf', 'lifestyle elements',
      'hands', 'people', 'faces', 'bodies', 'text', 'watermark', 'logo',
      'distorted product', 'hallucinated features', 'multiple products',
      'blurry', 'low quality', 'illustration', 'painting', 'cartoon',
      'dramatic lighting', 'rim light', 'spotlight', 'lens flare',
    ].join(', '),
  }),

  lifestyle: (product, interp) => ({
    positive: [
      `Lifestyle product photography of ${product}`,
      `placed naturally in a realistic minimal interior setting`,
      interp.materialBias !== 'none'
        ? `${interp.materialBias} surface or accent material`
        : 'clean natural surface, light wood or linen',
      `${interp.temperature} color temperature throughout`,
      `natural window light with soft ambient fill, ${interp.lightQuality}`,
      `off-center composition with breathing room, product is the clear focal point`,
      interp.energy === 'calm'
        ? 'muted tones, quiet serene atmosphere'
        : interp.energy === 'vibrant'
        ? 'rich natural colors, warm inviting atmosphere'
        : 'balanced natural tones, approachable feel',
      `minimal contextual styling that supports without competing`,
      `aspirational lifestyle photography, high resolution, realistic`,
      `product is completely realistic and unmodified`,
    ].join(', '),
    negative: [
      'people', 'faces', 'hands', 'bodies', 'fashion posing',
      'cluttered background', 'busy interior', 'decorative overload',
      'text', 'watermark', 'logo', 'brand name',
      'distorted product', 'hallucinated features', 'multiple copies',
      'illustration', 'painting', 'cartoon', 'synthetic look',
      'dramatic shadows', 'cinematic flares', 'surreal effects',
    ].join(', '),
  }),

  editorial: (product, interp) => ({
    positive: [
      `Editorial product photography of ${product}`,
      interp.materialBias !== 'none'
        ? `architectural ${interp.materialBias} backdrop, sculptural environment`
        : 'sculptural concrete or stone architectural backdrop',
      `${interp.lightQuality} lighting with intentional shadow play`,
      `${interp.temperature} color temperature`,
      interp.energy === 'calm'
        ? 'subdued restrained palette, quiet authority'
        : interp.energy === 'vibrant'
        ? 'considered tonal contrast, visual tension'
        : 'controlled palette, deliberate composition',
      `asymmetric composition with generous negative space`,
      `art-directed campaign-grade photography`,
      `product positioned as sculptural focal object`,
      `restrained, no commercial gloss, no trend-driven exaggeration`,
      `product is completely realistic and unmodified, sharp detail`,
    ].join(', '),
    negative: [
      'people', 'faces', 'hands', 'bodies',
      'cluttered', 'busy background', 'visual noise', 'over-stylized',
      'text', 'watermark', 'logo', 'brand name',
      'distorted product', 'hallucinated features', 'multiple products',
      'flat lighting', 'snapshot quality', 'commercial gloss',
      'illustration', 'painting', 'cartoon', 'cinematic flare', 'lens flare',
      'trendy aesthetic', 'neon', 'gradients',
    ].join(', '),
  }),
};

// ── Multi-Scene Consistency ───────────────────────────

function buildConsistencyPrefix(interp: MoodInterpretation): string {
  return [
    'Consistent product rendering across all images',
    'Same product scale, proportions, and material appearance',
    `Unified color temperature: ${interp.temperature}`,
    'Product details must be identical in every scene',
  ].join('. ') + '. ';
}

// ── Gemini Generation ─────────────────────────────────

async function generateSceneWithGemini(
  productImageBase64: string,
  prompt: PromptPair,
  apiKey: string,
  additionalImages?: string[],
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Strip the data URL prefix to get raw base64
  const rawBase64 = productImageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Build content parts: text instruction + product image(s)
  const multiAngleNote = additionalImages && additionalImages.length > 0
    ? `\nREFERENCE IMAGES: The first image is the primary product view. The ${additionalImages.length} additional image(s) show different angles of the same product — use them to understand the product's full 3D form, materials, and details.`
    : '';

  const contentParts: any[] = [
    {
      text: `You are an expert product photographer. Generate a single high-quality product photography scene.

SCENE DESCRIPTION: ${prompt.positive}
${multiAngleNote}
CRITICAL RULES:
- The product in the reference image must appear EXACTLY as-is in the generated scene
- Do NOT modify, hallucinate, or distort any product features
- The product MUST be the clear focal point
- Do NOT add text, watermarks, or logos
- Lighting must be physically plausible
- Color accuracy over dramatization

AVOID: ${prompt.negative}

Generate the scene photograph now.`,
    },
    {
      inlineData: {
        mimeType: 'image/png',
        data: rawBase64,
      },
    },
  ];

  // Add additional angle images
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

  // Try models in order:
  // 1. gemini-3-pro-image-preview (Nano Banana Pro — best quality)
  // 2. gemini-2.5-flash-image (Nano Banana — fast, stable)
  // 3. gemini-2.0-flash-exp (legacy fallback)
  const modelsToTry = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image', 'gemini-2.0-flash-exp'];
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[SceneGen] Trying model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentParts,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        } as any,
      });

      // Extract image from response
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if ((part as any).inlineData?.mimeType?.startsWith('image/')) {
            const inlineData = (part as any).inlineData;
            console.log(`[SceneGen] Got image from ${modelName}`);
            return `data:${inlineData.mimeType};base64,${inlineData.data}`;
          }
        }
      }
      lastError = new Error(`${modelName} returned no image in response`);
    } catch (err: any) {
      console.warn(`[SceneGen] ${modelName} failed:`, err.message || err);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('Gemini did not return an image in the response');
}

// ── Pollinations.ai Fallback (Free) ──────────────────

/**
 * Pollinations.ai — Free, no API key required.
 * Generates images from text prompts via a simple URL endpoint.
 * Uses Flux model for high-quality results.
 * Note: This is text-to-image only (no image input), so we include
 * detailed product description in the prompt.
 */
async function generateSceneWithPollinations(
  prompt: PromptPair,
  productName: string,
): Promise<string> {
  console.log('[SceneGen] Trying Pollinations.ai (free, no API key)...');

  // Build a detailed prompt since we can't send the product image
  const fullPrompt = [
    prompt.positive,
    `The product "${productName}" must be the clear focal point.`,
    'Professional commercial photography, 8K, sharp focus, photorealistic.',
  ].join('. ');

  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model: 'flux',
    nologo: 'true',
    enhance: 'true',
  });

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`;

  // Fetch the image and convert to base64
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

  console.log('[SceneGen] Pollinations scene generated successfully');
  return base64;
}

// ── Main Orchestrator ─────────────────────────────────

export async function generateScenes(
  request: SceneGenerationRequest,
  apiKey: string,
  onProgress?: (current: number, total: number, sceneType: SceneType) => void,
): Promise<GeneratedScene[]> {
  const results: GeneratedScene[] = [];
  const total = request.scenes.length;
  const multiScene = total > 1;
  const consistencyPrefix = multiScene
    ? buildConsistencyPrefix(request.interpretation)
    : '';

  for (let i = 0; i < request.scenes.length; i++) {
    const sceneType = request.scenes[i];
    onProgress?.(i + 1, total, sceneType);

    // Build prompt from template + interpretation
    const template = PROMPT_TEMPLATES[sceneType];
    const rawPrompt = template(request.product.productName, request.interpretation);

    const prompt: PromptPair = {
      positive: consistencyPrefix + rawPrompt.positive,
      negative: rawPrompt.negative,
    };

    // Inject business context if provided
    if (request.businessContext) {
      const bc = request.businessContext;
      const contextParts: string[] = [];
      if (bc.businessName) contextParts.push(`Brand: ${bc.businessName}`);
      if (bc.businessDescription) contextParts.push(`Business: ${bc.businessDescription}`);
      if (bc.targetAudience) contextParts.push(`Target audience: ${bc.targetAudience}`);
      if (bc.productPurpose) contextParts.push(`Product purpose: ${bc.productPurpose}`);
      if (bc.brandTone) contextParts.push(`Brand tone: ${bc.brandTone}`);
      if (contextParts.length > 0) {
        prompt.positive += `\n\nBUSINESS CONTEXT (use this to guide the overall feel, setting, and styling of the scene):\n${contextParts.join('. ')}.`;
      }
    }

    // Optionally inject brand color context
    if (request.brandContext?.colorPalette?.length) {
      prompt.positive += `, scene tonality inspired by palette: ${request.brandContext.colorPalette.join(', ')}`;
    }

    let imageBase64: string;
    let provider: 'gemini' | 'replicate' | 'pollinations';

    // Try Gemini first (Nano Banana — gemini-2.5-flash-image), fallback to Pollinations (free)
    try {
      imageBase64 = await generateSceneWithGemini(
        request.product.imageBase64,
        prompt,
        apiKey,
        request.product.additionalImages,
      );
      provider = 'gemini';
    } catch (geminiError: any) {
      console.warn(`[SceneGen] Gemini failed for ${sceneType} scene:`, geminiError?.message || geminiError);

      // Try Pollinations.ai as free fallback (no API key needed)
      try {
        imageBase64 = await generateSceneWithPollinations(
          prompt,
          request.product.productName,
        );
        provider = 'pollinations';
      } catch (pollinationsError: any) {
        console.error(`[SceneGen] Pollinations also failed for ${sceneType} scene:`, pollinationsError?.message || pollinationsError);

        // Build a helpful error message
        const geminiMsg = geminiError?.message || 'Unknown error';
        const pollMsg = pollinationsError?.message || 'Unknown error';
        let helpText = `Failed to generate ${sceneType} scene.\n`;

        if (geminiMsg.includes('API key') || geminiMsg.includes('401') || geminiMsg.includes('403')) {
          helpText += 'Your Gemini API key may be invalid or missing image generation permissions. ';
          helpText += 'Make sure your key supports the Gemini 2.5 Flash Image (Nano Banana) model.';
        } else if (geminiMsg.includes('quota') || geminiMsg.includes('429')) {
          helpText += 'Gemini API rate limit reached. Please wait a moment and try again.';
        } else {
          helpText += `Gemini: ${geminiMsg}. Pollinations fallback: ${pollMsg}`;
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

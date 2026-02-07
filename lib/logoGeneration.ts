/**
 * Logo Generation Service
 * Uses Google Imagen API (or fallback to DALL-E/Stable Diffusion)
 */

export interface LogoGenerationOptions {
  prompt: string;
  style?: 'minimalist' | 'modern' | 'classic' | 'abstract';
  aspectRatio?: 'square' | 'wide' | 'tall';
  colorPalette?: string[];
  apiKey?: string;
}

export interface LogoGenerationResult {
  imageUrl?: string;
  base64Data?: string;
  error?: string;
}

/**
 * Enhance the logo prompt with style and color guidelines
 */
const enhanceLogoPrompt = (
  basePrompt: string,
  options: LogoGenerationOptions
): string => {
  const { style = 'minimalist', colorPalette = [] } = options;

  // Build a comprehensive logo generation prompt
  const styleGuidelines: Record<string, string> = {
    minimalist: 'minimalist, clean lines, simple geometric shapes, modern, elegant, professional',
    modern: 'contemporary, bold, striking, tech-forward, sleek, innovative',
    classic: 'timeless, traditional, refined, elegant, professional, sophisticated',
    abstract: 'creative, unique, conceptual, artistic, symbolic, expressive',
  };

  let enhancedPrompt = `Professional logo design: ${basePrompt}`;
  enhancedPrompt += `. Style: ${styleGuidelines[style]}`;

  // Add color palette if provided
  if (colorPalette.length > 0) {
    enhancedPrompt += ` Colors: ${colorPalette.slice(0, 3).join(', ')}`;
  }

  // Add technical requirements for logo quality
  enhancedPrompt += `. High quality, vector-style, high contrast, scalable, professional branding, suitable for print and digital use`;
  enhancedPrompt += `. Clean background, centered composition, logo mark design`;

  return enhancedPrompt;
};

/**
 * Generate a logo using Hugging Face Stable Diffusion API
 * Free tier available, no API key required for basic usage
 */
export const generateLogoWithStableDiffusion = async (
  options: LogoGenerationOptions
): Promise<LogoGenerationResult> => {
  try {
    const enhancedPrompt = enhanceLogoPrompt(options.prompt, options);
    
    // Use Hugging Face Inference API (free tier)
    // Model: runwayml/stable-diffusion-v1-5 (good for logos)
    const model = 'runwayml/stable-diffusion-v1-5';
    
    // Use the enhanced prompt directly (already optimized)
    const logoPrompt = enhancedPrompt;
    
    // Determine image dimensions based on aspect ratio
    const dimensions: Record<string, { width: number; height: number }> = {
      square: { width: 512, height: 512 },
      wide: { width: 768, height: 512 },
      tall: { width: 512, height: 768 },
    };
    
    const { width, height } = dimensions[options.aspectRatio || 'square'];
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Optional: Add HF API token if you have one (for faster inference)
          // 'Authorization': `Bearer ${import.meta.env.VITE_HF_API_KEY || ''}`,
        },
        body: JSON.stringify({
          inputs: logoPrompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width,
            height,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Logo generation failed: ${response.statusText}`;
      
      // Hugging Face may return 503 if model is loading (cold start)
      if (response.status === 503) {
        errorMessage = 'Image generation service is starting up. This may take 10-20 seconds on first use. Please wait and try again.';
      } else if (response.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status === 401) {
        errorMessage = 'API authentication failed. Please check your configuration.';
      }
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage += ` ${errorJson.error}`;
        }
      } catch {
        // Not JSON, use text as-is
        if (errorText) {
          errorMessage += ` ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Hugging Face returns image as blob
    const imageBlob = await response.blob();
    
    // Convert blob to base64 data URL for persistence
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
    
    const imageUrl = await base64Promise;
    
    return {
      imageUrl,
      base64Data: imageUrl.split(',')[1], // Extract base64 part
    };
  } catch (error: any) {
    console.error('Stable Diffusion API error:', error);
    throw error;
  }
};

/**
 * Generate a logo using Replicate API (alternative, requires API key)
 * More reliable but requires setup
 */
export const generateLogoWithReplicate = async (
  options: LogoGenerationOptions
): Promise<LogoGenerationResult> => {
  const replicateApiKey = import.meta.env.VITE_REPLICATE_API_KEY;
  
  if (!replicateApiKey) {
    throw new Error('Replicate API key not configured. Using fallback method.');
  }

  try {
    const enhancedPrompt = enhanceLogoPrompt(options.prompt, options);
    
    // Use Replicate's Stable Diffusion model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${replicateApiKey}`,
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ada041de4542944704e90c14c81d89e4a47', // Stable Diffusion v1.5
        input: {
          prompt: enhancedPrompt,
          width: options.aspectRatio === 'wide' ? 768 : options.aspectRatio === 'tall' ? 512 : 512,
          height: options.aspectRatio === 'tall' ? 768 : options.aspectRatio === 'wide' ? 512 : 512,
          num_outputs: 1,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Poll for completion
    let prediction = data;
    while (prediction.status === 'starting' || prediction.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
        },
      });
      prediction = await statusResponse.json();
    }

    if (prediction.status === 'succeeded' && prediction.output?.[0]) {
      return {
        imageUrl: prediction.output[0],
      };
    }

    throw new Error('Logo generation failed');
  } catch (error: any) {
    console.error('Replicate API error:', error);
    throw error;
  }
};

/**
 * Main logo generation function
 * Tries multiple services in order of preference
 */
export const generateLogo = async (
  options: LogoGenerationOptions
): Promise<LogoGenerationResult> => {
  console.log('Generating logo with prompt:', options.prompt);
  
  // Get API key from options or environment
  const apiKey = options.apiKey || 
    (typeof window !== 'undefined' && localStorage.getItem('user_gemini_api_key')) ||
    import.meta.env.VITE_GEMINI_API_KEY;
  
  // Try Replicate first if API key is available
  if (import.meta.env.VITE_REPLICATE_API_KEY) {
    try {
      console.log('Attempting logo generation with Replicate...');
      return await generateLogoWithReplicate(options);
    } catch (error: any) {
      console.warn('Replicate failed, trying Hugging Face...', error.message);
    }
  }
  
  // Fallback to Hugging Face (free tier, no API key required)
  try {
    console.log('Attempting logo generation with Hugging Face Stable Diffusion...');
    return await generateLogoWithStableDiffusion(options);
  } catch (error: any) {
    console.error('Hugging Face failed:', error);
    
    // If both fail, provide a helpful error message
    throw new Error(
      `Logo generation failed: ${error.message}. ` +
      `Please ensure you have internet connection and try again. ` +
      `For better results, configure VITE_REPLICATE_API_KEY in your environment.`
    );
  }
};

/**
 * Upload logo to Supabase Storage
 */
export const uploadLogoToStorage = async (
  base64Data: string,
  projectId: string
): Promise<string> => {
  // This would upload to Supabase Storage
  // For now, return the base64 data URL
  return `data:image/png;base64,${base64Data}`;
};


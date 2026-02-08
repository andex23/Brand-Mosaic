export interface BrandFormData {
  brandName: string;
  offering: string;
  purpose: string;
  problem: string;
  tone: string[];
  feeling: string;
  adjectives: string;
  palette: string;
  customPalette?: string;
  customColor1?: string;
  customColor2?: string;
  vibe: string[];
  customVibe?: string;
  moodBoardKeywords: string;
  typography: string;
  customFont?: string;
  audience: string[];
  customerCare: string;
  differentiation: string;
  competitors: string;
  tagline: string;
  logoExists: string;
  logoPreference: string;
  logoFileName?: string;
  fashion: string;
  soundtrack: string;
  inspiration: string;
}

export interface BrandKit {
  brandEssence: string;
  summaryParagraph: string;
  keywords: string[];
  toneOfVoice: string[];
  targetAudienceSummary: string;
  visualDirection: string;
  brandArchetype: {
    name: string;
    explanation: string;
  };
  suggestedTagline: string;
  colorPaletteSuggestions: {
    name: string;
    hex: string;
    usage: string;
  }[];
  fontPairing: {
    headlineFont: string;
    bodyFont: string;
    note: string;
  };
  logoPrompt: string;
}

// Kit section identifiers for lock/regenerate feature
export type KitSectionId = 'brandEssence' | 'summaryParagraph' | 'keywords' | 'toneOfVoice' | 
  'brandArchetype' | 'suggestedTagline' | 'colorPaletteSuggestions' | 'fontPairing' | 'logoPrompt';

// Lock state for kit sections
export type BrandKitLocks = Partial<Record<KitSectionId, boolean>>;

export interface BrandProject {
  id: string;
  name: string;
  createdAt: number;
  formData: BrandFormData;
  brandKit?: BrandKit;
  kitLocks?: BrandKitLocks;
}

// ============================================
// PHOTO STUDIO — Visual Scene Generator Types
// ============================================

export type SceneType = 'studio' | 'lifestyle' | 'editorial';

export interface SceneConfig {
  type: SceneType;
  label: string;
  description: string;
  useCase: string;
  rules: {
    backgroundStyle: string;
    lightingStyle: string;
    compositionStyle: string;
    propsPolicy: 'none' | 'minimal-contextual' | 'architectural-only';
    negativePromptAdditions: string[];
  };
}

export interface MoodInterpretation {
  temperature: 'warm' | 'neutral' | 'cool';
  energy: 'calm' | 'moderate' | 'vibrant';
  materialBias: string;
  lightQuality: string;
  rawInput: string;
  wasOverridden: boolean;
  overrideNotes: string[];
}

export interface ProductInputData {
  imageBase64: string;
  /** Additional product images (different angles/views) */
  additionalImages?: string[];
  productName: string;
  sourceType: 'url' | 'upload';
  sourceUrl?: string;
  metadata?: {
    description?: string;
    price?: string;
    brand?: string;
  };
}

export interface BusinessContextData {
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  productPurpose: string;
  brandTone: string;
}

export interface SceneGenerationRequest {
  product: ProductInputData;
  scenes: SceneType[];
  moodText: string;
  interpretation: MoodInterpretation;
  businessContext?: BusinessContextData;
  brandContext?: {
    colorPalette?: string[];
    brandName?: string;
    visualDirection?: string;
  };
}

export interface GeneratedScene {
  sceneType: SceneType;
  imageBase64: string;
  promptUsed: string;
  generatedAt: number;
  provider: 'gemini' | 'replicate' | 'pollinations';
}
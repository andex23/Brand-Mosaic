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

export interface BrandProject {
  id: string;
  name: string;
  createdAt: number;
  formData: BrandFormData;
  brandKit?: BrandKit;
}
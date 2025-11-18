export interface BrandFormData {
  brandName: string;
  offering: string;
  purpose: string;
  problem: string;
  tone: string[];     // Changed to array
  feeling: string;
  adjectives: string;
  palette: string;
  customPalette?: string;
  customColor1?: string;
  customColor2?: string;
  vibe: string[];     // Changed to array
  customVibe?: string;
  typography: string;
  customFont?: string;
  audience: string[]; // Changed to array
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
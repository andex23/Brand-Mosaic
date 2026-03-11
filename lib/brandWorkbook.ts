import type { BrandFormData } from '../types.ts';

export type BrandFormKey = keyof BrandFormData;

const PROJECT_PROGRESS_KEYS: BrandFormKey[] = [
  'brandName',
  'offering',
  'purpose',
  'problem',
  'audience',
  'customerCare',
  'tone',
  'feeling',
  'adjectives',
  'palette',
  'vibe',
  'moodBoardKeywords',
  'typography',
  'differentiation',
  'competitors',
  'tagline',
  'logoExists',
  'logoPreference',
  'fashion',
  'soundtrack',
  'inspiration',
];

export interface QuestionnaireAnswerUpsert {
  project_id: string;
  section_key: string;
  question_key: string;
  answer: BrandFormData[BrandFormKey];
}

export const defaultBrandFormData: BrandFormData = {
  brandName: '',
  offering: '',
  purpose: '',
  problem: '',
  tone: [],
  feeling: '',
  adjectives: '',
  palette: '',
  customPalette: '',
  customColor1: '#000000',
  customColor2: '#ffffff',
  vibe: [],
  customVibe: '',
  moodBoardKeywords: '',
  typography: '',
  customFont: '',
  audience: [],
  customerCare: '',
  differentiation: '',
  competitors: '',
  tagline: '',
  logoExists: '',
  logoPreference: '',
  logoFileName: '',
  fashion: '',
  soundtrack: '',
  inspiration: '',
};

export const QUESTION_SECTION_MAP: Record<BrandFormKey, string> = {
  brandName: 'brand_basics',
  offering: 'brand_basics',
  purpose: 'brand_purpose',
  problem: 'brand_purpose',
  audience: 'audience',
  customerCare: 'audience',
  tone: 'personality',
  feeling: 'personality',
  adjectives: 'personality',
  palette: 'visual_direction',
  customPalette: 'visual_direction',
  customColor1: 'visual_direction',
  customColor2: 'visual_direction',
  vibe: 'visual_direction',
  customVibe: 'visual_direction',
  moodBoardKeywords: 'visual_direction',
  typography: 'visual_direction',
  customFont: 'visual_direction',
  fashion: 'visual_direction',
  soundtrack: 'visual_direction',
  inspiration: 'visual_direction',
  differentiation: 'differentiation',
  competitors: 'differentiation',
  tagline: 'differentiation',
  logoExists: 'differentiation',
  logoPreference: 'differentiation',
  logoFileName: 'differentiation',
};

const isMeaningfulAnswer = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => String(item || '').trim().length > 0);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => isMeaningfulAnswer(item));
  }

  return value !== null && value !== undefined;
};

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const getProjectBrandName = (formData: BrandFormData) => {
  const directName = formData.brandName.trim();
  if (directName) return directName;

  const offeringLead = formData.offering.trim();
  if (offeringLead) {
    return `${toTitleCase(offeringLead)} Workbook`;
  }

  return 'New Brand Workbook';
};

export const getWorkbookProgress = (formData: BrandFormData) => {
  const answeredCount = PROJECT_PROGRESS_KEYS.reduce(
    (count, key) => count + (isMeaningfulAnswer(formData[key]) ? 1 : 0),
    0
  );
  const totalPromptCount = PROJECT_PROGRESS_KEYS.length;
  const completionPercent = Math.round((answeredCount / totalPromptCount) * 100);

  return {
    answeredCount,
    totalPromptCount,
    completionPercent,
  };
};

export const answersToFormData = (
  rows: Array<{ question_key: string; answer: unknown }>
): BrandFormData => {
  const formData: BrandFormData = { ...defaultBrandFormData };

  rows.forEach((row) => {
    const key = row.question_key as BrandFormKey;
    if (!(key in formData)) return;

    (formData as Record<string, unknown>)[key] = row.answer;
  });

  return formData;
};

export const formDataToAnswerRows = (
  projectId: string,
  formData: BrandFormData
): QuestionnaireAnswerUpsert[] =>
  (Object.keys(formData) as BrandFormKey[]).map((questionKey) => ({
    project_id: projectId,
    section_key: QUESTION_SECTION_MAP[questionKey],
    question_key: questionKey,
    answer: formData[questionKey],
  }));

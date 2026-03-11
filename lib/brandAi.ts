export type BrandAiProvider = 'openai' | 'gemini' | 'anthropic';

export type BrandAiErrorCode =
  | 'key-not-found'
  | 'invalid-key'
  | 'quota-exceeded'
  | 'rate-limit'
  | 'generation-failed';

export interface BrandAiAttemptFailure {
  provider: BrandAiProvider;
  code: BrandAiErrorCode;
  message: string;
}

export class BrandAiRequestError extends Error {
  code: BrandAiErrorCode;
  attempts: BrandAiAttemptFailure[];

  constructor(code: BrandAiErrorCode, attempts: BrandAiAttemptFailure[]) {
    super(
      attempts.length > 0
        ? attempts.map((attempt) => `${getBrandAiProviderLabel(attempt.provider)}: ${attempt.message}`).join(' | ')
        : 'All configured brand AI providers failed.'
    );

    this.name = 'BrandAiRequestError';
    this.code = code;
    this.attempts = attempts;
  }
}

const DEFAULT_PROVIDER_CHAIN: BrandAiProvider[] = ['openai', 'gemini'];

const BRAND_AI_PROVIDER_LABELS: Record<BrandAiProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  anthropic: 'Anthropic',
};

const BRAND_AI_PROVIDER_DOCS: Record<
  BrandAiProvider,
  {
    keys: string;
    quota: string;
  }
> = {
  openai: {
    keys: 'https://platform.openai.com/api-keys',
    quota: 'https://platform.openai.com/docs/guides/error-codes/api-errors',
  },
  gemini: {
    keys: 'https://ai.google.dev/gemini-api/docs/api-key',
    quota: 'https://ai.google.dev/gemini-api/docs/rate-limits',
  },
  anthropic: {
    keys: 'https://docs.anthropic.com/en/api/admin-api/apikeys/get-api-key',
    quota: 'https://docs.anthropic.com/en/api/errors',
  },
};

const normalizeProvider = (value: string): BrandAiProvider | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'openai' || normalized === 'gemini' || normalized === 'anthropic') {
    return normalized;
  }
  return null;
};

export const getBrandAiProviderChain = (): BrandAiProvider[] => {
  const configured = import.meta.env.VITE_BRAND_AI_PROVIDER_CHAIN;

  if (!configured) {
    return DEFAULT_PROVIDER_CHAIN;
  }

  const parsed = configured
    .split(',')
    .map((value) => normalizeProvider(value))
    .filter((value): value is BrandAiProvider => Boolean(value));

  return parsed.length > 0 ? parsed : DEFAULT_PROVIDER_CHAIN;
};

export const getBrandAiProviderLabel = (provider: BrandAiProvider): string =>
  BRAND_AI_PROVIDER_LABELS[provider];

export const getBrandAiDocs = (provider: BrandAiProvider) => BRAND_AI_PROVIDER_DOCS[provider];

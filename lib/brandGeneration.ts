import { BrandAiRequestError } from './brandAi';
import { supabase, supabaseAnonKey, supabaseUrl } from './supabase';
import { RegenerableKitSectionId, SavedBrandResult } from '../types';

interface BrandGenerationErrorPayload {
  code?: string;
  attempts?: Array<{
    provider: 'openai' | 'gemini' | 'anthropic';
    code: 'key-not-found' | 'invalid-key' | 'quota-exceeded' | 'rate-limit' | 'generation-failed';
    message: string;
  }>;
  message?: string;
}

const requireSupabase = () => {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }

  return supabase;
};

const parseSavedResult = (raw: any): SavedBrandResult => ({
  id: raw.id,
  projectId: raw.projectId || raw.project_id,
  result: raw.result,
  logoImageUrl: raw.logoImageUrl ?? raw.generated_logo_url ?? null,
  logoGeneratedAt: raw.logoGeneratedAt ?? raw.generated_logo_at ?? null,
  sourceModel: raw.sourceModel ?? raw.source_model ?? null,
  createdAt: raw.createdAt ?? raw.created_at,
  updatedAt: raw.updatedAt ?? raw.updated_at,
});

const toBrandAiError = (payload: BrandGenerationErrorPayload): BrandAiRequestError | null => {
  if (!payload.code || !payload.attempts) {
    return null;
  }

  return new BrandAiRequestError(payload.code as any, payload.attempts);
};

const callGenerationFunction = async <T>(
  body: Record<string, unknown>
): Promise<T> => {
  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required before generation.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-brand-kit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | T
    | {
        error?: BrandGenerationErrorPayload;
      };

  if (!response.ok) {
    const providerError =
      payload && typeof payload === 'object' && 'error' in payload
        ? toBrandAiError(payload.error || {})
        : null;

    if (providerError) {
      throw providerError;
    }

    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error?.message
        ? payload.error.message
        : 'Brand generation request failed.';

    throw new Error(message);
  }

  return payload as T;
};

export const generateBrandKit = async (projectId: string): Promise<SavedBrandResult> => {
  const payload = await callGenerationFunction<{ result: SavedBrandResult }>({
    action: 'generate-kit',
    projectId,
  });

  return parseSavedResult(payload.result);
};

export const regenerateBrandSection = async (
  projectId: string,
  resultId: string,
  sectionId: RegenerableKitSectionId
): Promise<SavedBrandResult> => {
  const payload = await callGenerationFunction<{ result: SavedBrandResult }>({
    action: 'regenerate-section',
    projectId,
    resultId,
    sectionId,
  });

  return parseSavedResult(payload.result);
};

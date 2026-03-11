import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.89.0';
import {
  buildFullBrandKitPrompt,
  buildSectionRegenerationPrompt,
  mergeRegeneratedBrandKitSection,
  normalizeBrandKit,
} from '../../../lib/brandStrategy.ts';
import { answersToFormData, getProjectBrandName } from '../../../lib/brandWorkbook.ts';

type BrandAiProvider = 'openai' | 'gemini';
type RegenerableKitSectionId =
  | 'brandEssence'
  | 'messagingDirection'
  | 'colorPaletteSuggestions'
  | 'logoDirection'
  | 'imageryDirection';

type BrandAiErrorCode =
  | 'key-not-found'
  | 'invalid-key'
  | 'quota-exceeded'
  | 'rate-limit'
  | 'generation-failed';

interface BrandAiAttemptFailure {
  provider: BrandAiProvider;
  code: BrandAiErrorCode;
  message: string;
}

interface QuestionRow {
  question_key: string;
  answer: unknown;
}

interface BrandResultRow {
  id: string;
  project_id: string;
  result_json: Record<string, unknown>;
  source_model: string | null;
  generated_logo_url: string | null;
  generated_logo_at: string | null;
  created_at: string;
  updated_at: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const DEFAULT_PROVIDER_CHAIN: BrandAiProvider[] = ['openai', 'gemini'];
const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

const normalizeProvider = (value: string): BrandAiProvider | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'openai' || normalized === 'gemini') {
    return normalized;
  }
  return null;
};

const getProviderChain = (): BrandAiProvider[] => {
  const configured = Deno.env.get('BRAND_AI_PROVIDER_CHAIN');
  if (!configured) return DEFAULT_PROVIDER_CHAIN;

  const parsed = configured
    .split(',')
    .map((value) => normalizeProvider(value))
    .filter((value): value is BrandAiProvider => Boolean(value));

  return parsed.length > 0 ? parsed : DEFAULT_PROVIDER_CHAIN;
};

const getProviderApiKey = (provider: BrandAiProvider) => {
  if (provider === 'openai') return Deno.env.get('OPENAI_API_KEY') || null;
  return Deno.env.get('GEMINI_API_KEY') || null;
};

const getProviderModel = (provider: BrandAiProvider) => {
  if (provider === 'openai') {
    return Deno.env.get('OPENAI_MODEL') || DEFAULT_OPENAI_MODEL;
  }

  return Deno.env.get('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL;
};

const inferBrandAiErrorCode = (message: string): BrandAiErrorCode => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('incorrect api key') ||
    normalized.includes('invalid api key') ||
    normalized.includes('api key not valid') ||
    normalized.includes('unauthorized') ||
    normalized.includes('authentication')
  ) {
    return 'invalid-key';
  }

  if (
    normalized.includes('insufficient_quota') ||
    normalized.includes('insufficient quota') ||
    normalized.includes('quota') ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('billing')
  ) {
    return 'quota-exceeded';
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('429')
  ) {
    return 'rate-limit';
  }

  return 'generation-failed';
};

const parseOpenAiText = (content: unknown): string => {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
          return item.text;
        }
        return '';
      })
      .join('')
      .trim();
  }

  return '';
};

const requestOpenAiJson = async <T>(
  prompt: string,
  apiKey: string,
  model: string
): Promise<T> => {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || response.statusText || 'OpenAI request failed.');
  }

  const text = parseOpenAiText(payload?.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error('OpenAI returned an empty response.');
  }

  return JSON.parse(text) as T;
};

const requestGeminiJson = async <T>(
  prompt: string,
  apiKey: string,
  model: string
): Promise<T> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || response.statusText || 'Gemini request failed.');
  }

  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(text) as T;
};

const resolveFinalErrorCode = (attempts: BrandAiAttemptFailure[]): BrandAiErrorCode => {
  if (attempts.length === 0) {
    return 'generation-failed';
  }

  const codes = attempts.map((attempt) => attempt.code);

  if (codes.every((code) => code === 'key-not-found')) {
    return 'key-not-found';
  }

  if (codes.includes('invalid-key')) {
    return 'invalid-key';
  }

  if (codes.includes('quota-exceeded')) {
    return 'quota-exceeded';
  }

  if (codes.includes('rate-limit')) {
    return 'rate-limit';
  }

  if (codes.includes('key-not-found')) {
    return 'key-not-found';
  }

  return attempts[attempts.length - 1]?.code || 'generation-failed';
};

const requestBrandAiJson = async <T>(
  prompt: string
): Promise<{ result: T; sourceModel: string; attempts: BrandAiAttemptFailure[] }> => {
  const attempts: BrandAiAttemptFailure[] = [];

  for (const provider of getProviderChain()) {
    const apiKey = getProviderApiKey(provider);
    const model = getProviderModel(provider);

    if (!apiKey) {
      attempts.push({
        provider,
        code: 'key-not-found',
        message: `${provider} is not configured for this function.`,
      });
      continue;
    }

    try {
      const result =
        provider === 'openai'
          ? await requestOpenAiJson<T>(prompt, apiKey, model)
          : await requestGeminiJson<T>(prompt, apiKey, model);

      return {
        result,
        sourceModel: `${provider}:${model}`,
        attempts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error.';
      attempts.push({
        provider,
        code: inferBrandAiErrorCode(message),
        message,
      });
    }
  }

  throw {
    code: resolveFinalErrorCode(attempts),
    attempts,
    message: attempts[attempts.length - 1]?.message || 'All configured brand AI providers failed.',
  };
};

const mapResult = (record: BrandResultRow) => ({
  id: record.id,
  projectId: record.project_id,
  result: record.result_json,
  logoImageUrl: record.generated_logo_url,
  logoGeneratedAt: record.generated_logo_at,
  sourceModel: record.source_model,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const createUserScopedClient = (authHeader: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase function environment is missing base configuration.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
};

const loadProjectAnswers = async (client: ReturnType<typeof createUserScopedClient>, projectId: string) => {
  const { data, error } = await client
    .from('questionnaire_answers')
    .select('question_key, answer')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return answersToFormData((data || []) as QuestionRow[]);
};

const loadCurrentResult = async (
  client: ReturnType<typeof createUserScopedClient>,
  resultId: string,
  projectId: string
) => {
  const { data, error } = await client
    .from('brand_results')
    .select('*')
    .eq('id', resultId)
    .eq('project_id', projectId)
    .single();

  if (error) throw error;

  return data as BrandResultRow;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: { message: 'Method not allowed.' } }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: { message: 'Missing authorization header.' } }, 401);
  }

  let body: {
    action?: 'generate-kit' | 'regenerate-section';
    projectId?: string;
    resultId?: string;
    sectionId?: RegenerableKitSectionId;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: { message: 'Invalid JSON body.' } }, 400);
  }

  if (!body.projectId || !body.action) {
    return jsonResponse({ error: { message: 'projectId and action are required.' } }, 400);
  }

  const client = createUserScopedClient(authHeader);

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: { message: 'Not authenticated.' } }, 401);
  }

  const { data: project, error: projectError } = await client
    .from('projects')
    .select('id, brand_name, status')
    .eq('id', body.projectId)
    .single();

  if (projectError || !project) {
    return jsonResponse({ error: { message: 'Project not found.' } }, 404);
  }

  try {
    const formData = await loadProjectAnswers(client, body.projectId);
    const projectBrandName = getProjectBrandName(formData);

    await client
      .from('projects')
      .update({
        status: 'generating',
        brand_name: projectBrandName,
      })
      .eq('id', body.projectId);

    if (body.action === 'generate-kit') {
      const generated = await requestBrandAiJson<Record<string, unknown>>(
        buildFullBrandKitPrompt(formData)
      );
      const normalized = normalizeBrandKit(generated.result);

      const { data: savedResult, error: saveError } = await client
        .from('brand_results')
        .insert({
          project_id: body.projectId,
          result_json: normalized,
          source_model: generated.sourceModel,
        })
        .select('*')
        .single();

      if (saveError) throw saveError;

      await client
        .from('projects')
        .update({
          status: 'generated',
          brand_name: projectBrandName,
        })
        .eq('id', body.projectId);

      return jsonResponse({ result: mapResult(savedResult as BrandResultRow) });
    }

    if (!body.resultId || !body.sectionId) {
      return jsonResponse(
        { error: { message: 'resultId and sectionId are required for section regeneration.' } },
        400
      );
    }

    const currentResult = await loadCurrentResult(client, body.resultId, body.projectId);
    const regenerated = await requestBrandAiJson<Record<string, unknown>>(
      buildSectionRegenerationPrompt(
        body.sectionId,
        formData,
        normalizeBrandKit(currentResult.result_json)
      )
    );

    const nextKit = mergeRegeneratedBrandKitSection(
      body.sectionId,
      normalizeBrandKit(currentResult.result_json),
      regenerated.result
    );

    const shouldResetLogo = body.sectionId === 'logoDirection';
    const { data: savedResult, error: saveError } = await client
      .from('brand_results')
      .insert({
        project_id: body.projectId,
        result_json: nextKit,
        source_model: regenerated.sourceModel,
        generated_logo_url: shouldResetLogo ? null : currentResult.generated_logo_url,
        generated_logo_at: shouldResetLogo ? null : currentResult.generated_logo_at,
      })
      .select('*')
      .single();

    if (saveError) throw saveError;

    await client
      .from('projects')
      .update({
        status: 'generated',
        brand_name: projectBrandName,
      })
      .eq('id', body.projectId);

    return jsonResponse({ result: mapResult(savedResult as BrandResultRow) });
  } catch (error) {
    await client
      .from('projects')
      .update({
        status: 'draft',
      })
      .eq('id', body.projectId);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'attempts' in error
    ) {
      return jsonResponse({ error }, 502);
    }

    const message = error instanceof Error ? error.message : 'Brand generation failed.';
    return jsonResponse(
      {
        error: {
          code: 'generation-failed',
          attempts: [],
          message,
        },
      },
      500
    );
  }
});

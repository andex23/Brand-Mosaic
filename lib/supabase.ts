import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration incomplete. Cloud features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Database Types
export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatusRecord = 'draft' | 'generating' | 'generated';

export interface ProjectRecord {
  id: string;
  user_id: string;
  brand_name: string;
  status: ProjectStatusRecord;
  kit_locks: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireAnswerRecord {
  id: string;
  project_id: string;
  section_key: string;
  question_key: string;
  answer: unknown;
  created_at: string;
  updated_at: string;
}

export interface BrandResultRecord {
  id: string;
  project_id: string;
  result_json: unknown;
  source_model: string | null;
  generated_logo_url: string | null;
  generated_logo_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExportRecord {
  id: string;
  project_id: string;
  brand_result_id: string | null;
  export_type: 'pdf' | 'link' | 'json';
  file_name: string | null;
  export_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Legacy billing tables kept for compatibility with older flows.
export interface UserProfile {
  id: string;
  email: string;
  free_trial_used: boolean;
  total_generations: number;
  available_generations: number;
  created_at: string;
  updated_at: string;
}

export interface BrandProject {
  id: string;
  user_id: string;
  name: string;
  form_data: any;
  brand_kit?: any;
  logo_image_url?: string;
  logo_generated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationLog {
  id: string;
  user_id: string;
  project_id?: string;
  api_key_source: 'server' | 'user_provided';
  is_free_tier: boolean;
  generation_type: 'brand_kit' | 'logo' | 'scene';
  cost_estimate: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  payment_provider: 'paystack' | 'stripe' | 'crypto';
  payment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  generations_purchased: number;
  created_at: string;
}

export interface UserApiKey {
  id: string;
  user_id: string;
  encrypted_key: string;
  created_at: string;
  updated_at: string;
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};




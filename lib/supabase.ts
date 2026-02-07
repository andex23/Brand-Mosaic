import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration incomplete. Cloud features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database Types
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
  generation_type: 'brand_kit' | 'logo';
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







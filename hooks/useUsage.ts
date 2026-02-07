import { useState, useEffect, useCallback } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useUsage = (user: User | null, isLocalMode: boolean = false) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocalMode) {
      // Local mode has no limits
      setLoading(false);
      return;
    }

    if (!user || !supabase) {
      setProfile(null);
      setLoading(false);
      return;
    }

    loadProfile();

    // Subscribe to profile changes
    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isLocalMode]);

  const loadProfile = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        console.error('Error loading profile:', error);
        return;
      }

      if (!data) {
        // Create profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            free_trial_used: false,
            total_generations: 0,
            available_generations: 1, // Free first try
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return;
        }

        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = useCallback((): boolean => {
    if (isLocalMode) return true; // No limits in local mode
    if (!profile) return false;
    // -1 means unlimited access (subscription or full access)
    return profile.available_generations === -1 || profile.available_generations > 0;
  }, [profile, isLocalMode]);

  const isFreeTier = useCallback((): boolean => {
    if (isLocalMode) return false; // Local mode is not free tier
    if (!profile) return true;
    return !profile.free_trial_used && profile.total_generations === 0;
  }, [profile, isLocalMode]);

  const recordGeneration = async (
    projectId: string,
    apiKeySource: 'server' | 'user_provided',
    generationType: 'brand_kit' | 'logo' = 'brand_kit'
  ): Promise<boolean> => {
    if (isLocalMode) return true; // No tracking in local mode
    if (!user || !profile || !supabase) return false;

    try {
      const isFirstGeneration = !profile.free_trial_used && profile.total_generations === 0;

      // Log the generation
      const { error: logError } = await supabase
        .from('generation_logs')
        .insert({
          user_id: user.id,
          project_id: projectId,
          api_key_source: apiKeySource,
          is_free_tier: isFirstGeneration,
          generation_type: generationType,
          cost_estimate: apiKeySource === 'server' ? 0.03 : 0,
        });

      if (logError) {
        console.error('Error logging generation:', logError);
      }

      // Deduct generation using database function
      const { error: deductError } = await supabase.rpc('deduct_generation', {
        p_user_id: user.id,
        p_is_free_tier: isFirstGeneration,
      });

      if (deductError) {
        console.error('Error deducting generation:', deductError);
        return false;
      }

      // Reload profile to get updated counts
      await loadProfile();
      return true;
    } catch (err) {
      console.error('Unexpected error recording generation:', err);
      return false;
    }
  };

  const addGenerations = async (count: number): Promise<boolean> => {
    if (isLocalMode) return true; // No credits in local mode
    if (!user || !profile || !supabase) return false;

    try {
      const { error } = await supabase.rpc('add_user_generations', {
        p_user_id: user.id,
        p_count: count,
      });

      if (error) {
        console.error('Error adding generations:', error);
        return false;
      }

      await loadProfile();
      return true;
    } catch (err) {
      console.error('Unexpected error adding generations:', err);
      return false;
    }
  };

  return {
    profile,
    loading,
    canGenerate,
    isFreeTier,
    recordGeneration,
    addGenerations,
    refresh: loadProfile,
  };
};


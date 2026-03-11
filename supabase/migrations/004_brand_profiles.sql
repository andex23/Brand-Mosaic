-- Brand Profile presets for Photo Studio multi-tenant defaults

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS brand_profile_id TEXT DEFAULT 'balanced-commercial';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_brand_profile_id_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_brand_profile_id_check
      CHECK (
        brand_profile_id IN (
          'balanced-commercial',
          'warm-organic',
          'minimal-luxe',
          'high-contrast-tech',
          'editorial-bold'
        )
      );
  END IF;
END $$;

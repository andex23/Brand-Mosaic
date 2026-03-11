-- Multi-user workbook model for Brand Mosaic
-- Adds private, per-user projects, answers, saved results, and exports.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL DEFAULT 'Untitled Brand Workbook',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated')),
  kit_locks JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  question_key TEXT NOT NULL,
  answer JSONB NOT NULL DEFAULT 'null'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questionnaire_answers_project_question_key UNIQUE (project_id, section_key, question_key)
);

CREATE TABLE IF NOT EXISTS public.brand_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  result_json JSONB NOT NULL,
  source_model TEXT,
  generated_logo_url TEXT,
  generated_logo_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  brand_result_id UUID REFERENCES public.brand_results(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'link', 'json')),
  file_name TEXT,
  export_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id_updated_at ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_project_id ON public.questionnaire_answers(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_results_project_id_created_at ON public.brand_results(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_project_id_created_at ON public.exports(project_id, created_at DESC);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questionnaire_answers_updated_at ON public.questionnaire_answers;
CREATE TRIGGER update_questionnaire_answers_updated_at
  BEFORE UPDATE ON public.questionnaire_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_results_updated_at ON public.brand_results;
CREATE TRIGGER update_brand_results_updated_at
  BEFORE UPDATE ON public.brand_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT up.id, up.email, up.created_at, up.updated_at
FROM public.user_profiles up
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name)
SELECT au.id, au.email, COALESCE(NULLIF(au.raw_user_meta_data ->> 'full_name', ''), NULL)
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  updated_at = NOW();

INSERT INTO public.projects (id, user_id, brand_name, status, created_at, updated_at)
SELECT
  bp.id,
  bp.user_id,
  COALESCE(NULLIF(bp.name, ''), 'Untitled Brand Workbook'),
  CASE WHEN bp.brand_kit IS NULL THEN 'draft' ELSE 'generated' END,
  bp.created_at,
  bp.updated_at
FROM public.brand_projects bp
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questionnaire_answers (project_id, section_key, question_key, answer, created_at, updated_at)
SELECT
  bp.id,
  CASE
    WHEN kv.key IN ('brandName', 'offering') THEN 'brand_basics'
    WHEN kv.key IN ('purpose', 'problem') THEN 'brand_purpose'
    WHEN kv.key IN ('audience', 'customerCare') THEN 'audience'
    WHEN kv.key IN ('tone', 'feeling', 'adjectives') THEN 'personality'
    WHEN kv.key IN ('palette', 'customPalette', 'customColor1', 'customColor2', 'vibe', 'customVibe', 'moodBoardKeywords', 'typography', 'customFont', 'fashion', 'soundtrack', 'inspiration') THEN 'visual_direction'
    ELSE 'differentiation'
  END AS section_key,
  kv.key,
  kv.value,
  bp.created_at,
  bp.updated_at
FROM public.brand_projects bp
CROSS JOIN LATERAL jsonb_each(to_jsonb(bp.form_data)) AS kv(key, value)
ON CONFLICT (project_id, section_key, question_key) DO NOTHING;

INSERT INTO public.brand_results (project_id, result_json, generated_logo_url, generated_logo_at, created_at, updated_at)
SELECT
  bp.id,
  bp.brand_kit,
  bp.logo_image_url,
  bp.logo_generated_at,
  COALESCE(bp.logo_generated_at, bp.updated_at, bp.created_at),
  COALESCE(bp.updated_at, bp.created_at)
FROM public.brand_projects bp
WHERE bp.brand_kit IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

CREATE OR REPLACE FUNCTION public.duplicate_project(
  p_project_id UUID,
  p_copy_latest_result BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  source_project public.projects%ROWTYPE;
  source_result public.brand_results%ROWTYPE;
  new_project_id UUID;
BEGIN
  SELECT *
  INTO source_project
  FROM public.projects
  WHERE id = p_project_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  INSERT INTO public.projects (user_id, brand_name, status, kit_locks)
  VALUES (
    auth.uid(),
    CONCAT(source_project.brand_name, ' Copy'),
    CASE
      WHEN p_copy_latest_result
        AND EXISTS (SELECT 1 FROM public.brand_results WHERE project_id = p_project_id)
      THEN 'generated'
      ELSE 'draft'
    END,
    source_project.kit_locks
  )
  RETURNING id INTO new_project_id;

  INSERT INTO public.questionnaire_answers (project_id, section_key, question_key, answer)
  SELECT new_project_id, section_key, question_key, answer
  FROM public.questionnaire_answers
  WHERE project_id = p_project_id;

  IF p_copy_latest_result THEN
    SELECT *
    INTO source_result
    FROM public.brand_results
    WHERE project_id = p_project_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      INSERT INTO public.brand_results (
        project_id,
        result_json,
        source_model,
        generated_logo_url,
        generated_logo_at
      )
      VALUES (
        new_project_id,
        source_result.result_json,
        source_result.source_model,
        source_result.generated_logo_url,
        source_result.generated_logo_at
      );
    END IF;
  END IF;

  RETURN new_project_id;
END;
$$;

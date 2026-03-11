-- Row-level security for the multi-user workbook model

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are private to the owner" ON public.profiles;
CREATE POLICY "Profiles are private to the owner"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles can be inserted by the owner" ON public.profiles;
CREATE POLICY "Profiles can be inserted by the owner"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles can be updated by the owner" ON public.profiles;
CREATE POLICY "Profiles can be updated by the owner"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Projects are private to the owner" ON public.projects;
CREATE POLICY "Projects are private to the owner"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects can be inserted by the owner" ON public.projects;
CREATE POLICY "Projects can be inserted by the owner"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects can be updated by the owner" ON public.projects;
CREATE POLICY "Projects can be updated by the owner"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects can be deleted by the owner" ON public.projects;
CREATE POLICY "Projects can be deleted by the owner"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Answers are private to the project owner" ON public.questionnaire_answers;
CREATE POLICY "Answers are private to the project owner"
  ON public.questionnaire_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = questionnaire_answers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Answers can be inserted by the project owner" ON public.questionnaire_answers;
CREATE POLICY "Answers can be inserted by the project owner"
  ON public.questionnaire_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = questionnaire_answers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Answers can be updated by the project owner" ON public.questionnaire_answers;
CREATE POLICY "Answers can be updated by the project owner"
  ON public.questionnaire_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = questionnaire_answers.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = questionnaire_answers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Answers can be deleted by the project owner" ON public.questionnaire_answers;
CREATE POLICY "Answers can be deleted by the project owner"
  ON public.questionnaire_answers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = questionnaire_answers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Results are private to the project owner" ON public.brand_results;
CREATE POLICY "Results are private to the project owner"
  ON public.brand_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = brand_results.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Results can be inserted by the project owner" ON public.brand_results;
CREATE POLICY "Results can be inserted by the project owner"
  ON public.brand_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = brand_results.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Results can be updated by the project owner" ON public.brand_results;
CREATE POLICY "Results can be updated by the project owner"
  ON public.brand_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = brand_results.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = brand_results.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Results can be deleted by the project owner" ON public.brand_results;
CREATE POLICY "Results can be deleted by the project owner"
  ON public.brand_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = brand_results.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Exports are private to the project owner" ON public.exports;
CREATE POLICY "Exports are private to the project owner"
  ON public.exports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = exports.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Exports can be inserted by the project owner" ON public.exports;
CREATE POLICY "Exports can be inserted by the project owner"
  ON public.exports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = exports.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Exports can be updated by the project owner" ON public.exports;
CREATE POLICY "Exports can be updated by the project owner"
  ON public.exports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = exports.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = exports.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Exports can be deleted by the project owner" ON public.exports;
CREATE POLICY "Exports can be deleted by the project owner"
  ON public.exports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = exports.project_id
        AND p.user_id = auth.uid()
    )
  );

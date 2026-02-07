-- Database Functions for Brand Mosaic
-- Helper functions for credit management and user operations

-- Function to add generations after payment
CREATE OR REPLACE FUNCTION public.add_user_generations(
  p_user_id UUID,
  p_count INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    available_generations = available_generations + p_count,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Function to deduct generation (with free tier check)
CREATE OR REPLACE FUNCTION public.deduct_generation(
  p_user_id UUID,
  p_is_free_tier BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Get current available generations
  SELECT available_generations INTO v_available
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- If free tier, don't deduct but mark as used
  IF p_is_free_tier THEN
    UPDATE public.user_profiles
    SET 
      free_trial_used = true,
      total_generations = total_generations + 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  -- Check if user has available generations
  IF v_available > 0 THEN
    UPDATE public.user_profiles
    SET 
      available_generations = available_generations - 1,
      total_generations = total_generations + 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to get user usage stats
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_generations INTEGER,
  available_generations INTEGER,
  free_trial_used BOOLEAN,
  total_spent DECIMAL,
  logo_generations INTEGER,
  brand_kit_generations INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.total_generations,
    up.available_generations,
    up.free_trial_used,
    COALESCE(SUM(p.amount), 0) as total_spent,
    COALESCE(SUM(CASE WHEN gl.generation_type = 'logo' THEN 1 ELSE 0 END), 0)::INTEGER as logo_generations,
    COALESCE(SUM(CASE WHEN gl.generation_type = 'brand_kit' THEN 1 ELSE 0 END), 0)::INTEGER as brand_kit_generations
  FROM public.user_profiles up
  LEFT JOIN public.payments p ON p.user_id = up.id AND p.status = 'completed'
  LEFT JOIN public.generation_logs gl ON gl.user_id = up.id
  WHERE up.id = p_user_id
  GROUP BY up.id, up.total_generations, up.available_generations, up.free_trial_used;
END;
$$;

-- Function to clean up old generation logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.generation_logs
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;







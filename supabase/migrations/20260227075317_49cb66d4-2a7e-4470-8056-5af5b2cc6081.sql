
-- Fix permissive RLS policy on scorecard_results
DROP POLICY "Service role can insert scorecard results" ON public.scorecard_results;

-- Service role bypasses RLS anyway, so we restrict insert to institution users
CREATE POLICY "Institution users can insert scorecard results"
  ON public.scorecard_results FOR INSERT
  WITH CHECK (application_id IN (
    SELECT id FROM public.applications WHERE institution_id = user_institution_id(auth.uid())
  ));

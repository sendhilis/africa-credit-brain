
-- Drop the wide-open temp policies
DROP POLICY IF EXISTS "allow_all_select_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "allow_all_insert_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "allow_all_update_borrowers" ON public.borrowers;

DROP POLICY IF EXISTS "allow_all_select_applications" ON public.applications;
DROP POLICY IF EXISTS "allow_all_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "allow_all_update_applications" ON public.applications;

DROP POLICY IF EXISTS "allow_all_select_institutions" ON public.institutions;
DROP POLICY IF EXISTS "allow_all_insert_institutions" ON public.institutions;

-- Restore proper institution-scoped policies for borrowers
CREATE POLICY "Institution users can view borrowers"
  ON public.borrowers FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can create borrowers"
  ON public.borrowers FOR INSERT TO authenticated
  WITH CHECK (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can update borrowers"
  ON public.borrowers FOR UPDATE TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

-- Restore proper institution-scoped policies for applications
CREATE POLICY "Institution users can view applications"
  ON public.applications FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Users can create applications"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Users can update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

-- Restore proper policies for institutions
CREATE POLICY "Users can view own institution"
  ON public.institutions FOR SELECT TO authenticated
  USING (id = user_institution_id(auth.uid()));

CREATE POLICY "Admins can manage institutions"
  ON public.institutions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

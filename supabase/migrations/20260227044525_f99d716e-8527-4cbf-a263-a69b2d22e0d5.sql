
-- Drop ALL existing policies on borrowers, applications, institutions
DROP POLICY IF EXISTS "Institution users can view borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "Institution users can create borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "Institution users can update borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "temp_public_select_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "temp_public_insert_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "temp_public_update_borrowers" ON public.borrowers;

DROP POLICY IF EXISTS "Institution users can view applications" ON public.applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update applications" ON public.applications;
DROP POLICY IF EXISTS "temp_public_select_applications" ON public.applications;
DROP POLICY IF EXISTS "temp_public_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "temp_public_update_applications" ON public.applications;

DROP POLICY IF EXISTS "Admins can manage institutions" ON public.institutions;
DROP POLICY IF EXISTS "Users can view own institution" ON public.institutions;
DROP POLICY IF EXISTS "temp_public_select_institutions" ON public.institutions;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "allow_all_select_borrowers" ON public.borrowers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_all_insert_borrowers" ON public.borrowers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow_all_update_borrowers" ON public.borrowers FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "allow_all_select_applications" ON public.applications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_all_insert_applications" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow_all_update_applications" ON public.applications FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "allow_all_select_institutions" ON public.institutions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_all_insert_institutions" ON public.institutions FOR INSERT TO anon, authenticated WITH CHECK (true);

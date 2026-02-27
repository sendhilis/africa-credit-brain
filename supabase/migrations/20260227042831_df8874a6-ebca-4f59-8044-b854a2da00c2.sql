
-- Drop restrictive temp policies and recreate as permissive
DROP POLICY IF EXISTS "temp_public_select_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "temp_public_insert_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "temp_public_update_borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "temp_public_select_applications" ON public.applications;
DROP POLICY IF EXISTS "temp_public_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "temp_public_update_applications" ON public.applications;
DROP POLICY IF EXISTS "temp_public_select_institutions" ON public.institutions;

CREATE POLICY "temp_public_select_borrowers" ON public.borrowers FOR SELECT USING (true);
CREATE POLICY "temp_public_insert_borrowers" ON public.borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY "temp_public_update_borrowers" ON public.borrowers FOR UPDATE USING (true);

CREATE POLICY "temp_public_select_applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "temp_public_insert_applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "temp_public_update_applications" ON public.applications FOR UPDATE USING (true);

CREATE POLICY "temp_public_select_institutions" ON public.institutions FOR SELECT USING (true);

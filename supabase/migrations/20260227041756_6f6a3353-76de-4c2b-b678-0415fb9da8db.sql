
-- Temporary public access policies for development (bypass auth)
-- BORROWERS: allow anon+authenticated full access
CREATE POLICY "temp_public_select_borrowers" ON public.borrowers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "temp_public_insert_borrowers" ON public.borrowers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "temp_public_update_borrowers" ON public.borrowers FOR UPDATE TO anon, authenticated USING (true);

-- APPLICATIONS: allow anon+authenticated full access
CREATE POLICY "temp_public_select_applications" ON public.applications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "temp_public_insert_applications" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "temp_public_update_applications" ON public.applications FOR UPDATE TO anon, authenticated USING (true);

-- INSTITUTIONS: allow anon+authenticated to read
CREATE POLICY "temp_public_select_institutions" ON public.institutions FOR SELECT TO anon, authenticated USING (true);

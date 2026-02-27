-- ==========================================
-- AfricaOne Credit Platform — Core Schema
-- ==========================================

-- 1. Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'credit_officer', 'underwriter', 'viewer');
CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'review', 'approved', 'declined', 'disbursed');
CREATE TYPE public.product_category AS ENUM ('retail', 'micro', 'sme');

-- 2. Institutions
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'onboarding',
  products INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- 3. User Roles (separate from profiles per security rules)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (user_id, role, institution_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Borrowers
CREATE TABLE public.borrowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
  country TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  marital_status TEXT,
  id_type TEXT,
  id_number TEXT,
  tax_id TEXT,
  social_id TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  location_detail TEXT,
  business_name TEXT,
  business_registration TEXT,
  business_type TEXT,
  years_in_operation INTEGER,
  sector TEXT,
  employees INTEGER,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;

-- 6. Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_code TEXT NOT NULL UNIQUE DEFAULT 'APP-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
  borrower_id UUID REFERENCES public.borrowers(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  country TEXT NOT NULL,
  product_category product_category NOT NULL DEFAULT 'retail',
  product_type TEXT,
  status application_status NOT NULL DEFAULT 'draft',
  requested_amount NUMERIC,
  currency TEXT,
  tenor_months INTEGER,
  purpose TEXT,
  collateral TEXT,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  monthly_rent NUMERIC,
  dependents INTEGER,
  existing_loans TEXT,
  employer TEXT,
  monthly_revenue NUMERIC,
  usd_income NUMERIC,
  usd_revenue NUMERIC,
  export_income_pct NUMERIC,
  alt_data_consents JSONB DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  psychometric_method TEXT,
  psychometric_status TEXT,
  psychometric_phone TEXT,
  score INTEGER,
  score_band TEXT,
  probability_of_default NUMERIC,
  reason_codes JSONB DEFAULT '[]'::jsonb,
  scored_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Security definer functions
-- ==========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.user_institution_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- ==========================================
-- RLS Policies
-- ==========================================

-- Institutions
CREATE POLICY "Users can view own institution" ON public.institutions
  FOR SELECT TO authenticated
  USING (id = public.user_institution_id(auth.uid()));

CREATE POLICY "Admins can manage institutions" ON public.institutions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Borrowers
CREATE POLICY "Institution users can view borrowers" ON public.borrowers
  FOR SELECT TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()));

CREATE POLICY "Institution users can create borrowers" ON public.borrowers
  FOR INSERT TO authenticated
  WITH CHECK (institution_id = public.user_institution_id(auth.uid()));

CREATE POLICY "Institution users can update borrowers" ON public.borrowers
  FOR UPDATE TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()));

-- Applications
CREATE POLICY "Institution users can view applications" ON public.applications
  FOR SELECT TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()));

CREATE POLICY "Users can create applications" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (institution_id = public.user_institution_id(auth.uid()));

CREATE POLICY "Users can update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING (institution_id = public.user_institution_id(auth.uid()));

-- ==========================================
-- Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_borrowers_updated_at
  BEFORE UPDATE ON public.borrowers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
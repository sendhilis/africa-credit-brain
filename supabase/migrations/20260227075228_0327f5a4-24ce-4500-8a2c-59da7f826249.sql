
-- Payment history table for time-series scoring features
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  borrower_id UUID NOT NULL REFERENCES public.borrowers(id),
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  application_id UUID REFERENCES public.applications(id),
  loan_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  days_past_due INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'on_time', 'late', 'defaulted', 'written_off')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Income history for income stability time-series
CREATE TABLE public.income_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  borrower_id UUID NOT NULL REFERENCES public.borrowers(id),
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  income_amount NUMERIC NOT NULL,
  income_source TEXT DEFAULT 'salary',
  currency TEXT NOT NULL DEFAULT 'KES',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scorecard results table to store detailed model output
CREATE TABLE public.scorecard_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id),
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  base_score NUMERIC NOT NULL,
  final_score INTEGER NOT NULL,
  probability_of_default NUMERIC NOT NULL,
  score_band TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  feature_contributions JSONB NOT NULL DEFAULT '[]'::jsonb,
  woe_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_series_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view payment history"
  ON public.payment_history FOR SELECT
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can insert payment history"
  ON public.payment_history FOR INSERT
  WITH CHECK (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can view income history"
  ON public.income_history FOR SELECT
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can insert income history"
  ON public.income_history FOR INSERT
  WITH CHECK (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can view scorecard results"
  ON public.scorecard_results FOR SELECT
  USING (application_id IN (
    SELECT id FROM public.applications WHERE institution_id = user_institution_id(auth.uid())
  ));

CREATE POLICY "Service role can insert scorecard results"
  ON public.scorecard_results FOR INSERT
  WITH CHECK (true);

-- Updated_at trigger for payment_history
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

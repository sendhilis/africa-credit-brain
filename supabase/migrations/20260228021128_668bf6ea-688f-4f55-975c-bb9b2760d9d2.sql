
-- API keys table for sandbox/live environments
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  label text NOT NULL DEFAULT 'Default Key',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view own keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Admins can manage keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- API request logs for sandbox/live
CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  method text NOT NULL,
  endpoint text NOT NULL,
  request_body jsonb,
  response_body jsonb,
  status_code integer NOT NULL,
  latency_ms integer,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view own logs"
  ON public.api_request_logs FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "System can insert logs"
  ON public.api_request_logs FOR INSERT TO authenticated
  WITH CHECK (institution_id = user_institution_id(auth.uid()));

-- Webhook configurations
CREATE TABLE public.webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  url text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  events text[] NOT NULL DEFAULT '{}',
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view webhooks"
  ON public.webhook_configs FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Admins can manage webhooks"
  ON public.webhook_configs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast key lookups
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix) WHERE is_active = true;
CREATE INDEX idx_api_request_logs_institution ON public.api_request_logs(institution_id, created_at DESC);

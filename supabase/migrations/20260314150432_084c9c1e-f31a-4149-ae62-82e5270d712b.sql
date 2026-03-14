
-- Table to store integration configurations per institution
CREATE TABLE public.integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  country text NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL, -- 'bank', 'mno', 'utility', 'credit_union', 'bureau'
  api_base_url text,
  environment text NOT NULL DEFAULT 'sandbox',
  status text NOT NULL DEFAULT 'disconnected', -- 'disconnected','connecting','sandbox_testing','connected','error'
  credentials_encrypted jsonb DEFAULT '{}'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  sandbox_test_results jsonb DEFAULT '[]'::jsonb,
  last_tested_at timestamptz,
  connected_at timestamptz,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(institution_id, entity_name, environment)
);

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view integrations"
  ON public.integration_configs FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Admins can manage integrations"
  ON public.integration_configs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- AI agent task log for observability
CREATE TABLE public.integration_agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  integration_config_id uuid REFERENCES public.integration_configs(id) ON DELETE CASCADE,
  task_type text NOT NULL, -- 'connect', 'test', 'configure', 'diagnose'
  entity_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending','running','completed','failed'
  steps jsonb DEFAULT '[]'::jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view agent tasks"
  ON public.integration_agent_tasks FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Admins can manage agent tasks"
  ON public.integration_agent_tasks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

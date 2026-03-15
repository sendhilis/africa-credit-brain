
-- Grace chat sessions table
CREATE TABLE public.grace_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Chat Session',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grace chat messages table
CREATE TABLE public.grace_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.grace_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grace_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grace_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
CREATE POLICY "Users can view own institution sessions"
  ON public.grace_chat_sessions FOR SELECT TO authenticated
  USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Users can create sessions"
  ON public.grace_chat_sessions FOR INSERT TO authenticated
  WITH CHECK (institution_id = user_institution_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.grace_chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for messages
CREATE POLICY "Users can view session messages"
  ON public.grace_chat_messages FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM public.grace_chat_sessions
    WHERE institution_id = user_institution_id(auth.uid())
  ));

CREATE POLICY "Users can insert messages"
  ON public.grace_chat_messages FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM public.grace_chat_sessions
    WHERE user_id = auth.uid()
  ));

-- Updated_at trigger for sessions
CREATE TRIGGER update_grace_chat_sessions_updated_at
  BEFORE UPDATE ON public.grace_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_grace_chat_sessions_app ON public.grace_chat_sessions(application_id, user_id);
CREATE INDEX idx_grace_chat_messages_session ON public.grace_chat_messages(session_id, created_at);

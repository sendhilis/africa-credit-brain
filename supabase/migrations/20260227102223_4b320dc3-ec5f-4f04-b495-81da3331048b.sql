
-- 1. Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('application-documents', 'application-documents', false, 20971520);

-- 2. RLS: Institution users can upload documents (path: {institution_id}/{application_id}/{filename})
CREATE POLICY "Institution users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents'
  AND (storage.foldername(name))[1] = user_institution_id(auth.uid())::text
);

-- 3. RLS: Institution users can view their documents
CREATE POLICY "Institution users can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'application-documents'
  AND (storage.foldername(name))[1] = user_institution_id(auth.uid())::text
);

-- 4. Create document_extractions table for OCR results
CREATE TABLE public.document_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id),
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  extracted_data JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution users can view extractions"
ON public.document_extractions FOR SELECT
USING (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can insert extractions"
ON public.document_extractions FOR INSERT
WITH CHECK (institution_id = user_institution_id(auth.uid()));

CREATE POLICY "Institution users can update extractions"
ON public.document_extractions FOR UPDATE
USING (institution_id = user_institution_id(auth.uid()));

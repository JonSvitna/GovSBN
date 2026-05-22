-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Evidence bucket for inspection photos, documents, signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  FALSE,
  52428800, -- 50 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','video/mp4','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- Users can upload evidence scoped to their org path
CREATE POLICY "evidence_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can view evidence from their own org
CREATE POLICY "evidence_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can delete their own evidence
CREATE POLICY "evidence_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence' AND
    owner = auth.uid()
  );

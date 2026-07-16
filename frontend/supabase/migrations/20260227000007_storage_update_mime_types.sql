-- ═══════════════════════════════════════════════════════════════════════════
-- Update storage bucket: allow document MIME types for Kho tài liệu
-- Sprint 11 — support PDF, Word, video uploads alongside images
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/webm'
  ],
  file_size_limit = 10485760  -- 10MB (was 5MB)
WHERE id = 'media';

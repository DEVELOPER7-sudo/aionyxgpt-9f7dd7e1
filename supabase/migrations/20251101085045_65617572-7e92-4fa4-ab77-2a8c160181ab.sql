-- Create storage bucket for file uploads (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files', 
  'chat-files', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'text/plain', 'application/json', 'application/xml', 'text/xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
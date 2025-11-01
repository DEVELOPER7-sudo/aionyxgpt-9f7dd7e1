-- Make chat-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-files';

-- Drop the public read policy
DROP POLICY IF EXISTS "Allow public to read all chat files" ON storage.objects;

-- Create new policy: users can only read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  storagePath: string;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    setIsUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated to upload files');
      }

      // Create unique file path with user ID and timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${timestamp}-${file.name}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);
      
      const uploadedFileData: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        storagePath: fileName,
      };

      setUploadedFiles(prev => [...prev, uploadedFileData]);
      toast.success(`${file.name} uploaded successfully`);
      
      return uploadedFileData;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[]): Promise<UploadedFile[]> => {
    const results = await Promise.all(files.map(uploadFile));
    return results.filter((f): f is UploadedFile => f !== null);
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  const removeFile = async (storagePath: string) => {
    try {
      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('chat-files')
        .remove([storagePath]);

      if (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file from storage');
      }

      setUploadedFiles(prev => prev.filter(f => f.storagePath !== storagePath));
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadedFiles,
    clearFiles,
    removeFile,
  };
};

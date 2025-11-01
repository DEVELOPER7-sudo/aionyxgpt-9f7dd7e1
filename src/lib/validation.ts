import { z } from 'zod';

// Chat message validation schema
export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(10000, 'Message too long (max 10,000 characters)'),
  role: z.enum(['user', 'assistant']),
  attachments: z.array(z.string().url('Invalid attachment URL')).max(10, 'Too many attachments').optional(),
});

// Chat title validation schema
export const chatTitleSchema = z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title too long (max 200 characters)');

// File attachment URL validation (must be from Supabase storage)
export const attachmentUrlSchema = z.string().url().refine(
  (url) => url.includes('supabase.co/storage') || url.includes('localhost'),
  'Invalid file source'
);

// Validate multiple attachments
export const validateAttachments = (urls: string[]): boolean => {
  if (urls.length > 10) {
    throw new Error('Too many attachments (max 10)');
  }
  
  urls.forEach(url => {
    const result = attachmentUrlSchema.safeParse(url);
    if (!result.success) {
      throw new Error('Invalid attachment URL');
    }
  });
  
  return true;
};

import { supabase } from '../../integrations/supabase/client';
import { UserProfile } from '../../types/features';

// ============================================================
// USER PROFILE OPERATIONS
// ============================================================

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return data || null;
};

export const createUserProfile = async (
  userId: string,
  displayName?: string,
  bio?: string
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      display_name: displayName,
      bio,
      profile_visibility: 'public',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user profile: ${error.message}`);
  return data;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update user profile: ${error.message}`);
  return data;
};

// ============================================================
// AVATAR MANAGEMENT
// ============================================================

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  // Optimize image size
  const optimizedFile = await optimizeImage(file);

  const filename = `${userId}-${Date.now()}.jpg`;
  const filePath = `avatars/${filename}`;

  const { error } = await supabase.storage.from('user-assets').upload(filePath, optimizedFile, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`Failed to upload avatar: ${error.message}`);

  // Get public URL
  const { data } = supabase.storage.from('user-assets').getPublicUrl(filePath);

  // Update profile with avatar URL
  await updateUserProfile(userId, { avatar_url: data.publicUrl });

  return data.publicUrl;
};

export const deleteAvatar = async (userId: string): Promise<void> => {
  const profile = await getUserProfile(userId);

  if (profile?.avatar_url) {
    // Extract filename from URL
    const filename = profile.avatar_url.split('/').pop();
    if (filename) {
      const { error } = await supabase
        .storage.from('user-assets')
        .remove([`avatars/${filename}`]);

      if (error) throw new Error(`Failed to delete avatar: ${error.message}`);
    }

    await updateUserProfile(userId, { avatar_url: null });
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function optimizeImage(file: File, maxWidth = 256, maxHeight = 256): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const getPublicProfile = async (userId: string): Promise<Partial<UserProfile> | null> => {
  const profile = await getUserProfile(userId);

  if (!profile) return null;

  // Only return public information
  if (profile.profile_visibility === 'public') {
    const { id, display_name, bio, avatar_url } = profile;
    return { id, display_name, bio, avatar_url };
  }

  return null;
};

import { supabase } from './supabase';

export const uploadPortfolioFile = async (
  file: File,
  userId: string
): Promise<{ url: string; fileName: string }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('portfolio_uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('portfolio_uploads')
    .getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    fileName: file.name,
  };
};

export const deletePortfolioFile = async (
  userId: string,
  fileName: string
): Promise<void> => {
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('portfolio_uploads')
    .remove([filePath]);

  if (error) throw error;
};

export const getFileType = (fileName: string): 'image' | 'pdf' | 'link' => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'link';
};

import { getSupabaseBrowserClient } from "./client";

const supabase = getSupabaseBrowserClient();

export const uploadUserPfp = async (userId: string, file: File) => {
  const filePath = `${userId}/profile.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('user_pfp')
    .upload(filePath, file, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) throw uploadError;

  return { success: true, path: filePath };
};

// 2. DISPLAY USER'S PHOTOS
// const viewMyPhotos = async (userId: string) => {
  
//   // Get all photo paths for this user
//   const { data: photos } = await supabase
//     .from('user_photos')
//     .select('id, file_path, original_filename')
//     .eq('user_id', userId);
  
//   // Generate fresh signed URLs (valid for 1 hour)
//   const photosWithUrls = await Promise.all(photos.map(async (photo) => {
//     const { data } = await supabase.storage
//       .from('user-photos')
//       .createSignedUrl(photo.file_path, 3600); // 1 hour
    
//     return {
//       ...photo,
//       viewUrl: data.signedUrl
//     };
//   }));
  
//   return photosWithUrls;
// };

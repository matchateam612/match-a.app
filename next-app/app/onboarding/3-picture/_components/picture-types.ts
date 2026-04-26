export type PictureSource = "upload" | "camera" | "";

export type PictureDraft = {
  source: PictureSource;
  prompt1: string;
  prompt2: string;
  prompt3: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  transformedAt: string;
  hasGeneratedImage: boolean;
};

export type GalleryPictureSlot = {
  slot: number;
  path: string | null;
  previewUrl: string | null;
  isUploading: boolean;
  isDeleting: boolean;
};

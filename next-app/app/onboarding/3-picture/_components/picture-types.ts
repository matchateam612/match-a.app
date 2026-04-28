export type PictureSource = "upload" | "camera" | "";
export type PictureGenerationStatus = "idle" | "loading" | "success" | "error";

export type PictureDraft = {
  source: PictureSource;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  originalAssetKey: string;
  generatedAssetKey: string;
  generationStatus: PictureGenerationStatus;
  generationError: string;
  selectedAvatarIndex: number;
};

export type GalleryPictureSlot = {
  slot: number;
  path: string | null;
  previewUrl: string | null;
  isUploading: boolean;
  isDeleting: boolean;
};

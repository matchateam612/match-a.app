export type PictureSource = "upload" | "camera" | "";

export type PictureDraft = {
  source: PictureSource;
  prompt: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  transformedAt: string;
  hasGeneratedImage: boolean;
};

export type PictureSource = "upload" | "camera" | "";

export type PictureDraft = {
  source: PictureSource;
  originalDataUrl: string;
  stylizedDataUrl: string;
  previewDataUrl: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  stylizedAt: string;
};

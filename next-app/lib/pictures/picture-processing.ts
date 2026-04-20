import "server-only";

import sharp from "sharp";

const MAX_EDGE = 1024;

export type NormalizedPicture = {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: "image/jpeg";
};

export async function normalizePictureFile(file: File): Promise<NormalizedPicture> {
  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(sourceBuffer, {
    failOn: "error",
    limitInputPixels: 64 * 1024 * 1024,
  });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("We couldn't read that image.");
  }

  const resized = image
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 90,
      mozjpeg: true,
    });

  const outputBuffer = await resized.toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMetadata.width ?? metadata.width,
    height: outputMetadata.height ?? metadata.height,
    mimeType: "image/jpeg",
  };
}

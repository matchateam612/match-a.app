type RenderedPortrait = {
  originalDataUrl: string;
  stylizedDataUrl: string;
  previewDataUrl: string;
  width: number;
  height: number;
};

function createDomImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("We couldn't load that image."));
    image.src = url;
  });
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("We couldn't read that photo."));
    reader.readAsDataURL(file);
  });
}

export async function renderStylizedPortrait(dataUrl: string): Promise<RenderedPortrait> {
  const image = await createDomImage(dataUrl);
  const maxEdge = 960;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = width;
  baseCanvas.height = height;
  const baseContext = baseCanvas.getContext("2d");

  if (!baseContext) {
    throw new Error("Your browser could not prepare the portrait canvas.");
  }

  baseContext.drawImage(image, 0, 0, width, height);

  const imageData = baseContext.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];

    const boostedRed = Math.min(255, red * 1.06 + 6);
    const boostedGreen = Math.min(255, green * 1.03 + 3);
    const boostedBlue = Math.min(255, blue * 0.97);
    const tone = 18;

    pixels[index] = Math.round(Math.round(boostedRed / tone) * tone);
    pixels[index + 1] = Math.round(Math.round(boostedGreen / tone) * tone);
    pixels[index + 2] = Math.round(Math.round(boostedBlue / tone) * tone);
  }

  baseContext.putImageData(imageData, 0, 0);

  const lineCanvas = document.createElement("canvas");
  lineCanvas.width = width;
  lineCanvas.height = height;
  const lineContext = lineCanvas.getContext("2d");

  if (!lineContext) {
    throw new Error("Your browser could not prepare the line-art layer.");
  }

  lineContext.filter = "grayscale(1) contrast(1.65) brightness(1.08)";
  lineContext.drawImage(image, 0, 0, width, height);

  const lines = lineContext.getImageData(0, 0, width, height);
  const linePixels = lines.data;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      const left = linePixels[index - 4];
      const right = linePixels[index + 4];
      const top = linePixels[index - width * 4];
      const bottom = linePixels[index + width * 4];
      const edgeStrength = Math.abs(left - right) + Math.abs(top - bottom);
      const lineValue = edgeStrength > 72 ? 26 : 255;

      linePixels[index] = lineValue;
      linePixels[index + 1] = lineValue;
      linePixels[index + 2] = lineValue;
      linePixels[index + 3] = edgeStrength > 72 ? 180 : 0;
    }
  }

  lineContext.putImageData(lines, 0, 0);

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalContext = finalCanvas.getContext("2d");

  if (!finalContext) {
    throw new Error("Your browser could not prepare the final portrait.");
  }

  finalContext.fillStyle = "#f8efe8";
  finalContext.fillRect(0, 0, width, height);
  finalContext.globalAlpha = 1;
  finalContext.filter = "saturate(1.08) contrast(1.02) brightness(1.04)";
  finalContext.drawImage(baseCanvas, 0, 0);
  finalContext.filter = "blur(0.35px)";
  finalContext.globalAlpha = 0.14;
  finalContext.drawImage(baseCanvas, 0, 0);
  finalContext.filter = "none";
  finalContext.globalAlpha = 0.56;
  finalContext.drawImage(lineCanvas, 0, 0);
  finalContext.globalAlpha = 0.16;
  finalContext.fillStyle = "#ffe8dc";
  finalContext.fillRect(0, 0, width, height);

  return {
    originalDataUrl: baseCanvas.toDataURL("image/jpeg", 0.9),
    stylizedDataUrl: finalCanvas.toDataURL("image/jpeg", 0.92),
    previewDataUrl: finalCanvas.toDataURL("image/jpeg", 0.92),
    width,
    height,
  };
}

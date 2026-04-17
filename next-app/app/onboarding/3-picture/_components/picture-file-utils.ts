"use client";

type PreparedPicture = {
  file: File;
  width: number;
  height: number;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("We couldn't load that image."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("We couldn't prepare that image."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

export async function preparePictureFile(file: File): Promise<PreparedPicture> {
  const image = await loadImage(file);
  const maxEdge = 1024;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare the image canvas.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile";
  const jpegFile = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });

  return {
    file: jpegFile,
    width,
    height,
  };
}

export async function transformPictureWithAi(file: File, prompt: string): Promise<File> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("prompt", prompt);

  const response = await fetch("/api/picture-transform", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "We couldn't transform that image right now.");
  }

  const outputBlob = await response.blob();
  return new File([outputBlob], "profile-generated.jpg", { type: "image/jpeg" });
}

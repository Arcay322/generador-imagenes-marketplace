export interface CompressedImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Imagen inválida."));
    img.src = src;
  });
}

interface CompressOptions {
  maxDimension: number;
  format: "jpeg" | "png";
  quality?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<CompressedImage> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  const scale = Math.min(1, options.maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");

  if (options.format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = options.format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = options.format === "jpeg" ? options.quality ?? 0.85 : undefined;
  const out = canvas.toDataURL(mimeType, quality);
  const base64 = out.split(",")[1];

  return { base64, mimeType, width, height };
}

export function dataUrlFromResult(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return cleaned || "figura";
}

export type LogoPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export async function overlayLogoOnImage(
  base64Image: string,
  imageMime: string,
  logoBase64: string,
  logoMime: string,
  position: LogoPosition = "bottom-right",
  scalePercent: number = 0.18,
): Promise<{ base64: string; mimeType: string }> {
  const mainImg = await loadImage(dataUrlFromResult(base64Image, imageMime));
  const logoImg = await loadImage(dataUrlFromResult(logoBase64, logoMime));

  const canvas = document.createElement("canvas");
  canvas.width = mainImg.naturalWidth || mainImg.width;
  canvas.height = mainImg.naturalHeight || mainImg.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context no disponible.");

  ctx.drawImage(mainImg, 0, 0);

  const targetLogoWidth = canvas.width * scalePercent;
  const logoScale = targetLogoWidth / (logoImg.naturalWidth || logoImg.width);
  const logoWidth = targetLogoWidth;
  const logoHeight = (logoImg.naturalHeight || logoImg.height) * logoScale;

  const margin = canvas.width * 0.04;
  let x = 0;
  let y = 0;

  switch (position) {
    case "bottom-left":
      x = margin;
      y = canvas.height - logoHeight - margin;
      break;
    case "top-right":
      x = canvas.width - logoWidth - margin;
      y = margin;
      break;
    case "top-left":
      x = margin;
      y = margin;
      break;
    case "bottom-right":
    default:
      x = canvas.width - logoWidth - margin;
      y = canvas.height - logoHeight - margin;
      break;
  }

  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

  const outDataUrl = canvas.toDataURL(imageMime || "image/png");
  const outBase64 = outDataUrl.split(",")[1];

  return { base64: outBase64, mimeType: imageMime || "image/png" };
}


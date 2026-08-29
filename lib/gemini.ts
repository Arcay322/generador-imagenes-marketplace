import { GoogleGenAI } from "@google/genai";

type CreateModelParam = Parameters<GoogleGenAI["interactions"]["create"]>[0] extends {
  model: infer M;
}
  ? M
  : never;

export interface GenerateImageParams {
  prompt: string;
  photoBase64: string;
  photoMime: string;
  logoBase64?: string;
  logoMime?: string;
  model: string;
  aspectRatio: string;
}

export interface GenerateImageResult {
  base64: string;
  mimeType: string;
}

const ASPECT_DIMS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 },
  "3:4": { w: 768, h: 1024 },
  "4:3": { w: 1024, h: 768 },
  "9:16": { w: 576, h: 1024 },
  "16:9": { w: 1024, h: 576 },
};

export async function generateImage(
  params: GenerateImageParams,
): Promise<GenerateImageResult> {
  if (params.model === "pollinations-flux-free") {
    const cleanPrompt = encodeURIComponent(params.prompt);
    const seed = Math.floor(Math.random() * 1000000);
    const dims = ASPECT_DIMS[params.aspectRatio] ?? ASPECT_DIMS["1:1"];
    const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${dims.w}&height=${dims.h}&seed=${seed}&nologo=true&model=flux`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("No se pudo obtener la imagen gratuita de Pollinations.");
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mimeType: "image/jpeg" };
  }

  if (params.model.startsWith("openrouter/")) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("Falta OPENROUTER_API_KEY en el servidor.");
    const openRouterModel = params.model.replace("openrouter/", "");
    const dims = ASPECT_DIMS[params.aspectRatio] ?? ASPECT_DIMS["1:1"];
    const size = `${dims.w}x${dims.h}`;
    const images: string[] = [];
    if (params.photoBase64) images.push(`data:${params.photoMime};base64,${params.photoBase64}`);
    if (params.logoBase64) images.push(`data:${params.logoMime ?? "image/png"};base64,${params.logoBase64}`);
    const body: Record<string, unknown> = { model: openRouterModel, prompt: params.prompt, n: 1, size };
    if (images.length) (body as Record<string, unknown>).images = images;
    const res = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fotovende.vercel.app",
        "X-Title": "FotoVende",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${openRouterModel} error ${res.status}: ${txt.slice(0, 400)}`);
    }
    const json = await res.json() as { data?: Array<{ b64_json?: string; url?: string }> };
    const item = json.data?.[0];
    if (!item) throw new Error(`${openRouterModel} no devolvió imagen. Respuesta: ` + JSON.stringify(json).slice(0, 600));
    if (item.b64_json) return { base64: item.b64_json, mimeType: "image/png" };
    if (item.url) {
      if (item.url.startsWith("data:")) {
        const base64 = item.url.split("base64,")[1];
        const mimeType = item.url.split(";")[0].split(":")[1];
        return { base64, mimeType };
      }
      const imgRes = await fetch(item.url);
      const buf = await imgRes.arrayBuffer();
      return { base64: Buffer.from(buf).toString("base64"), mimeType: "image/png" };
    }
    throw new Error(`${openRouterModel} respuesta sin imagen: ` + JSON.stringify(json).slice(0, 600));
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en el entorno del servidor.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const input: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mime_type: string }
  > = [{ type: "text", text: params.prompt }];

  if (params.photoBase64) {
    input.push({
      type: "image",
      data: params.photoBase64,
      mime_type: params.photoMime,
    });
  }
  if (params.logoBase64) {
    input.push({
      type: "image",
      data: params.logoBase64,
      mime_type: params.logoMime ?? "image/png",
    });
  }

  let interaction;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      interaction = await ai.interactions.create({
        model: params.model as CreateModelParam,
        input,
        response_modalities: ["image"],
        generation_config: {
          image_config: { aspect_ratio: params.aspectRatio },
        },
      });
      break;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number })?.status;
      const isRateLimit = status === 429 || msg.includes("429") || msg.includes("quota");
      if (isRateLimit && attempts < maxAttempts) {
        const delayMs = Math.pow(2, attempts) * 1000 + Math.random() * 500;
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }
      throw err;
    }
  }

  const image = interaction?.output_image;
  if (!image?.data) {
    throw new Error("El modelo no devolvió una imagen.");
  }

  return { base64: image.data, mimeType: image.mime_type ?? "image/png" };
}

import { NextRequest } from "next/server";
import { generateImage } from "@/lib/gemini";
import { buildPrompt } from "@/lib/prompts";
import { VIEW_KEYS, MODELS } from "@/lib/constants";
import { MOCK_IMAGE_BASE64 } from "@/lib/mock";

export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_LIMIT = new Map<string, { count: number; reset: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.reset) {
    RATE_LIMIT.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 20;
}

interface GenerateBody {
  view: string;
  name: string;
  size: string;
  withLogo: boolean;
  aspectRatio: string;
  model: string;
  photoBase64: string;
  photoMime: string;
  logoBase64?: string;
  logoMime?: string;
  backgroundStyle?: string;
  customInstructions?: string;
}

async function checkAuth(request: NextRequest): Promise<{ ok: true; uid: string } | { ok: false; status: number; error: string }> {
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");
  if (bearer) {
    try {
      const { verifyIdToken } = await import("@/lib/firebase-admin");
      const decoded = await verifyIdToken(bearer);
      return { ok: true, uid: decoded.uid };
    } catch {
      return { ok: false, status: 401, error: "Sesión inválida, inicia sesión de nuevo." };
    }
  }
  const expected = process.env.APP_PASSWORD;
  if (expected) {
    const auth = request.headers.get("x-app-password");
    if (auth && auth === expected) return { ok: true, uid: "legacy" };
  }
  return { ok: false, status: 401, error: "No autenticado." };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Demasiadas solicitudes. Esperá un minuto." }, { status: 429 });
  }
  const auth = await checkAuth(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!VIEW_KEYS.includes(body.view as (typeof VIEW_KEYS)[number])) {
    return Response.json({ error: "Vista inválida." }, { status: 400 });
  }
  if (!body.photoBase64 || !body.photoMime) {
    return Response.json({ error: "Falta la foto de referencia." }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ error: "Falta el nombre del personaje." }, { status: 400 });
  }
  if (!body.size?.trim()) {
    return Response.json({ error: "Falta el tamaño de la figura." }, { status: 400 });
  }

  const model: string = body.model || MODELS.flash;
  if (!Object.values(MODELS).includes(model as (typeof MODELS)[keyof typeof MODELS])) {
    return Response.json({ error: "Modelo inválido." }, { status: 400 });
  }

  if (auth.uid !== "legacy" && body.model !== "pollinations-flux-free") {
    try {
      const { consumeCredits } = await import("@/lib/credits");
      await consumeCredits(auth.uid, 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sin créditos";
      return Response.json({ error: msg }, { status: 402 });
    }
  }

  try {
    if (process.env.MOCK_GENERATE === "1") {
      return Response.json({ base64: MOCK_IMAGE_BASE64, mimeType: "image/png" });
    }
    const prompt = buildPrompt({
      view: body.view as (typeof VIEW_KEYS)[number],
      name: body.name,
      size: body.size,
      withLogo: !!body.withLogo,
      backgroundStyle: body.backgroundStyle as never,
      customInstructions: body.customInstructions,
    });

    const result = await generateImage({
      prompt,
      photoBase64: body.photoBase64,
      photoMime: body.photoMime,
      logoBase64: body.logoBase64,
      logoMime: body.logoMime,
      model,
      aspectRatio: body.aspectRatio || "1:1",
    });

    return Response.json({ base64: result.base64, mimeType: result.mimeType });
  } catch (err) {
    if (auth.uid !== "legacy" && body.model !== "pollinations-flux-free") {
      try {
        const { refundCredits } = await import("@/lib/credits");
        await refundCredits(auth.uid, 1);
      } catch {}
    }
    const message = err instanceof Error ? err.message : "Error generando la imagen.";
    return Response.json({ error: message }, { status: 500 });
  }
}

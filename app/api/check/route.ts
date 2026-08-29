import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return Response.json(
      { error: "APP_PASSWORD no configurado en el servidor." },
      { status: 500 },
    );
  }
  const auth = request.headers.get("x-app-password");
  if (!auth || auth !== expected) {
    return Response.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  return Response.json({ ok: true });
}

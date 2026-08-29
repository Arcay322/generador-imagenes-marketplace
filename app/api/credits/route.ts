import { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getUserCredits } from "@/lib/credits";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "No autenticado" }, { status: 401 });
  try {
    const decoded = await verifyIdToken(token);
    const data = await getUserCredits(decoded.uid);
    return Response.json(data);
  } catch {
    return Response.json({ error: "Token inválido" }, { status: 401 });
  }
}

import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { validateSession, db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const sessionId = cookies.split("sid=")[1]?.split(";")[0];
    if (!sessionId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const session = validateSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const logs = db.prepare(
      `SELECT id, question, matched, timestamp FROM logs WHERE user_id=? ORDER BY id DESC LIMIT 50`
    ).all(session.user_id);

    return NextResponse.json({ logs });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



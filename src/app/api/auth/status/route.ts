import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { validateSession } from "@/lib/db";
import { ensureDatabaseInitialized } from "@/lib/init-db";

export async function GET(req: Request) {
  try {
    // Initialiser la base de données
    await ensureDatabaseInitialized();
    
    const cookies = req.headers.get("cookie") || "";
    const sessionId = cookies.split("sid=")[1]?.split(";")[0];
    if (!sessionId) return NextResponse.json({ ok: false }, { status: 401 });
    const session = await validateSession(sessionId);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({ ok: true, user: { id: session.user_id, username: session.username } });
  } catch (error) {
    console.error("Erreur status:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}



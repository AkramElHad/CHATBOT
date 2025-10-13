import { NextResponse } from "next/server";
import { ensureDatabaseInitialized } from "@/lib/init-db";
import { validateSession, getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await ensureDatabaseInitialized();

    // Authentification
    const cookies = req.headers.get("cookie") || "";
    const sessionId = cookies.split("sid=")[1]?.split(";")[0];

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const session = await validateSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // Récupération des questions FAQ depuis MySQL
    const connection = getDb();
    const [rows] = await connection.execute(
      "SELECT questions AS question, reponses AS reponse FROM faq WHERE langue = 'fr'"
    );

    return NextResponse.json(rows ?? []);
  } catch (error) {
    console.error("Erreur API /faq:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement de la FAQ" },
      { status: 500 }
    );
  }
}

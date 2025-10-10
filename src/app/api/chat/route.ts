import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
export const runtime = "nodejs";
import {
  validateSession,
  findBestAnswer,
  appendLog,
  normalize,
} from "@/lib/db";
import { ensureDatabaseInitialized } from "@/lib/init-db";

export async function POST(req: Request) {
  try {
    // Initialiser la base de données
    await ensureDatabaseInitialized();
    
    // Auth guard
    const cookies = req.headers.get("cookie") || "";
    const sessionId = cookies.split("sid=")[1]?.split(";")[0];

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const session = await validateSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { question, chatId: incomingChatId } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Question vide" }, { status: 400 });
    }

    const q = normalize(question);
    const chatId = incomingChatId || uuidv4();

    // Direct mapping for exact matches (bypass database lookup)
    const directAnswers: Record<string, string> = {
      "horaires bibliotheque":
        "La bibliothèque est ouverte du lundi au vendredi de 8h à 18h.",
      "horaires resto u":
        "Le restaurant universitaire est ouvert de 11h30 à 14h et de 18h30 à 20h.",
      "contact scolarite": "CONTACT_SCOLARITE",
      "reglement campus":
        "Le règlement intérieur est disponible sur l'intranet du campus (rubrique Vie étudiante).",
      reglement:
        "Le règlement intérieur est disponible sur l'intranet du campus (rubrique Vie étudiante).",
      "dates importantes":
        "Examens à partir du 15 juin. Inscriptions jusqu'au 30 septembre.",
      "formations proposees": "Informatique, Gestion, Droit et Design.",
      formations: "Informatique, Gestion, Droit et Design.",
    };

    // Trouver une réponse
    let found = directAnswers[q] || await findBestAnswer(q);
    const response = found || "Je n'ai pas encore la réponse à cette question.";

    // Sauvegarder la question (user)
    await appendLog({
      chatId,
      userId: session.user_id,
      role: "user",
      text: question,
      matched: true,
      timestamp: new Date().toISOString(),
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
    });

    // Sauvegarder la réponse (assistant)
    await appendLog({
      chatId,
      userId: session.user_id,
      role: "assistant",
      text: response,
      matched: Boolean(found),
      timestamp: new Date().toISOString(),
      ip: "server",
    });

    return NextResponse.json({ answer: response, chatId });
  } catch (e) {
    console.error("Erreur chat:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { validateSession, findBestAnswer, appendLog, normalize } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Auth guard
    const cookies = req.headers.get("cookie") || "";
    const sessionId = cookies.split("sid=")[1]?.split(";")[0];
    
    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    const session = validateSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Question vide" }, { status: 400 });
    }

    const q = normalize(question);

    // Direct mapping for exact matches (bypass database lookup)
    const directAnswers: Record<string, string> = {
      "horaires bibliotheque": "La bibliothèque est ouverte du lundi au vendredi de 8h à 18h.",
      "horaires resto u": "Le restaurant universitaire est ouvert de 11h30 à 14h et de 18h30 à 20h.",
      "contact scolarite": "Vous pouvez contacter la scolarité à scolarite@campus.fr ou au 01 23 45 67 89.",
      "reglement campus": "Le règlement intérieur est disponible sur l'intranet du campus (rubrique Vie étudiante).",
      "reglement": "Le règlement intérieur est disponible sur l'intranet du campus (rubrique Vie étudiante).",
      "dates importantes": "Examens à partir du 15 juin. Inscriptions jusqu'au 30 septembre.",
      "formations proposees": "Informatique, Gestion, Droit et Design.",
      "formations": "Informatique, Gestion, Droit et Design.",
    };

    // Check direct mapping first
    let found = directAnswers[q];
    if (!found) {
      // Fallback to database lookup
      found = findBestAnswer(q);
    }
    const response = found || "Je n'ai pas encore la réponse à cette question.";
    
    // Log the interaction
    appendLog({
      question,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      matched: Boolean(found),
      timestamp: new Date().toISOString(),
      userId: session.user_id,
    });

    return NextResponse.json({ answer: response });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



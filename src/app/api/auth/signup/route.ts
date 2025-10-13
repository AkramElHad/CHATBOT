import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, username, password } = await request.json();

    // Validation des données
    if (!firstName?.trim() || !lastName?.trim() || !username?.trim() || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Pour l'instant, on retourne un succès
    // TODO: Implémenter la création d'utilisateur avec la base de données
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur signup:', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

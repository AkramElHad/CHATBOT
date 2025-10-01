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

    // Appeler l'API backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3003'
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error || "Erreur lors de la création du compte" },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true });
    } catch (fetchError) {
      console.error('Erreur de connexion au backend:', fetchError);
      return NextResponse.json(
        { error: "Impossible de se connecter au serveur. Veuillez réessayer." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Erreur signup:', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

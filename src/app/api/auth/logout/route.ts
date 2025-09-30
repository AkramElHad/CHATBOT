import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true });
    // Clear the session cookie
    response.cookies.set("sid", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });
    return response;
  } catch (e) {
    return NextResponse.json({ error: "Erreur de déconnexion" }, { status: 500 });
  }
}

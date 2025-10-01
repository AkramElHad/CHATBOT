"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Validation côté client
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password) {
      setError("Tous les champs sont obligatoires");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstName: firstName.trim(), 
          lastName: lastName.trim(), 
          username: username.trim(), 
          password 
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Échec de l'inscription");
      }
      
      // Rediriger vers la page de login avec un message de succès
      router.push("/login?message=Compte créé avec succès");
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--muted)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border" style={{ borderColor: "var(--border)" }}>
        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          <Image src="/ESIC.jpg" alt="ESIC" width={64} height={64} className="rounded-lg object-cover ring-2" style={{ ringColor: "var(--brand)" }} />
          <h1 className="mt-4 text-xl font-semibold" style={{ color: "var(--brand-700)" }}>Créer un compte</h1>
          <p className="text-sm text-[#6b7280] mt-1">Rejoignez notre assistant campus</p>
        </div>
        <form onSubmit={onSubmit} className="p-6 sm:p-8 pt-0 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prénom</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
                style={{ border: "1px solid var(--border)" }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nom</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
                style={{ border: "1px solid var(--border)" }}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Identifiant</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
              style={{ border: "1px solid var(--border)" }}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
              style={{ border: "1px solid var(--border)" }}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
              style={{ border: "1px solid var(--border)" }}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-xl">
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>
        <div className="p-6 sm:p-8 pt-0 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm text-[#6b7280] text-center">
            Déjà un compte ?{" "}
            <button 
              onClick={() => router.push("/login")}
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--brand-700)" }}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

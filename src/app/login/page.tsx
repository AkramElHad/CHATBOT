"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Échec de connexion");
      }
      // Vérifie le statut puis redirige
      const status = await fetch("/api/auth/status");
      if (status.ok) router.replace("/");
      else throw new Error("Session non établie");
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
          <h1 className="mt-4 text-xl font-semibold" style={{ color: "var(--brand-700)" }}>Connexion</h1>
          <p className="text-sm text-[#6b7280] mt-1">Accédez à votre assistant campus</p>
        </div>
        <form onSubmit={onSubmit} className="p-6 sm:p-8 pt-0 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Identifiant</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
              style={{ border: "1px solid var(--border)" }}
              placeholder="akram"
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
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-xl">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <p className="text-[11px] text-[#6b7280] text-center">Identifiants par défaut: akram / akram123</p>
        </form>
      </div>
    </div>
  );
}

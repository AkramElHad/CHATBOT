"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) setSuccessMessage(message);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ⚡ garde le cookie de session `sid`
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Échec de connexion");
      }

      // ✅ session bien créée côté Express
      router.replace("/");
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md bg-black text-white rounded-3xl shadow-lg border border-gray-800">
        <div className="p-8 flex flex-col items-center text-center">
          <Image
            src="/ESIC.jpg"
            alt="ESIC"
            width={72}
            height={72}
            className="rounded-xl shadow-md"
          />
          <h1 className="mt-5 text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-gray-300 mt-1">
            Accédez à votre assistant campus
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-8 pt-0 space-y-5">
          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2.5">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-200">
              Identifiant
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-400 bg-white text-black 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Votre identifiant"
              required
            />
          </div>

          <div className="relative">
            <label className="text-sm font-medium text-gray-200">
              Mot de passe
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-400 bg-white text-black 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 text-sm"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white 
                       bg-gradient-to-r from-blue-600 to-blue-400 shadow-md hover:opacity-90 transition"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            Identifiants par défaut: akram / akram123
          </p>
        </form>

        <div className="p-6 pt-0 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">
            Nouveau sur la plateforme ?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-sm font-medium text-blue-400 hover:underline"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

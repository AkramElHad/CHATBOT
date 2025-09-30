"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// Import manquant pour crypto.randomUUID()
// L'utilisation de 'crypto' dans le front-end Next.js nécessite l'import explicite
// si l'environnement de construction ne le fournit pas globalement.

type Message = { id: string; role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Horaires bibliothèque",
  "Horaires resto U",
  "Contact scolarité",
  "Règlement campus",
  "Dates importantes",
  "Formations proposées",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // authed doit être initialisé à 'null' pour indiquer l'état de chargement
  const [authed, setAuthed] = useState<boolean | null>(null); 
  // Etat pour l'historique (déclaré avant tout return conditionnel)
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: number; question: string; matched: number; timestamp: string }[]>([]);

  useEffect(() => {
    // Fait défiler la liste des messages vers le bas
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/status");
        setAuthed(res.ok);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  // 🚨 CORRECTION 3: Redirection conditionnelle
  // La redirection doit être gérée par un hook ou une fonction pour être correcte dans React.
  // De plus, on ne doit rediriger que si l'état 'authed' n'est pas 'null' (chargement terminé)
  useEffect(() => {
        if (authed === false) {
            // Utiliser la méthode de redirection de Next.js si possible (useRouter),
            // mais window.location.href fonctionne aussi pour un composant client.
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
    }, [authed]); // Déclencher l'effet uniquement lorsque 'authed' change de valeur.

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  if (authed === null) {
        // 🚨 AJOUT: Afficher un état de chargement initial pendant la vérification
        return <div className="p-10 text-center">Vérification de l'accès...</div>
    }

  async function send(question: string) {
    const q = question.trim();
    if (!q || !authed) return; // Ne pas envoyer si pas authentifié
    
    // Correction de l'UUID pour la compatibilité (bien que crypto soit global dans les navigateurs modernes)
    const newMsgId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

    const msg: Message = { id: newMsgId, role: "user", text: q };
    setMessages((m) => [...m, msg]);
    setInput("");
    setLoading(true);

    try {
        const res = await fetch("/api/chat", {
           method: "POST",
           headers: { 
             "Content-Type": "application/json"
         },
           body: JSON.stringify({ question: q }),
         });
        if (res.status === 401) {
          setAuthed(false);
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        const data = await res.json();
      const text = data?.answer || "Je n’ai pas encore la réponse à cette question.";
      const assistantMsgId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
      
      setMessages((m) => [...m, { id: assistantMsgId, role: "assistant", text }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: Math.random().toString(36).substring(2, 9), role: "assistant", text: "Erreur de connexion à l’API." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSend) send(input);
  }

  function newChat() {
    setMessages([]);
    setInput("");
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error("Erreur de déconnexion:", e);
    }
  }

  async function toggleHistory() {
    if (!showHistory) {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        setHistory(data.logs || []);
      } catch {}
    }
    setShowHistory((v) => !v);
  }

  return (
    <div className="page-container min-h-[calc(100vh-56px)] flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-black/[.06] flex flex-col h-[78vh] sm:h-[80vh]">
        <header className="flex items-center justify-between p-4 sm:p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h1 className="text-lg font-semibold" style={{ color: "var(--brand-700)" }}>Assistant Campus</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="text-sm btn btn-ghost"
            >
              Nouveau chat
            </button>
            <button
              onClick={toggleHistory}
              className="text-sm btn btn-ghost"
            >
              Historique
            </button>
            <button
              onClick={logout}
              className="text-sm btn btn-ghost"
              style={{ color: "var(--brand-600)" }}
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div ref={listRef} className="flex-1 overflow-auto p-4 sm:p-5 space-y-3 bg-[#fafafa]">
          {/* 🚨 AJOUT: Message d'erreur si non authentifié */}
           {authed === false && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
                    Accès non autorisé. Redirection vers la page de connexion...
                </div>
            )}
          {showHistory && (
            <div className="bg-white border rounded-xl p-3 text-sm space-y-2" style={{ borderColor: "var(--border)" }}>
              <div className="font-semibold" style={{ color: "var(--brand-700)" }}>Dernières interactions</div>
              {history.length === 0 ? (
                <div className="text-[#666]">Aucune interaction enregistrée.</div>
              ) : (
                <ul className="space-y-1 max-h-40 overflow-auto">
                  {history.map(h => (
                    <li key={h.id} className="flex items-center justify-between border-b last:border-0 py-1" style={{ borderColor: "var(--border)" }}>
                      <span className="truncate pr-3">{h.question}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${h.matched ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{h.matched ? 'trouvée' : 'inconnue'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {messages.length === 0 && authed !== false && ( // N'affiche pas le message si on redirige
            <div className="text-sm text-[#666]">Pose une question sur le campus.</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  "inline-block px-3.5 py-2.5 rounded-2xl max-w-[85%] " +
                  (m.role === "user"
                    ? "bg-[#0a0a0a] text-white shadow-sm"
                    : "bg-white border border-black/[.06] shadow-sm")
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-5 border-t border-black/[.06] space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta question..."
              className="flex-1 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 bg-white"
              style={{ border: "1px solid var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.04) inset" }}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="btn btn-primary rounded-xl"
            >
              {loading ? "Envoi..." : "Envoyer"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="text-xs badge cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
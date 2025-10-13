"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type Message = { id: string; role: "user" | "assistant"; text: string };
type ChatHistory = {
  chatId: string;
  startedAt: string;
  messages: Message[];
};

const SUGGESTIONS: string[] = [];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [faq, setFaq] = useState<{ question: string; reponse: string }[]>([]);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(uuidv4());

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/auth/status", {
          method: "GET",
          credentials: "include",
        });
        setAuthed(res.ok);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  // Charger les questions FAQ pour suggestions dès qu'on est authentifié
  useEffect(() => {
    (async () => {
      if (authed !== true) return;
      try {
        const res = await fetch("http://localhost:3000/api/faq", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setFaq(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Erreur de chargement FAQ:", e);
      }
    })();
  }, [authed]);

  useEffect(() => {
    if (authed === false && typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, [authed]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  if (authed === null) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || !authed) return;

    const msg: Message = { id: uuidv4(), role: "user", text: q };
    setMessages((m) => [...m, msg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: q, chatId: currentChatId }),
      });
      if (res.status === 401) {
        setAuthed(false);
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      const data = await res.json();
      const text =
        data?.answer || "Je n'ai pas encore la réponse à cette question.";
      setMessages((m) => [...m, { id: uuidv4(), role: "assistant", text }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: uuidv4(),
          role: "assistant",
          text: "Erreur de connexion à l'API.",
        },
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
    setCurrentChatId(uuidv4());
  }

  async function logout() {
    try {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.href = "/login";
    } catch (e) {
      console.error("Erreur de déconnexion:", e);
    }
  }

  async function toggleHistory() {
    if (!showHistory) {
      try {
        const res = await fetch("http://localhost:3000/api/history", {
          credentials: "include"
        });
        const data = await res.json();

        // On suppose que l'API renvoie des conversations complètes
        // Exemple: [{ chatId, startedAt, messages: [...] }, ...]
        setHistory(data.chats || []);
      } catch (e) {
        console.error("Erreur chargement historique:", e);
      }
    }
    setShowHistory((v) => !v);
  }

  function loadChat(chat: ChatHistory) {
    setMessages(chat.messages || []);
    setCurrentChatId(chat.chatId);
    setShowHistory(false); // refermer le drawer
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-0 lg:p-6"
      style={{
        background: "linear-gradient(to bottom right, #f9fafb, #e5e7eb)",
      }}
    >
      <div className="w-full lg:max-w-3xl bg-white rounded-none lg:rounded-2xl shadow-none lg:shadow-xl border-0 lg:border border-gray-200 flex flex-col h-[100vh] lg:h-[80vh] relative">
        {/* Header */}
        <header
          className="flex items-center justify-between p-4 sm:p-5"
          style={{ background: "linear-gradient(to right, #2563eb, #1e3a8a)" }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">ESIC</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">
                Assistant Campus
              </h1>
              <p className="text-blue-100 text-xs">
                Votre guide pour l'ESIC
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleHistory}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Historique"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={newChat}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Nouvelle conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Bienvenue sur l'Assistant Campus ESIC
              </h2>
              <p className="text-gray-500 mb-6">
                Posez-moi vos questions sur l'école, les horaires, les services...
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {(faq.length > 0 ? faq : []).map((f) => (
                  <button
                    key={f.question}
                    onClick={() => send(f.question)}
                    className="p-3 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-left"
                  >
                    {f.question}
                  </button>
                ))}

              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={onSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Envoyer
            </button>
          </form>
        </div>

        {/* History Drawer */}
        {showHistory && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center">
            <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:max-w-md max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Historique</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun historique disponible</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((chat) => {
                      // Trouver la première question (user) et la première réponse (assistant)
                      const firstUserMessage = chat.messages.find(msg => msg.role === 'user');
                      const firstAssistantMessage = chat.messages.find(msg => msg.role === 'assistant');

                      return (
                        <button
                          key={chat.chatId}
                          onClick={() => loadChat(chat)}
                          className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="space-y-2">
                            {/* Question */}
                            {firstUserMessage && (
                              <div className="text-sm">
                                <span className="font-medium text-blue-600">Q:</span>
                                <span className="ml-1 text-gray-900">
                                  {firstUserMessage.text.length > 80
                                    ? firstUserMessage.text.substring(0, 80) + "..."
                                    : firstUserMessage.text}
                                </span>
                              </div>
                            )}

                            {/* Réponse */}
                            {firstAssistantMessage && (
                              <div className="text-sm">
                                <span className="font-medium text-green-600">R:</span>
                                <span className="ml-1 text-gray-700">
                                  {firstAssistantMessage.text.length > 80
                                    ? firstAssistantMessage.text.substring(0, 80) + "..."
                                    : firstAssistantMessage.text}
                                </span>
                              </div>
                            )}

                            {/* Si pas de messages, afficher un message par défaut */}
                            {!firstUserMessage && !firstAssistantMessage && (
                              <div className="text-sm text-gray-500 italic">
                                Conversation vide
                              </div>
                            )}
                          </div>

                          {/* Date */}
                          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            {new Date(chat.startedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
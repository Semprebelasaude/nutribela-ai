"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

export default function ChatPage() {
  const [msgs, setMsgs] = useState<{ papel: "user" | "bot"; texto: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function enviar() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMsgs(prev => [...prev, { papel: "user", texto: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: msg }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { papel: "bot", texto: data.resposta || "Erro ao responder." }]);
    } catch {
      setMsgs(prev => [...prev, { papel: "bot", texto: "Erro de conexão. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--fundo)" }}>
      {/* HEADER */}
      <header className="page-header" style={{ paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MessageCircle size={22} color="white" />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>
            Chat Nutribela
          </h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: "6px 0 0" }}>
          Pergunte sobre receitas, nutrição e culinária
        </p>
      </header>

      {/* MENSAGENS */}
      <div
        className="container-app"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingTop: 20,
          paddingBottom: 100,
          overflowY: "auto",
        }}
      >
        {/* Mensagem de boas-vindas */}
        {msgs.length === 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 18px",
              alignSelf: "flex-start",
              maxWidth: "85%",
              boxShadow: "0 1px 4px rgba(26,26,46,0.06)",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: "var(--texto)", lineHeight: 1.6 }}>
              Olá! Posso te ajudar com receitas do nosso acervo ou dúvidas de culinária e nutrição. Como posso ajudar?
            </p>
          </div>
        )}

        {msgs.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.papel === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: msg.papel === "user" ? "var(--azul)" : "white",
              borderRadius: msg.papel === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 16px",
              boxShadow: "0 1px 4px rgba(26,26,46,0.08)",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: msg.papel === "user" ? "white" : "var(--texto)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {msg.texto}
            </p>
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "white",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 18px",
              boxShadow: "0 1px 4px rgba(26,26,46,0.08)",
            }}
          >
            <div style={{ display: "flex", gap: 5 }}>
              {[0, 1, 2].map(n => (
                <div key={n} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--azul)",
                  animation: `pulse-soft 1.5s ease ${n * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* INPUT FIXO */}
      <div
        style={{
          position: "fixed",
          bottom: 64,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid var(--borda)",
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="container-app" style={{ display: "flex", gap: 10, padding: 0 }}>
          <input
            type="text"
            className="input-nutri"
            placeholder="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } }}
            disabled={loading}
            style={{ flex: 1, margin: 0 }}
          />
          <button
            onClick={enviar}
            disabled={loading || !input.trim()}
            style={{
              background: "var(--azul)",
              border: "none",
              borderRadius: 12,
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={20} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

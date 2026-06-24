"use client";

import { useEffect, useState } from "react";
import { ChefHat, CalendarDays, ShoppingCart, Heart, ArrowRight, Sun, Sparkles } from "lucide-react";
import LoadingCards from "@/components/LoadingCards";
import type { ReceitaEnriquecida } from "@/lib/types";

function getSaudacao(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

function getSaudacaoIcone(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "🌅";
  if (hora >= 12 && hora < 18) return "☀️";
  return "🌙";
}

const MODULOS_POPULARES = [
  "Low Carb",
  "Fitness",
  "Ovos",
  "Emagrecer",
  "Airfryer",
  "Bolos",
];

const ATALHOS = [
  {
    label: "O que tenho em casa?",
    href: "/agente",
    icon: ChefHat,
    bg: "var(--coral)",
    shadow: "rgba(232,76,61,0.35)",
  },
  {
    label: "Cardápio da semana",
    href: "/planejador",
    icon: CalendarDays,
    bg: "var(--verde)",
    shadow: "rgba(39,174,96,0.35)",
  },
  {
    label: "Lista de compras",
    href: "/lista",
    icon: ShoppingCart,
    bg: "#F39C12",
    shadow: "rgba(243,156,18,0.35)",
  },
  {
    label: "Meus favoritos",
    href: "/favoritos",
    icon: Heart,
    bg: "#E91E8C",
    shadow: "rgba(233,30,140,0.35)",
  },
];

const FALLBACK_IMG =
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800&auto=compress";

export default function HomePage() {
  const [receitaDia, setReceitaDia] = useState<ReceitaEnriquecida | null>(null);
  const [loadingReceita, setLoadingReceita] = useState(true);

  useEffect(() => {
    fetch("/api/receitas?aleatorio=1")
      .then((r) => r.json())
      .then((data: ReceitaEnriquecida) => {
        if (data?.id) setReceitaDia(data);
      })
      .catch(() => null)
      .finally(() => setLoadingReceita(false));
  }, []);

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 80, background: "var(--fundo)" }}>
      {/* HEADER GRADIENTE */}
      <header
        className="page-header"
        style={{ paddingBottom: 40 }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "rgba(255,255,255,0.25)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2C8 2 5 6 5 10c0 3 1.5 5.5 4 7v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3c2.5-1.5 4-4 4-7 0-4-3-8-7-8z"
                fill="white"
                opacity="0.9"
              />
              <path d="M9 22h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>
            Nutribela AI
          </span>
        </div>

        {/* Saudação */}
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 24, margin: "0 0 6px", lineHeight: 1.3 }}>
          {getSaudacao()}, {getSaudacaoIcone()}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 15, margin: 0 }}>
          O que vamos preparar hoje?
        </p>
      </header>

      <div className="container-app" style={{ marginTop: -20 }}>

        {/* RECEITA DO DIA */}
        <section style={{ marginBottom: 28 }}>
          {loadingReceita ? (
            <LoadingCards count={1} />
          ) : receitaDia ? (
            <div
              className="card"
              style={{ overflow: "hidden", cursor: "pointer", position: "relative" }}
              onClick={() => { window.location.href = `/receita/${receitaDia.id}`; }}
            >
              {/* Label receita do dia */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  zIndex: 2,
                  background: "rgba(232,76,61,0.92)",
                  color: "white",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Sun size={13} />
                Receita do dia
              </div>

              {/* Imagem */}
              <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                <img
                  src={receitaDia.imagem_url || FALLBACK_IMG}
                  alt={receitaDia.nome}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  loading="eager"
                />
                {/* Gradiente overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
                  }}
                />
                {/* Nome sobre imagem */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 14,
                    right: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.8)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {receitaDia.modulo}
                  </span>
                  <h2
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: 800,
                      margin: "2px 0 0",
                      lineHeight: 1.3,
                      textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {receitaDia.nome}
                  </h2>
                </div>
              </div>

              {/* Botão */}
              <div style={{ padding: "14px 14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={15} color="var(--coral)" />
                  <span style={{ fontSize: 13, color: "var(--texto-suave)", fontWeight: 500 }}>
                    Sugestão personalizada
                  </span>
                </div>
                <button
                  className="btn-coral"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/receita/${receitaDia.id}`;
                  }}
                >
                  Ver receita <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{ padding: 24, textAlign: "center" }}
            >
              <p style={{ color: "var(--texto-suave)", fontSize: 14, margin: 0 }}>
                Não foi possível carregar a receita do dia.
              </p>
            </div>
          )}
        </section>

        {/* ATALHOS RÁPIDOS */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--texto)", margin: "0 0 14px" }}>
            Acesso rápido
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {ATALHOS.map(({ label, href, icon: Icon, bg, shadow }) => (
              <a
                key={href}
                href={href}
                style={{
                  textDecoration: "none",
                  background: bg,
                  borderRadius: 16,
                  padding: "18px 14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: `0 6px 18px ${shadow}`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                }}
              >
                <Icon size={28} color="white" strokeWidth={1.8} />
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <span
                    style={{
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      maxWidth: "80%",
                    }}
                  >
                    {label}
                  </span>
                  <ArrowRight size={16} color="rgba(255,255,255,0.75)" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* MÓDULOS POPULARES */}
        <section style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--texto)", margin: "0 0 12px" }}>
            Explorar módulos
          </h2>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
              paddingBottom: 4,
            }}
          >
            {MODULOS_POPULARES.map((modulo) => (
              <a
                key={modulo}
                href={`/agente?modulo=${encodeURIComponent(modulo)}`}
                className="chip chip-outline"
                style={{ textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {modulo}
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChefHat, CalendarDays, ShoppingCart, Heart, ArrowRight, Sun, Sparkles } from "lucide-react";
import LoadingCards from "@/components/LoadingCards";
import type { ReceitaEnriquecida } from "@/lib/types";

// ← Fácil de trocar: apenas mude esta constante
const IMAGEM_PRINCIPAL = "https://i.postimg.cc/jjq09f2g/Generatedimage-1782317067701.webp";

const ATALHOS = [
  { label: "O que tenho em casa?", href: "/agente",    icon: ChefHat,      bg: "var(--azul)",   shadow: "rgba(46,134,193,0.35)" },
  { label: "Cardápio da semana",   href: "/planejador", icon: CalendarDays, bg: "var(--verde)",  shadow: "rgba(39,174,96,0.35)"  },
  { label: "Lista de compras",     href: "/lista",      icon: ShoppingCart, bg: "#F39C12",       shadow: "rgba(243,156,18,0.35)" },
  { label: "Meus favoritos",       href: "/favoritos",  icon: Heart,        bg: "#E91E8C",       shadow: "rgba(233,30,140,0.35)" },
];

export default function HomePage() {
  const [receitaDia, setReceitaDia] = useState<ReceitaEnriquecida | null>(null);
  const [loadingReceita, setLoadingReceita] = useState(true);

  useEffect(() => {
    fetch("/api/receitas?aleatorio=1")
      .then((r) => r.json())
      .then((data: ReceitaEnriquecida) => { if (data?.id) setReceitaDia(data); })
      .catch(() => null)
      .finally(() => setLoadingReceita(false));
  }, []);

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 80, background: "var(--fundo)" }}>

      {/* IMAGEM PRINCIPAL — sem texto por cima */}
      <div style={{ width: "100%", background: "#1A2744" }}>
        <img
          src={IMAGEM_PRINCIPAL}
          alt="Nutribela AI"
          style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover", objectPosition: "center" }}
          loading="eager"
        />
      </div>

      <div className="container-app" style={{ paddingTop: 24 }}>

        {/* RECEITA DO DIA — só texto */}
        <section style={{ marginBottom: 28 }}>
          {loadingReceita ? (
            <LoadingCards count={1} />
          ) : receitaDia ? (
            <div
              className="card"
              style={{ padding: "16px 18px", cursor: "pointer" }}
              onClick={() => { window.location.href = `/receita/${receitaDia.id}`; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Sun size={14} color="var(--azul)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--azul)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Receita do dia
                </span>
              </div>
              <span
                style={{ fontSize: 11, fontWeight: 600, color: "var(--texto-suave)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}
              >
                {receitaDia.modulo}
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--texto)", margin: "0 0 14px", lineHeight: 1.35 }}>
                {receitaDia.nome}
              </h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color="var(--texto-suave)" />
                  <span style={{ fontSize: 12, color: "var(--texto-suave)", fontWeight: 500 }}>Sugestão personalizada</span>
                </div>
                <button
                  className="btn-coral"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/receita/${receitaDia.id}`; }}
                >
                  Ver receita <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p style={{ color: "var(--texto-suave)", fontSize: 14, margin: 0 }}>
                Não foi possível carregar a receita do dia.
              </p>
            </div>
          )}
        </section>

        {/* ACESSO RÁPIDO */}
        <section style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--texto)", margin: "0 0 14px" }}>
            Acesso rápido
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                }}
              >
                <Icon size={28} color="white" strokeWidth={1.8} />
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <span style={{ color: "white", fontSize: 13, fontWeight: 700, lineHeight: 1.3, maxWidth: "80%" }}>
                    {label}
                  </span>
                  <ArrowRight size={16} color="rgba(255,255,255,0.75)" />
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

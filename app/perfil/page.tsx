"use client";

import { useEffect, useState } from "react";
import { User, Check, Utensils } from "lucide-react";
import { getPerfil, setPerfil } from "@/lib/storage";
import { PerfilUsuaria } from "@/lib/types";

const OBJETIVOS: {
  key: PerfilUsuaria["objetivo"];
  label: string;
  emoji: string;
}[] = [
  { key: "emagrecer",    label: "Emagrecer",      emoji: "🏃‍♀️" },
  { key: "ganho_massa",  label: "Ganho de Massa",  emoji: "💪" },
  { key: "low_carb",     label: "Low Carb",        emoji: "🥗" },
  { key: "diabetico",    label: "Diabético",       emoji: "💚" },
  { key: "desinchar",    label: "Desinchar",       emoji: "💧" },
  { key: "geral",        label: "Geral",           emoji: "🍽️" },
];

const RESTRICOES_OPCOES = [
  "Sem Glúten",
  "Sem Lactose",
  "Sem Açúcar",
  "Vegano",
  "Vegetariano",
  "Sem Frutos do Mar",
];

export default function PerfilPage() {
  const [perfil, setPerfilState] = useState<PerfilUsuaria>({ objetivo: "geral", restricoes: [] });
  const [nome, setNome] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const p = getPerfil();
    setPerfilState(p);
    setNome(p.nome || "");
  }, []);

  const setObjetivo = (objetivo: PerfilUsuaria["objetivo"]) => {
    setPerfilState((prev) => ({ ...prev, objetivo }));
  };

  const toggleRestricao = (restricao: string) => {
    setPerfilState((prev) => {
      const atual = prev.restricoes || [];
      const existe = atual.includes(restricao);
      return {
        ...prev,
        restricoes: existe
          ? atual.filter((r) => r !== restricao)
          : [...atual, restricao],
      };
    });
  };

  const salvarPerfil = () => {
    const novoP: PerfilUsuaria = { ...perfil, nome: nome.trim() || undefined };
    setPerfil(novoP);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  const inicial = nome.trim() ? nome.trim()[0].toUpperCase() : null;

  return (
    <div>
      {/* Header com avatar */}
      <header className="page-header">
        <div className="container-app">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Avatar */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                border: "3px solid rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                backdropFilter: "blur(4px)",
              }}
            >
              {inicial ? (
                <span style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{inicial}</span>
              ) : (
                <User size={28} color="white" strokeWidth={1.8} />
              )}
            </div>

            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "0 0 2px", fontWeight: 600 }}>
                Bem-vinda de volta!
              </p>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>
                {nome.trim() || "Meu Perfil"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app" style={{ paddingTop: 24 }}>

        {/* Objetivo principal */}
        <section style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--texto-suave)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 12,
            }}
          >
            Meu Objetivo
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {OBJETIVOS.map(({ key, label, emoji }) => {
              const ativo = perfil.objetivo === key;
              return (
                <button
                  key={key}
                  onClick={() => setObjetivo(key)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 10px",
                    borderRadius: 14,
                    border: `2px solid ${ativo ? "var(--coral)" : "#E8E0DD"}`,
                    background: ativo ? "#FFF0EE" : "white",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: ativo ? "0 2px 8px rgba(232,76,61,0.15)" : "none",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{emoji}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: ativo ? "var(--coral-dark)" : "var(--texto-suave)",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Restrições alimentares */}
        <section style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--texto-suave)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 12,
            }}
          >
            Restrições Alimentares
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {RESTRICOES_OPCOES.map((restricao) => {
              const ativa = perfil.restricoes?.includes(restricao);
              return (
                <button
                  key={restricao}
                  onClick={() => toggleRestricao(restricao)}
                  className={ativa ? "chip chip-active" : "chip chip-outline"}
                >
                  {ativa && <Check size={13} strokeWidth={2.5} />}
                  {restricao}
                </button>
              );
            })}
          </div>
        </section>

        {/* Nome */}
        <section style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--texto-suave)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 10,
            }}
          >
            Como posso te chamar?
          </h2>
          <input
            className="input-nutri"
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={50}
          />
        </section>

        {/* Salvar */}
        <button
          className="btn-coral"
          style={{ width: "100%", justifyContent: "center", marginBottom: 28 }}
          onClick={salvarPerfil}
        >
          {salvo ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              Perfil salvo!
            </>
          ) : (
            "Salvar Perfil"
          )}
        </button>

        {/* Sobre */}
        <section
          style={{
            background: "white",
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(26,26,46,0.06)",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Utensils size={18} color="var(--coral)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--texto)" }}>
              Nutribela AI v1.0
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--texto-suave)", margin: "0 0 10px", lineHeight: 1.5 }}>
            Receitas reais da Nutri Bela, com inteligência artificial
          </p>
          <button
            onClick={() => { window.location.href = "/agente"; }}
            style={{
              background: "none",
              border: "none",
              color: "var(--coral)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            891 receitas disponíveis
          </button>
        </section>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import ObjetivoChips from "@/components/ObjetivoChips";
import PortionAdjuster from "@/components/PortionAdjuster";
import LoadingCards from "@/components/LoadingCards";
import ReceitaCard from "@/components/ReceitaCard";
import { addFavorito, removeFavorito, isFavorito } from "@/lib/storage";
import type { ReceitaEnriquecida } from "@/lib/types";

const SUGESTOES_RAPIDAS = [
  "Frango + brócolis",
  "Ovos + queijo",
  "Low carb rápido",
  "Atum + legumes",
  "Batata-doce + frango",
];

export default function AgentePage() {
  const [texto, setTexto] = useState("");
  const [objetivo, setObjetivo] = useState("geral");
  const [porcoes, setPorcoes] = useState(2);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ receitas: ReceitaEnriquecida[]; dica?: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});

  // lê módulo da query se vier da Home
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modulo = params.get("modulo");
      if (modulo) {
        setTexto(modulo);
      }
    }
  }, []);

  async function buscar(textoBusca: string = texto) {
    if (!textoBusca.trim()) return;
    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      // Etapa 1: buscar receitas filtradas
      const params = new URLSearchParams({ q: textoBusca, objetivo, limit: "8" });
      const resReceitas = await fetch(`/api/receitas?${params.toString()}`);
      if (!resReceitas.ok) throw new Error("Falha ao buscar receitas");
      const dadosReceitas = await resReceitas.json();
      const receitasBrutas: ReceitaEnriquecida[] = Array.isArray(dadosReceitas)
        ? dadosReceitas
        : dadosReceitas.receitas ?? [];

      if (receitasBrutas.length === 0) {
        setResultado({ receitas: [] });
        return;
      }

      // Etapa 2: enriquecer com Gemini
      try {
        const resGemini = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receitas: receitasBrutas, pedido: textoBusca, porcoes }),
        });

        if (resGemini.ok) {
          const dadosGemini = await resGemini.json();
          const receitasEnriquecidas: ReceitaEnriquecida[] = dadosGemini.receitas ?? receitasBrutas;
          const dica: string | undefined = dadosGemini.dica;
          setResultado({ receitas: receitasEnriquecidas, dica });

          // inicializar mapa de favoritos
          const mapa: Record<string, boolean> = {};
          receitasEnriquecidas.forEach((r) => { mapa[r.id] = isFavorito(r.id); });
          setFavMap(mapa);
        } else {
          // fallback: mostrar receitas brutas sem macros
          setResultado({ receitas: receitasBrutas });
          const mapa: Record<string, boolean> = {};
          receitasBrutas.forEach((r) => { mapa[r.id] = isFavorito(r.id); });
          setFavMap(mapa);
        }
      } catch {
        // fallback gracioso
        setResultado({ receitas: receitasBrutas });
        const mapa: Record<string, boolean> = {};
        receitasBrutas.forEach((r) => { mapa[r.id] = isFavorito(r.id); });
        setFavMap(mapa);
      }
    } catch {
      setErro("Não consegui buscar receitas agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function toggleFav(receita: ReceitaEnriquecida) {
    if (isFavorito(receita.id)) {
      removeFavorito(receita.id);
      setFavMap((prev) => ({ ...prev, [receita.id]: false }));
    } else {
      addFavorito(receita);
      setFavMap((prev) => ({ ...prev, [receita.id]: true }));
    }
  }

  function usarSugestao(sugestao: string) {
    setTexto(sugestao);
    buscar(sugestao);
  }

  const temResultado = resultado !== null && resultado.receitas.length > 0;
  const semReceitas = resultado !== null && resultado.receitas.length === 0;

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 80, background: "var(--fundo)" }}>
      {/* HEADER */}
      <header className="page-header">
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          ← Início
        </a>
        <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>
          Agente Nutribela
        </h1>
        <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, margin: 0 }}>
          Diga o que tem em casa
        </p>
      </header>

      <div className="container-app" style={{ marginTop: -16 }}>

        {/* FORMULÁRIO */}
        <section className="card" style={{ padding: 20, marginBottom: 20 }}>
          {/* Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="ingredientes-input"
              style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--texto)", marginBottom: 8 }}
            >
              Ingredientes ou pedido
            </label>
            <textarea
              id="ingredientes-input"
              className="input-nutri"
              rows={3}
              placeholder="Ex: tenho frango, brócolis e batata-doce..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) buscar();
              }}
              style={{ resize: "none" }}
            />
          </div>

          {/* Objetivo */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--texto)", margin: "0 0 8px" }}>
              Objetivo
            </p>
            <ObjetivoChips value={objetivo} onChange={setObjetivo} />
          </div>

          {/* Porções */}
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--texto)" }}>Porções</span>
            <PortionAdjuster value={porcoes} onChange={setPorcoes} />
          </div>

          {/* Botão buscar */}
          <button
            className="btn-coral"
            style={{ width: "100%", justifyContent: "center", fontSize: 16 }}
            onClick={() => buscar()}
            disabled={loading || !texto.trim()}
          >
            {loading ? (
              <>
                <span className="loader" />
                Buscando receitas...
              </>
            ) : (
              "Encontrar Receitas"
            )}
          </button>
        </section>

        {/* ERRO */}
        {erro && (
          <div
            style={{
              background: "#FDECEA",
              border: "1px solid #FBBCB8",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 20,
              color: "var(--coral-dark)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {erro}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <LoadingCards count={3} />
          </div>
        )}

        {/* DICA DO GEMINI */}
        {!loading && resultado?.dica && (
          <div
            style={{
              background: "#E8F8EF",
              border: "1px solid #B7EFCE",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 16,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1.2, flexShrink: 0 }}>🌿</span>
            <p style={{ margin: 0, fontSize: 14, color: "#1A5C36", lineHeight: 1.5, fontWeight: 500 }}>
              {resultado.dica}
            </p>
          </div>
        )}

        {/* RESULTADO — RECEITAS */}
        {!loading && temResultado && (
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "var(--texto-suave)", margin: "0 0 4px", fontWeight: 500 }}>
              {resultado!.receitas.length} receita{resultado!.receitas.length !== 1 ? "s" : ""} encontrada{resultado!.receitas.length !== 1 ? "s" : ""}
            </p>
            {resultado!.receitas.map((receita, idx) => (
              <div
                key={receita.id}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <ReceitaCard
                  receita={receita}
                  onClick={() => { window.location.href = `/receita/${receita.id}`; }}
                  onFavoritar={() => toggleFav(receita)}
                  favorito={favMap[receita.id] ?? false}
                />
              </div>
            ))}
          </section>
        )}

        {/* SEM RECEITAS */}
        {!loading && semReceitas && (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "var(--texto)", margin: "0 0 6px" }}>
              Nenhuma receita encontrada
            </p>
            <p style={{ fontSize: 14, color: "var(--texto-suave)", margin: "0 0 20px" }}>
              Tente outros ingredientes ou mude o objetivo
            </p>
          </div>
        )}

        {/* ESTADO VAZIO — antes de buscar */}
        {!loading && resultado === null && !erro && (
          <section style={{ textAlign: "center", padding: "28px 0 0" }}>
            <div style={{ fontSize: 56, marginBottom: 14, lineHeight: 1 }}>🍽️</div>
            <p
              style={{
                fontSize: 15,
                color: "var(--texto-suave)",
                margin: "0 0 24px",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Me conta o que você tem e eu encontro as melhores receitas!
            </p>
            {/* Sugestões rápidas */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {SUGESTOES_RAPIDAS.map((s) => (
                <button
                  key={s}
                  className="chip chip-outline"
                  onClick={() => usarSugestao(s)}
                  style={{ fontSize: 13 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

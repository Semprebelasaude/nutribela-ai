"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortionAdjuster from "@/components/PortionAdjuster";
import LoadingCards from "@/components/LoadingCards";
import ReceitaCard from "@/components/ReceitaCard";
import { addFavorito, removeFavorito, isFavorito } from "@/lib/storage";
import type { ReceitaEnriquecida } from "@/lib/types";

/* ─── Normaliza: lowercase + sem acentos ─── */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function AgentePage() {
  /* ─── Estado geral ─── */
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ receitas: ReceitaEnriquecida[]; dica?: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  const [porcoes, setPorções] = useState(2);
  const [objetivo, setObjetivo] = useState("geral");

  /* ─── Modo ingredientes ─── */
  const [linhas, setLinhas] = useState<string[]>([""]);
  const [autocompleteList, setAutocompleteList] = useState<string[]>([]);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Carregar autocomplete ao montar ─── */
  useEffect(() => {
    fetch("/api/ingredientes-autocomplete")
      .then((r) => r.json())
      .then((data: string[]) => setAutocompleteList(data))
      .catch(() => {});
  }, []);

  /* ─── Ler modulo da query string ─── */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modulo = params.get("modulo");
      if (modulo) {
        setLinhas([modulo]);
      }
    }
  }, []);

  /* ─── Autocomplete filter: prefixo, sem acentos, min 2 chars ─── */
  const filtrarSugestoes = useCallback(
    (texto: string) => {
      if (texto.trim().length < 2 || autocompleteList.length === 0) {
        setSugestoes([]);
        return;
      }
      const q = normalizar(texto.trim());
      const matches = autocompleteList.filter((item) =>
        normalizar(item).startsWith(q)
      );
      setSugestoes(matches.slice(0, 6));
    },
    [autocompleteList]
  );

  /* ─── Ingredientes: manipulacao de linhas ─── */
  function updateLinha(idx: number, valor: string) {
    const novas = [...linhas];
    novas[idx] = valor;
    setLinhas(novas);
    setActiveLineIdx(idx);
    filtrarSugestoes(valor);
  }

  function selecionarSugestao(idx: number, valor: string) {
    const novas = [...linhas];
    novas[idx] = valor;
    // Adicionar proxima linha se nao existe e nao atingiu max
    if (idx === novas.length - 1 && novas.length < 10) {
      novas.push("");
    }
    setLinhas(novas);
    setSugestoes([]);
    setActiveLineIdx(null);
    // Focar na proxima linha
    setTimeout(() => {
      const nextRef = inputRefs.current[idx + 1];
      if (nextRef) nextRef.focus();
    }, 50);
  }

  function removerLinha(idx: number) {
    if (linhas.length === 1) {
      setLinhas([""]);
      return;
    }
    const novas = linhas.filter((_, i) => i !== idx);
    setLinhas(novas);
    setSugestoes([]);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (sugestoes.length > 0) {
        selecionarSugestao(idx, sugestoes[0]);
      } else if (linhas[idx].trim() && idx === linhas.length - 1 && linhas.length < 10) {
        setLinhas([...linhas, ""]);
        setTimeout(() => {
          const nextRef = inputRefs.current[idx + 1];
          if (nextRef) nextRef.focus();
        }, 50);
      }
    }
  }

  /* ─── Busca por ingredientes ─── */
  async function buscarPorIngredientes() {
    const ingredientesValidos = linhas.map((l) => l.trim()).filter(Boolean);
    if (ingredientesValidos.length === 0) return;
    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      const params = new URLSearchParams({
        q: ingredientesValidos.join(" "),
        objetivo,
        limit: "20",
      });
      const res = await fetch(`/api/receitas?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar receitas");
      const dados = await res.json();
      const receitas: ReceitaEnriquecida[] = Array.isArray(dados) ? dados : dados.receitas ?? [];
      setResultado({ receitas });
      const mapa: Record<string, boolean> = {};
      receitas.forEach((r) => { mapa[r.id] = isFavorito(r.id); });
      setFavMap(mapa);
    } catch {
      setErro("Não consegui buscar receitas agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Favoritos ─── */
  function toggleFav(receita: ReceitaEnriquecida) {
    if (isFavorito(receita.id)) {
      removeFavorito(receita.id);
      setFavMap((prev) => ({ ...prev, [receita.id]: false }));
    } else {
      addFavorito(receita);
      setFavMap((prev) => ({ ...prev, [receita.id]: true }));
    }
  }

  const temResultado = resultado !== null && resultado.receitas.length > 0;
  const semReceitas = resultado !== null && resultado.receitas.length === 0;
  const ingredientesPreenchidos = linhas.some((l) => l.trim().length > 0);

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
          &#8592; Início
        </a>
        <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>
          Agente Nutribela
        </h1>
        <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, margin: 0 }}>
          Encontre a receita perfeita
        </p>
      </header>

      <div className="container-app" style={{ marginTop: 16 }}>
        {/* FORMULARIO */}
        <section className="card" style={{ padding: 20, marginBottom: 20 }}>
          <label
            style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--texto)", marginBottom: 10 }}
          >
            Adicione seus ingredientes
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {linhas.map((linha, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    className="input-nutri"
                    placeholder={idx === 0 ? "Ex: frango" : "Outro ingrediente..."}
                    value={linha}
                    onChange={(e) => updateLinha(idx, e.target.value)}
                    onFocus={() => {
                      setActiveLineIdx(idx);
                      filtrarSugestoes(linha);
                    }}
                    onBlur={() => {
                      // Delay para permitir click na sugestao
                      setTimeout(() => {
                        setActiveLineIdx((curr) => (curr === idx ? null : curr));
                        setSugestoes([]);
                      }, 200);
                    }}
                    onKeyDown={(e) => handleInputKeyDown(e, idx)}
                    style={{ flex: 1, padding: "10px 14px", fontSize: 15 }}
                    autoComplete="off"
                  />
                  {(linhas.length > 1 || linha.trim()) && (
                    <button
                      onClick={() => removerLinha(idx)}
                      aria-label="Remover ingrediente"
                      style={{
                        width: 32,
                        height: 32,
                        border: "1.5px solid var(--borda)",
                        borderRadius: 8,
                        background: "white",
                        color: "var(--texto-suave)",
                        fontSize: 18,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "inherit",
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Dropdown autocomplete */}
                {activeLineIdx === idx && sugestoes.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 40,
                      background: "white",
                      border: "2px solid var(--borda)",
                      borderTop: "none",
                      borderRadius: "0 0 10px 10px",
                      zIndex: 50,
                      boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {sugestoes.map((sug) => (
                      <button
                        key={sug}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selecionarSugestao(idx, sug);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          borderBottom: "1px solid var(--borda)",
                          background: "white",
                          color: "var(--texto)",
                          fontSize: 14,
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Objetivo */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="objetivo-select"
              style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--texto)", marginBottom: 8 }}
            >
              Objetivo
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="objetivo-select"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 14px",
                  border: "2px solid var(--borda)",
                  borderRadius: 12,
                  fontSize: 15,
                  background: "white",
                  color: "var(--texto)",
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <option value="geral">Tudo</option>
                <option value="emagrecer">Emagrecer</option>
                <option value="low_carb">Low Carb</option>
                <option value="diabetico">Diabetico</option>
                <option value="ganho_massa">Ganho de Massa</option>
                <option value="desinchar">Desinchar</option>
              </select>
              <svg
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--texto-suave)" strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Porções */}
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--texto)" }}>Porções</span>
            <PortionAdjuster value={porcoes} onChange={setPorções} />
          </div>

          {/* Botao buscar */}
          <button
            className="btn-coral"
            style={{ width: "100%", justifyContent: "center", fontSize: 16 }}
            onClick={buscarPorIngredientes}
            disabled={loading || !ingredientesPreenchidos}
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

        {/* DICA */}
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
            <p
              style={{
                fontSize: 15,
                color: "var(--texto-suave)",
                margin: "0 0 24px",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Adicione os ingredientes que você tem em casa e encontro as melhores receitas!
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

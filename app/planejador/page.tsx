"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Plus, ShoppingCart, CalendarDays } from "lucide-react";
import {
  getCardapio,
  addCardapio,
  removeCardapio,
  setLista,
} from "@/lib/storage";
import { ItemCardapio, ItemLista, ReceitaEnriquecida } from "@/lib/types";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const REFEICOES: { key: ItemCardapio["refeicao"]; label: string }[] = [
  { key: "cafe",   label: "Café" },
  { key: "almoco", label: "Almoço" },
  { key: "jantar", label: "Jantar" },
  { key: "lanche", label: "Lanche" },
];

// Categorias simples por palavra-chave no ingrediente
const CATEGORIAS: { cat: string; palavras: string[] }[] = [
  { cat: "Laticínios",    palavras: ["leite", "queijo", "iogurte", "cream cheese", "manteiga", "creme de leite", "requeijão"] },
  { cat: "Proteínas",     palavras: ["frango", "carne", "peixe", "atum", "ovo", "ovos", "camarão", "carne moída", "filé", "bife", "presunto"] },
  { cat: "Grãos e Carbos", palavras: ["arroz", "macarrão", "pão", "farinha", "aveia", "milho", "batata", "mandioca", "inhame", "trigo", "tapioca"] },
  { cat: "Verduras e Legumes", palavras: ["alface", "tomate", "cenoura", "brócolis", "couve", "espinafre", "abobrinha", "berinjela", "beterraba", "pepino", "rúcula"] },
  { cat: "Frutas",        palavras: ["banana", "maçã", "abacate", "morango", "limão", "laranja", "mamão", "manga", "uva", "kiwi", "abacaxi"] },
  { cat: "Temperos",      palavras: ["alho", "cebola", "sal", "pimenta", "azeite", "orégano", "salsinha", "cebolinha", "cominho", "cúrcuma", "gengibre"] },
  { cat: "Óleos e Gorduras", palavras: ["óleo", "azeite", "manteiga", "banha"] },
];

function categorizarIngrediente(ingrediente: string): string {
  const lower = ingrediente.toLowerCase();
  for (const { cat, palavras } of CATEGORIAS) {
    if (palavras.some((p) => lower.includes(p))) return cat;
  }
  return "Outros";
}

function nomeCurto(nome: string): string {
  return nome.length > 28 ? nome.slice(0, 26) + "…" : nome;
}

export default function PlanejadorPage() {
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [receitasCache, setReceitasCache] = useState<Record<string, ReceitaEnriquecida>>({});
  const [loading, setLoading] = useState(true);
  const [gerandoLista, setGerandoLista] = useState(false);
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);
  const [adicionandoPorcoes, setAdicionandoPorcoes] = useState<number>(2);
  const [adicionandoReceita, setAdicionandoReceita] = useState<ReceitaEnriquecida | null>(null);

  const carregarCardapio = useCallback(async () => {
    const items = getCardapio();
    setCardapio(items);

    const ids = [...new Set(items.map((i) => i.receitaId))];
    if (ids.length === 0) { setLoading(false); return; }

    const cache: Record<string, ReceitaEnriquecida> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/receitas?id=${id}`);
          if (res.ok) cache[id] = await res.json();
        } catch { /* silencioso */ }
      })
    );
    setReceitasCache(cache);
    setLoading(false);
  }, []);

  useEffect(() => { carregarCardapio(); }, [carregarCardapio]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("adicionando");
    const p = parseInt(params.get("porcoes") || "2");
    if (id) {
      setAdicionandoId(id);
      setAdicionandoPorcoes(p);
      fetch(`/api/receitas?id=${id}`)
        .then(r => r.json())
        .then(data => { if (data?.id) setAdicionandoReceita(data); })
        .catch(() => {});
    }
  }, []);

  function adicionarNoSlot(dia: number, refeicao: ItemCardapio["refeicao"]) {
    if (!adicionandoId || !adicionandoReceita) return;
    const existente = getCell(dia, refeicao);
    if (existente) {
      const nomeExistente = receitasCache[existente.receitaId]?.nome || "outra receita";
      if (!window.confirm(`Já existe "${nomeExistente}" nesse horário. Substituir?`)) return;
      removeCardapio(existente.receitaId, dia, refeicao);
    }
    addCardapio({ receitaId: adicionandoId, dia, refeicao, porcoes: adicionandoPorcoes });
    setAdicionandoId(null);
    setAdicionandoReceita(null);
    carregarCardapio();
    window.history.back();
  }

  const handleRemover = (receitaId: string, dia: number, refeicao: string) => {
    removeCardapio(receitaId, dia, refeicao);
    setCardapio(getCardapio());
  };

  const getCell = (dia: number, refeicao: ItemCardapio["refeicao"]) =>
    cardapio.find((c) => c.dia === dia && c.refeicao === refeicao) || null;

  const caloriasTotal = cardapio.reduce((acc, item) => {
    const r = receitasCache[item.receitaId];
    return acc + (r?.calorias ? r.calorias * item.porcoes : 0);
  }, 0);

  const caloriasPorDia = (dia: number) =>
    cardapio
      .filter((c) => c.dia === dia)
      .reduce((acc, item) => {
        const r = receitasCache[item.receitaId];
        return acc + (r?.calorias ? r.calorias * item.porcoes : 0);
      }, 0);

  const gerarLista = () => {
    setGerandoLista(true);
    const todosIngredientes: string[] = [];
    for (const item of cardapio) {
      const r = receitasCache[item.receitaId];
      if (r?.ingredientes) todosIngredientes.push(...r.ingredientes);
    }

    // Deduplica (simplificado por lowercase)
    const vistos = new Set<string>();
    const unicos: string[] = [];
    for (const ing of todosIngredientes) {
      const key = ing.toLowerCase().trim();
      if (!vistos.has(key)) { vistos.add(key); unicos.push(ing.trim()); }
    }

    const itensLista: ItemLista[] = unicos.map((desc, i) => ({
      id: `lista-${Date.now()}-${i}`,
      descricao: desc,
      categoria: categorizarIngrediente(desc),
      marcado: false,
    }));

    setLista(itensLista);
    setGerandoLista(false);
    window.location.href = "/lista";
  };

  const diasComReceita = DIAS.map((_, i) => caloriasPorDia(i)).filter((c) => c > 0);

  return (
    <div>
      {/* Header */}
      <header className="page-header">
        <div className="container-app">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <CalendarDays size={22} color="white" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>
              Cardápio da Semana
            </h1>
          </div>
          {caloriasTotal > 0 && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0 }}>
              {Math.round(caloriasTotal)} kcal totais na semana
            </p>
          )}
          {caloriasTotal === 0 && !loading && (
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0 }}>
              Adicione receitas pelo Agente
            </p>
          )}
        </div>
      </header>

      {adicionandoReceita && (
        <div
          style={{
            background: "var(--verde)",
            color: "white",
            padding: "14px 16px",
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          Toque em um horário para adicionar:
          <br />
          <strong style={{ fontSize: 15 }}>{adicionandoReceita.nome}</strong>
          <button
            onClick={() => {
              setAdicionandoId(null);
              setAdicionandoReceita(null);
              window.history.replaceState({}, "", "/planejador");
            }}
            style={{ marginLeft: 12, background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 8, color: "white", padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
          >
            Cancelar
          </button>
        </div>
      )}


      <main className="container-app" style={{ paddingTop: 20 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--texto-suave)" }}>
            <div className="loader" style={{ borderTopColor: "var(--coral)", borderColor: "rgba(232,76,61,0.2)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14 }}>Carregando cardápio…</p>
          </div>
        ) : (
          <>
            {/* Grade semanal */}
            <section style={{ overflowX: "auto", marginBottom: 20 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px repeat(7, 1fr)",
                  gap: 3,
                  minWidth: 480,
                }}
              >
                {/* Cabeçalho dias */}
                <div />
                {DIAS.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--texto-suave)",
                      padding: "6px 2px",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    {d}
                  </div>
                ))}

                {/* Linhas de refeição */}
                {REFEICOES.map(({ key, label }) => (
                  <>
                    {/* Label da refeição */}
                    <div
                      key={`label-${key}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: 6,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "var(--texto-suave)",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        lineHeight: 1.2,
                        textAlign: "right",
                      }}
                    >
                      {label}
                    </div>

                    {/* Células dos 7 dias */}
                    {DIAS.map((_, diaIdx) => {
                      const item = getCell(diaIdx, key);
                      const receita = item ? receitasCache[item.receitaId] : null;

                      if (item && receita) {
                        return (
                          <div
                            key={`${key}-${diaIdx}`}
                            className="planner-cell planner-cell-filled"
                            style={{
                              position: "relative",
                              flexDirection: "column",
                              gap: 3,
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "5px 3px",
                              cursor: adicionandoReceita ? "pointer" : "default",
                              background: adicionandoReceita ? "#F0FFF7" : undefined,
                              outline: adicionandoReceita ? "2px solid var(--verde)" : undefined,
                              transition: "background 0.2s",
                            }}
                            onClick={adicionandoReceita ? () => adicionarNoSlot(diaIdx, key) : undefined}
                          >
                            <button
                              onClick={() => handleRemover(item.receitaId, diaIdx, key)}
                              aria-label="Remover"
                              style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                background: "rgba(192,57,43,0.12)",
                                border: "none",
                                borderRadius: "50%",
                                width: 14,
                                height: 14,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                                flexShrink: 0,
                              }}
                            >
                              <X size={8} color="var(--coral-dark)" strokeWidth={3} />
                            </button>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                lineHeight: 1.25,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textAlign: "center",
                                paddingTop: 10,
                              }}
                            >
                              {nomeCurto(receita.nome)}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${key}-${diaIdx}`}
                          className="planner-cell planner-cell-empty"
                          onClick={() => {
                            if (adicionandoReceita) {
                              adicionarNoSlot(diaIdx, key);
                            } else {
                              window.location.href = "/agente";
                            }
                          }}
                          title={adicionandoReceita ? "Adicionar aqui" : "Adicionar receita"}
                          style={{
                            cursor: "pointer",
                            background: adicionandoReceita ? "#F0FFF7" : undefined,
                            outline: adicionandoReceita ? "2px solid var(--verde)" : undefined,
                            transition: "background 0.2s",
                          }}
                        >
                          <Plus size={14} strokeWidth={2.5} color={adicionandoReceita ? "var(--verde)" : undefined} />
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </section>

            {/* Resumo de calorias por dia */}
            {diasComReceita.length > 0 && (
              <section style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--texto-suave)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Calorias por dia
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {DIAS.map((dia, i) => {
                    const cal = caloriasPorDia(i);
                    if (!cal) return null;
                    return (
                      <div key={dia} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--texto-suave)", textTransform: "uppercase" }}>{dia}</span>
                        <span className="badge badge-coral">{Math.round(cal)} kcal</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CTA: gerar lista */}
            {cardapio.length > 0 ? (
              <button
                className="btn-coral"
                style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
                onClick={gerarLista}
                disabled={gerandoLista}
              >
                <ShoppingCart size={18} />
                {gerandoLista ? "Gerando lista…" : "Gerar Lista de Compras"}
              </button>
            ) : (
              /* Estado vazio */
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "white",
                  borderRadius: 20,
                  boxShadow: "0 2px 8px rgba(26,26,46,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 16,
                    lineHeight: 1,
                  }}
                >
                  <CalendarDays size={56} color="var(--borda)" strokeWidth={1.5} style={{ margin: "0 auto" }} />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--texto)", marginBottom: 8 }}>
                  Cardápio vazio
                </h2>
                <p style={{ fontSize: 14, color: "var(--texto-suave)", marginBottom: 20, lineHeight: 1.5 }}>
                  Converse com o Agente e adicione receitas ao seu cardápio semanal
                </p>
                <button
                  className="btn-coral"
                  style={{ margin: "0 auto" }}
                  onClick={() => { window.location.href = "/agente"; }}
                >
                  <Plus size={18} />
                  Descobrir Receitas
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

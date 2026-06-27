"use client";

import { useEffect, useState } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import NutritionPanel from "@/components/NutritionPanel";
import PortionAdjuster from "@/components/PortionAdjuster";
import { addFavorito, removeFavorito, isFavorito, getLista, setLista } from "@/lib/storage";
import type { ReceitaEnriquecida, ItemLista } from "@/lib/types";

interface Props {
  id: string;
}

export default function ReceitaDetalhe({ id }: Props) {
  const [receita, setReceita] = useState<ReceitaEnriquecida | null>(null);
  const [porcoes, setPorcoes] = useState(2);
  const [favorito, setFavorito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbackLista, setFeedbackLista] = useState(false);

  // Busca inicial da receita
  useEffect(() => {
    fetch(`/api/receitas?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        // API retorna objeto único quando ?id= é passado
        const lista: ReceitaEnriquecida[] = Array.isArray(data)
          ? data
          : data.receitas
          ? data.receitas
          : data.id
          ? [data]
          : [];
        const encontrada = lista.find((r) => r.id === id) ?? lista[0] ?? null;
        if (encontrada) {
          setReceita(encontrada);
          setFavorito(isFavorito(encontrada.id));
          // Inicializar porções com base nas porções base da nutrição
          if (encontrada.nutricao?.porcoes_base) {
            setPorcoes(encontrada.nutricao.porcoes_base);
          }
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  // Recalcula ingredientes por código local (sem Gemini)
  function ingredientesParaExibir(): string[] {
    if (!receita) return [];
    const base = receita.nutricao?.porcoes_base ?? 2;
    if (porcoes === base) return receita.ingredientes;
    const fator = porcoes / base;
    return receita.ingredientes.map((ing) => {
      // Multiplicar frações unicode também
      let texto = ing.replace(/½/g, "0.5").replace(/⅓/g, "0.333").replace(/¼/g, "0.25").replace(/¾/g, "0.75");
      texto = texto.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
        const num = parseFloat(match.replace(",", "."));
        const novo = num * fator;
        // Arredondamento amigável
        if (Math.abs(novo - Math.round(novo)) < 0.05) return String(Math.round(novo));
        if (Math.abs(novo * 2 - Math.round(novo * 2)) < 0.05) {
          const int = Math.floor(novo);
          const frac = novo - int;
          if (Math.abs(frac - 0.5) < 0.05) return int > 0 ? `${int}½` : "½";
        }
        return (Math.round(novo * 10) / 10).toString().replace(".", ",");
      });
      return texto;
    });
  }

  function toggleFavorito() {
    if (!receita) return;
    if (favorito) {
      removeFavorito(receita.id);
      setFavorito(false);
    } else {
      addFavorito(receita);
      setFavorito(true);
    }
  }

  // Processa linha de ingrediente para a lista de compras:
  // "Recheio: frango desfiado" → "frango desfiado" (strip do label)
  // "Para o recheio:" → null (label puro, ignorar)
  function processarParaLista(ing: string): string | null {
    const t = ing.trim();
    // Label puro: termina com ":" ou é "Para o/a ..."
    if (t.endsWith(":") || /^para\s+(o|a|os|as)\s+/i.test(t)) return null;
    // Label com ingrediente: "Recheio: frango desfiado"
    const match = t.match(/^(recheio|massa|calda|cobertura|molho|base|montagem|recheio\s+\d+|camada)\s*:\s*(.+)/i);
    if (match) return match[2].trim();
    return t;
  }

  function adicionarNaLista() {
    if (!receita) return;
    const listaAtual = getLista();
    const idsExistentes = new Set(listaAtual.map((i) => i.id));
    const novosItens: ItemLista[] = ingredientesParaExibir()
      .map((desc) => processarParaLista(desc))
      .filter((desc): desc is string => desc !== null)
      .map((desc) => ({
        id: `${receita.id}-${desc.slice(0, 20).replace(/\s/g, "-")}-${Date.now()}`,
        descricao: desc,
        categoria: receita.modulo,
        marcado: false,
      }))
      .filter((item) => !idsExistentes.has(item.id));

    setLista([...listaAtual, ...novosItens]);
    setFeedbackLista(true);
    setTimeout(() => setFeedbackLista(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--fundo)" }}>
        {/* Header skeleton */}
        <div className="skeleton" style={{ width: "100%", height: 180 }} />
        <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 28, width: "70%", borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 14, width: "90%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: "75%", borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  if (!receita) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ fontSize: 16, color: "var(--texto-suave)", textAlign: "center" }}>
          Receita não encontrada.
        </p>
        <a href="/agente" className="btn-coral" style={{ marginTop: 16, textDecoration: "none" }}>
          Buscar receitas
        </a>
      </div>
    );
  }

  const ingredientes = ingredientesParaExibir();
  const porcoes_base = receita.nutricao?.porcoes_base ?? 2;

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 100, background: "var(--fundo)" }}>
      {/* HEADER SEM IMAGEM */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--azul, #2E86C1) 0%, var(--azul-dark, #1A5276) 100%)",
          padding: "60px 20px 40px",
          position: "relative",
        }}
      >
        <button
          onClick={() => window.history.back()}
          aria-label="Voltar"
          style={{
            position: "absolute", top: 16, left: 16,
            background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%",
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={20} color="white" />
        </button>
        <button
          onClick={toggleFavorito}
          aria-label={favorito ? "Remover dos favoritos" : "Favoritar"}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%",
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Heart size={20} strokeWidth={2} color={favorito ? "var(--coral)" : "#9E9EA8"} fill={favorito ? "var(--coral)" : "none"} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
          {receita.modulo}
        </span>
        <h1 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          {receita.nome}
        </h1>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div
        style={{
          background: "var(--fundo)",
          borderRadius: "20px 20px 0 0",
          marginTop: -20,
          padding: "24px 20px 0",
          position: "relative",
        }}
      >
        {/* Rende */}
        {receita.rende && (
          <p style={{ fontSize: 14, color: "var(--texto-suave)", margin: "0 0 20px" }}>
            Rende: {receita.rende}
          </p>
        )}

        {/* AJUSTE DE PORÇÕES */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            background: "white",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(26,26,46,0.06)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--texto)" }}>Porções</span>
          <PortionAdjuster value={porcoes} onChange={setPorcoes} />
        </div>

        {/* NUTRITION PANEL */}
        <div style={{ marginBottom: 24 }}>
          {receita.nutricao && receita.nutricao.disponivel !== false ? (
            <NutritionPanel
              calorias={Math.round(receita.nutricao.kcal_porcao * (porcoes / porcoes_base))}
              proteina={Math.round(receita.nutricao.proteina_g * (porcoes / porcoes_base) * 10) / 10}
              carboidrato={Math.round(receita.nutricao.carboidrato_g * (porcoes / porcoes_base) * 10) / 10}
              gordura={Math.round(receita.nutricao.gordura_g * (porcoes / porcoes_base) * 10) / 10}
              indice_glicemico={receita.nutricao.indice_glicemico === "baixo" ? "Baixo" : receita.nutricao.indice_glicemico === "alto" ? "Alto" : "Médio"}
            />
          ) : (
            <div style={{ background: "#FFF0EE", borderRadius: 16, padding: 16, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--texto-suave)" }}>Nutrição indisponível para esta receita</p>
            </div>
          )}
        </div>

        {/* INGREDIENTES */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--texto)", margin: "0 0 12px" }}>
            Ingredientes
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {ingredientes.map((ing, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 15,
                  color: "var(--texto)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "var(--coral)", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>•</span>
                {ing}
              </li>
            ))}
          </ul>
        </section>

        {/* MODO DE PREPARO */}
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--texto)", margin: "0 0 12px" }}>
            Como Fazer
          </h3>
          <div
            style={{
              background: "#FFF8F5",
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--borda)",
            }}
          >
            <p style={{ fontSize: 15, color: "var(--texto)", lineHeight: 1.75, margin: 0 }}>
              {receita.modo_preparo}
            </p>
          </div>
        </section>

        {/* AÇÕES */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
          <button
            className="btn-verde"
            style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
            onClick={() => {
              window.location.href = `/planejador?adicionando=${receita.id}&porcoes=${porcoes}`;
            }}
          >
            Adicionar ao Cardápio
          </button>
          <button
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
            onClick={adicionarNaLista}
          >
            {feedbackLista ? "Adicionado na lista!" : "Jogar na Lista de Compras"}
          </button>
          <button
            style={{
              width: "100%",
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 700,
              color: favorito ? "var(--coral)" : "var(--texto-suave)",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
            onClick={toggleFavorito}
          >
            <Heart
              size={18}
              fill={favorito ? "var(--coral)" : "none"}
              color={favorito ? "var(--coral)" : "var(--texto-suave)"}
            />
            {favorito ? "Favoritado" : "Favoritar receita"}
          </button>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Heart, ArrowLeft, ChevronDown } from "lucide-react";
import NutritionPanel from "@/components/NutritionPanel";
import PortionAdjuster from "@/components/PortionAdjuster";
import { addFavorito, removeFavorito, isFavorito, addCardapio, getLista, setLista } from "@/lib/storage";
import type { ReceitaEnriquecida, ItemCardapio, ItemLista } from "@/lib/types";

const FALLBACK_IMG =
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800&auto=compress";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const REFEICOES: { value: ItemCardapio["refeicao"]; label: string }[] = [
  { value: "cafe", label: "Café da manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "jantar", label: "Jantar" },
  { value: "lanche", label: "Lanche" },
];

interface ModalCardapioProps {
  receita: ReceitaEnriquecida;
  porcoes: number;
  onFechar: () => void;
}

function ModalCardapio({ receita, porcoes, onFechar }: ModalCardapioProps) {
  const [dia, setDia] = useState(0);
  const [refeicao, setRefeicao] = useState<ItemCardapio["refeicao"]>("almoco");
  const [adicionado, setAdicionado] = useState(false);

  function confirmar() {
    addCardapio({ receitaId: receita.id, dia, refeicao, porcoes });
    setAdicionado(true);
    setTimeout(onFechar, 900);
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "2px solid var(--borda)",
    borderRadius: 12,
    fontSize: 15,
    background: "white",
    color: "var(--texto)",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom, 0)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 32px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: "#E0D5D2",
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--texto)" }}>
            Adicionar ao Cardápio
          </h3>
          <button
            onClick={onFechar}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "var(--texto-suave)",
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: 14, color: "var(--texto-suave)", margin: "0 0 20px", fontWeight: 500 }}>
          {receita.nome}
        </p>

        {/* Dia */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--texto-suave)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Dia da semana
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={dia}
              onChange={(e) => setDia(Number(e.target.value))}
              style={selectStyle}
            >
              {DIAS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--texto-suave)" }} />
          </div>
        </div>

        {/* Refeição */}
        <div style={{ marginBottom: 24, position: "relative" }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--texto-suave)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Refeição
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={refeicao}
              onChange={(e) => setRefeicao(e.target.value as ItemCardapio["refeicao"])}
              style={selectStyle}
            >
              {REFEICOES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--texto-suave)" }} />
          </div>
        </div>

        <button
          className="btn-verde"
          style={{ width: "100%", justifyContent: "center", fontSize: 16 }}
          onClick={confirmar}
          disabled={adicionado}
        >
          {adicionado ? "Adicionado!" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}

interface Props {
  id: string;
}

export default function ReceitaDetalhe({ id }: Props) {
  const [receita, setReceita] = useState<ReceitaEnriquecida | null>(null);
  const [porcoes, setPorcoes] = useState(2);
  const [favorito, setFavorito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMacros, setLoadingMacros] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
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
          // Enriquecer com Gemini se não tiver macros
          if (!encontrada.calorias) {
            enriquecerMacros(encontrada);
          }
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function enriquecerMacros(receitaBase: ReceitaEnriquecida) {
    setLoadingMacros(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receitas: [receitaBase],
          pedido: "detalhar e calcular macros",
          porcoes: 2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const enriquecida: ReceitaEnriquecida[] = data.receitas ?? [];
        if (enriquecida.length > 0) {
          setReceita((prev) => prev ? { ...prev, ...enriquecida[0] } : prev);
        }
      }
    } catch {
      // ignora falha silenciosamente
    } finally {
      setLoadingMacros(false);
    }
  }

  // Recalcula ingredientes ajustados quando muda porções
  function ingredientesParaExibir(): string[] {
    if (!receita) return [];
    if (receita.ingredientes_ajustados && receita.porcoes && porcoes !== receita.porcoes) {
      // proporcional simples
      const fator = porcoes / (receita.porcoes || 2);
      return receita.ingredientes.map((ing) => {
        return ing.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
          const num = parseFloat(match.replace(",", "."));
          const ajustado = Math.round(num * fator * 10) / 10;
          return String(ajustado).replace(".", ",");
        });
      });
    }
    return receita.ingredientes_ajustados ?? receita.ingredientes;
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

  function adicionarNaLista() {
    if (!receita) return;
    const listaAtual = getLista();
    const idsExistentes = new Set(listaAtual.map((i) => i.id));
    const novosItens: ItemLista[] = ingredientesParaExibir()
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
        {/* Hero skeleton */}
        <div className="skeleton" style={{ width: "100%", aspectRatio: "4/3" }} />
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

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 100, background: "var(--fundo)" }}>
      {/* IMAGEM HERO */}
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#F5EDE9" }}>
        <img
          src={receita.imagem_url || FALLBACK_IMG}
          alt={receita.nome}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="eager"
        />

        {/* Gradiente overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
          }}
        />

        {/* Nome sobre imagem */}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 70 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {receita.modulo}
          </span>
          <h1
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: 800,
              margin: "4px 0 0",
              lineHeight: 1.3,
              textShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            {receita.nome}
          </h1>
        </div>

        {/* Botão voltar */}
        <button
          onClick={() => window.history.back()}
          aria-label="Voltar"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(0,0,0,0.4)",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          <ArrowLeft size={20} color="white" />
        </button>

        {/* Botão favoritar */}
        <button
          onClick={toggleFavorito}
          aria-label={favorito ? "Remover dos favoritos" : "Favoritar receita"}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.92)",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Heart
            size={20}
            strokeWidth={2}
            color={favorito ? "var(--coral)" : "#9E9EA8"}
            fill={favorito ? "var(--coral)" : "none"}
          />
        </button>
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
        {/* Badge módulo */}
        <span className="badge badge-coral" style={{ marginBottom: 10, display: "inline-block" }}>
          {receita.modulo}
        </span>

        {/* Nome */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--texto)", margin: "0 0 6px", lineHeight: 1.3 }}>
          {receita.nome}
        </h2>

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
          {loadingMacros && !receita.calorias ? (
            <div
              style={{
                background: "#FFF0EE",
                borderRadius: 16,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div
                className="skeleton"
                style={{ height: 60, borderRadius: 10, marginBottom: 10 }}
              />
              <p style={{ fontSize: 12, color: "var(--texto-suave)", margin: 0 }}>
                Calculando macros...
              </p>
            </div>
          ) : (
            <NutritionPanel
              calorias={receita.calorias}
              proteina={receita.proteina}
              carboidrato={receita.carboidrato}
              gordura={receita.gordura}
              indice_glicemico={receita.indice_glicemico}
            />
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
            onClick={() => setMostrarModal(true)}
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

      {/* MODAL CARDÁPIO */}
      {mostrarModal && (
        <ModalCardapio
          receita={receita}
          porcoes={porcoes}
          onFechar={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, ShoppingCart, Check, Trash2 } from "lucide-react";
import {
  getLista,
  setLista,
  toggleItem,
  removeItemLista,
} from "@/lib/storage";
import { ItemLista } from "@/lib/types";

function agruparPorCategoria(lista: ItemLista[]): Record<string, ItemLista[]> {
  return lista.reduce((acc, item) => {
    const cat = item.categoria || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ItemLista[]>);
}

const ORDEM_CATEGORIAS = [
  "Proteínas",
  "Laticínios",
  "Grãos e Carbos",
  "Verduras e Legumes",
  "Frutas",
  "Óleos e Gorduras",
  "Temperos",
  "Outros",
];

function ordenarCategorias(grupos: Record<string, ItemLista[]>): string[] {
  const chaves = Object.keys(grupos);
  return [
    ...ORDEM_CATEGORIAS.filter((c) => chaves.includes(c)),
    ...chaves.filter((c) => !ORDEM_CATEGORIAS.includes(c)),
  ];
}

export default function ListaPage() {
  const [lista, setListaState] = useState<ItemLista[]>([]);
  const [novoItem, setNovoItem] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setListaState(getLista());
  }, []);

  const atualizar = () => setListaState(getLista());

  const adicionarItem = () => {
    const desc = novoItem.trim();
    if (!desc) return;
    const item: ItemLista = {
      id: Date.now().toString(),
      descricao: desc,
      categoria: "Outros",
      marcado: false,
    };
    const nova = [...getLista(), item];
    setLista(nova);
    setListaState(nova);
    setNovoItem("");
    inputRef.current?.focus();
  };

  const handleToggle = (id: string) => {
    toggleItem(id);
    atualizar();
  };

  const handleRemover = (id: string) => {
    removeItemLista(id);
    atualizar();
  };

  const limparMarcados = () => {
    const filtrada = getLista().filter((i) => !i.marcado);
    setLista(filtrada);
    setListaState(filtrada);
  };

  const limparTudo = () => {
    setLista([]);
    setListaState([]);
  };

  const totalMarcados = lista.filter((i) => i.marcado).length;
  const grupos = agruparPorCategoria(lista);
  const ordemCats = ordenarCategorias(grupos);

  return (
    <div>
      {/* Header */}
      <header className="page-header">
        <div className="container-app">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <ShoppingCart size={22} color="white" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>
              Lista de Compras
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0 }}>
            {lista.length > 0
              ? `${lista.length} ${lista.length === 1 ? "item" : "itens"} · ${totalMarcados} marcado${totalMarcados !== 1 ? "s" : ""}`
              : "Lista vazia"}
          </p>
        </div>
      </header>

      <main className="container-app" style={{ paddingTop: 20 }}>
        {/* Adicionar item */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <input
            ref={inputRef}
            className="input-nutri"
            type="text"
            placeholder="Adicionar item…"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionarItem(); }}
            style={{ flex: 1 }}
          />
          <button
            className="btn-coral"
            onClick={adicionarItem}
            aria-label="Adicionar"
            style={{ padding: "12px 16px", borderRadius: 12, flexShrink: 0 }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Estado vazio */}
        {lista.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "56px 24px",
              background: "white",
              borderRadius: 20,
              boxShadow: "0 2px 8px rgba(26,26,46,0.06)",
            }}
          >
            <ShoppingCart
              size={64}
              color="var(--borda)"
              strokeWidth={1.2}
              style={{ margin: "0 auto 16px" }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--texto)", marginBottom: 8 }}>
              Sua lista está vazia
            </h2>
            <p style={{ fontSize: 14, color: "var(--texto-suave)", marginBottom: 24, lineHeight: 1.5 }}>
              Adicione receitas ao cardápio para gerar automaticamente
            </p>
            <button
              className="btn-ghost"
              style={{ margin: "0 auto" }}
              onClick={() => { window.location.href = "/planejador"; }}
            >
              Ir para o Cardápio
            </button>
          </div>
        ) : (
          <>
            {/* Itens agrupados por categoria */}
            {ordemCats.map((cat) => {
              const itens = grupos[cat];
              if (!itens?.length) return null;
              return (
                <section key={cat} style={{ marginBottom: 20 }}>
                  <h2
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--texto-suave)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 8,
                    }}
                  >
                    {cat}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {itens.map((item) => (
                      <div
                        key={item.id}
                        className={`check-item${item.marcado ? " marcado" : ""}`}
                        onClick={() => handleToggle(item.id)}
                      >
                        {/* Checkbox visual */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${item.marcado ? "var(--coral)" : "var(--borda)"}`,
                            background: item.marcado ? "var(--coral)" : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        >
                          {item.marcado && <Check size={13} color="white" strokeWidth={3} />}
                        </div>

                        {/* Descrição + quantidade */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "var(--texto)",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.descricao}
                          </span>
                          {item.quantidade && (
                            <span style={{ fontSize: 12, color: "var(--texto-suave)" }}>
                              {item.quantidade}
                            </span>
                          )}
                        </div>

                        {/* Remover */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemover(item.id); }}
                          aria-label="Remover item"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            flexShrink: 0,
                            color: "#C0B8B5",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X size={16} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Rodapé */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 8,
                paddingBottom: 8,
              }}
            >
              {totalMarcados > 0 && (
                <button
                  className="btn-ghost"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={limparMarcados}
                >
                  <Trash2 size={16} />
                  Limpar marcados ({totalMarcados})
                </button>
              )}
              <button
                onClick={limparTudo}
                style={{
                  background: "none",
                  border: "2px solid #FFCDD0",
                  color: "#C0392B",
                  borderRadius: 12,
                  padding: "10px 22px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  transition: "background 0.15s",
                }}
              >
                <Trash2 size={16} />
                Limpar tudo
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

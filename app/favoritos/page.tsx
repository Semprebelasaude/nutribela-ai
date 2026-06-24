"use client";

import { useEffect, useState } from "react";
import { Heart, ChefHat } from "lucide-react";
import { getFavoritos, removeFavorito } from "@/lib/storage";
import { ReceitaEnriquecida } from "@/lib/types";
import ReceitaCard from "@/components/ReceitaCard";

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<ReceitaEnriquecida[]>([]);
  const [removendo, setRemovendo] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFavoritos(getFavoritos());
  }, []);

  const handleRemover = (id: string) => {
    // Inicia animação de saída
    setRemovendo((prev) => new Set(prev).add(id));

    setTimeout(() => {
      removeFavorito(id);
      setFavoritos(getFavoritos());
      setRemovendo((prev) => {
        const novo = new Set(prev);
        novo.delete(id);
        return novo;
      });
    }, 300);
  };

  return (
    <div>
      {/* Header */}
      <header className="page-header">
        <div className="container-app">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Heart size={22} color="white" fill="white" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>
              Meus Favoritos
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0 }}>
            {favoritos.length > 0
              ? `${favoritos.length} receita${favoritos.length !== 1 ? "s" : ""} salva${favoritos.length !== 1 ? "s" : ""}`
              : "Nenhuma receita salva ainda"}
          </p>
        </div>
      </header>

      <main className="container-app" style={{ paddingTop: 20 }}>
        {favoritos.length === 0 ? (
          /* Estado vazio */
          <div
            style={{
              textAlign: "center",
              padding: "56px 24px",
              background: "white",
              borderRadius: 20,
              boxShadow: "0 2px 8px rgba(26,26,46,0.06)",
            }}
          >
            <Heart
              size={64}
              color="var(--coral)"
              fill="none"
              strokeWidth={1.5}
              style={{ margin: "0 auto 16px" }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--texto)", marginBottom: 8 }}>
              Nenhuma receita favoritada ainda
            </h2>
            <p style={{ fontSize: 14, color: "var(--texto-suave)", marginBottom: 24, lineHeight: 1.5 }}>
              Explore as receitas e clique no ♡ para salvar
            </p>
            <button
              className="btn-coral"
              style={{ margin: "0 auto" }}
              onClick={() => { window.location.href = "/agente"; }}
            >
              <ChefHat size={18} />
              Descobrir Receitas
            </button>
          </div>
        ) : (
          /* Grid de cards */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {favoritos.map((receita) => (
              <div
                key={receita.id}
                style={{
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  opacity: removendo.has(receita.id) ? 0 : 1,
                  transform: removendo.has(receita.id) ? "scale(0.96)" : "scale(1)",
                }}
              >
                <ReceitaCard
                  receita={receita}
                  favorito={true}
                  onClick={() => { window.location.href = `/receita/${receita.id}`; }}
                  onFavoritar={() => handleRemover(receita.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

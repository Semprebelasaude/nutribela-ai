"use client";

import { Heart } from "lucide-react";
import { ReceitaEnriquecida } from "@/lib/types";

const FALLBACK_IMG =
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=600&auto=compress";

const IG_CONFIG: Record<string, { label: string; classe: string }> = {
  Baixo:  { label: "IG Baixo",  classe: "badge badge-verde"   },
  Médio:  { label: "IG Médio",  classe: "badge badge-amarelo" },
  Alto:   { label: "IG Alto",   classe: "badge badge-coral"   },
};

interface Props {
  receita: ReceitaEnriquecida;
  onClick?: () => void;
  onFavoritar?: () => void;
  favorito?: boolean;
}

export default function ReceitaCard({ receita, onClick, onFavoritar, favorito = false }: Props) {
  const igInfo = receita.indice_glicemico ? IG_CONFIG[receita.indice_glicemico] : null;

  const temMacros =
    receita.calorias != null ||
    receita.proteina != null ||
    receita.carboidrato != null ||
    receita.gordura != null;

  return (
    <article className="card animate-fade-up" style={{ overflow: "hidden", cursor: "pointer" }}>
      {/* Imagem */}
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }} onClick={onClick}>
        <img
          src={receita.imagem_url || FALLBACK_IMG}
          alt={receita.nome}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />

        {/* Botão favoritar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoritar?.();
          }}
          aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.92)",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <Heart
            size={18}
            strokeWidth={2}
            color={favorito ? "var(--coral)" : "#9E9EA8"}
            fill={favorito ? "var(--coral)" : "none"}
          />
        </button>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "12px 14px 14px" }} onClick={onClick}>
        {/* Badge módulo */}
        <span className="badge badge-coral" style={{ marginBottom: 8, display: "inline-block" }}>
          {receita.modulo}
        </span>

        {/* Nome */}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--texto)",
            margin: "0 0 8px",
            lineHeight: 1.35,
          }}
        >
          {receita.nome}
        </h3>

        {/* Tags */}
        {receita.tags && receita.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {receita.tags.map((tag) => (
              <span key={tag} className="chip" style={{ fontSize: 11, padding: "3px 8px" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Macros */}
        {temMacros && (
          <p style={{ fontSize: 12, color: "var(--texto-suave)", margin: "0 0 8px" }}>
            {receita.calorias != null && <>{receita.calorias} kcal</>}
            {receita.proteina != null && <> · P: {receita.proteina}g</>}
            {receita.carboidrato != null && <> · C: {receita.carboidrato}g</>}
            {receita.gordura != null && <> · G: {receita.gordura}g</>}
          </p>
        )}

        {/* Índice glicêmico */}
        {igInfo && (
          <span className={igInfo.classe} style={{ fontSize: 11 }}>
            {igInfo.label}
          </span>
        )}
      </div>
    </article>
  );
}

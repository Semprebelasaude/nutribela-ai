interface Props {
  calorias?: number;
  proteina?: number;
  carboidrato?: number;
  gordura?: number;
  indice_glicemico?: string;
}

interface MacroCol {
  label: string;
  valor: number | undefined;
  unidade: string;
  cor: string;
}

const IG_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  Baixo: { label: "IG Baixo",  bg: "#E8F8EF", color: "#27AE60" },
  Médio: { label: "IG Médio",  bg: "#FEF9E7", color: "#D4A017" },
  Alto:  { label: "IG Alto",   bg: "#FDECEA", color: "#E84C3D" },
};

export default function NutritionPanel({
  calorias,
  proteina,
  carboidrato,
  gordura,
  indice_glicemico,
}: Props) {
  const colunas: MacroCol[] = [
    { label: "Calorias",  valor: calorias,     unidade: "kcal", cor: "#E84C3D" },
    { label: "Proteína",  valor: proteina,     unidade: "g",    cor: "#27AE60" },
    { label: "Carb",      valor: carboidrato,  unidade: "g",    cor: "#F39C12" },
    { label: "Gordura",   valor: gordura,      unidade: "g",    cor: "#3498DB" },
  ];

  const igInfo = indice_glicemico ? IG_BADGE[indice_glicemico] : null;

  return (
    <div
      style={{
        background: "#FFF0EE",
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Grid de macros */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: igInfo ? 12 : 8,
        }}
      >
        {colunas.map(({ label, valor, unidade, cor }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: cor, lineHeight: 1 }}>
                {valor != null ? valor : "—"}
              </span>
              {valor != null && (
                <span style={{ fontSize: 11, color: "var(--texto-suave)", fontWeight: 500 }}>
                  {unidade}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--texto-suave)", textAlign: "center" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Badge IG */}
      {igInfo && (
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
          <span
            style={{
              background: igInfo.bg,
              color: igInfo.color,
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {igInfo.label}
          </span>
        </div>
      )}

      {/* Rodapé */}
      <p style={{ margin: 0, fontSize: 10, color: "var(--texto-suave)", textAlign: "center" }}>
        Valores nutricionais estimados, podem variar conforme marcas e modo de preparo.
      </p>
    </div>
  );
}

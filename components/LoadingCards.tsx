interface Props {
  count?: number;
}

export default function LoadingCards({ count = 3 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card"
          style={{ overflow: "hidden" }}
          aria-hidden="true"
        >
          {/* Imagem skeleton */}
          <div
            className="skeleton"
            style={{ width: "100%", aspectRatio: "16/9" }}
          />

          {/* Conteúdo skeleton */}
          <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Badge */}
            <div className="skeleton" style={{ height: 20, width: 72, borderRadius: 8 }} />

            {/* Nome — 2 linhas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ height: 16, width: "85%", borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 16, width: "55%", borderRadius: 6 }} />
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 6 }}>
              <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 10 }} />
              <div className="skeleton" style={{ height: 22, width: 48, borderRadius: 10 }} />
            </div>

            {/* Macros */}
            <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </>
  );
}

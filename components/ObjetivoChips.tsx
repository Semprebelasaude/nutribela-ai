"use client";

const OBJETIVOS = [
  { id: "geral",      label: "Tudo",      icon: "🍽️" },
  { id: "emagrecer",  label: "Emagrecer", icon: "🏃‍♀️" },
  { id: "low_carb",   label: "Low Carb",  icon: "🥗" },
  { id: "diabetico",  label: "Diabético", icon: "💚" },
  { id: "desinchar",  label: "Desinchar", icon: "💧" },
  { id: "ganho_massa",label: "Proteico",  icon: "💪" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ObjetivoChips({ value, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        whiteSpace: "nowrap",
        paddingBottom: 4,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {OBJETIVOS.map(({ id, label, icon }) => {
        const ativo = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`chip ${ativo ? "chip-active" : "chip-outline"}`}
            style={{ flexShrink: 0 }}
            aria-pressed={ativo}
          >
            <span aria-hidden="true">{icon}</span> {label}
          </button>
        );
      })}
    </div>
  );
}

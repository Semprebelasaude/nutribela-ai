"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export default function PortionAdjuster({ value, onChange, min = 1, max = 20 }: Props) {
  const decrement = () => { if (value > min) onChange(value - 1); };
  const increment = () => { if (value < max) onChange(value + 1); };

  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    border: "2px solid var(--coral)",
    borderRadius: 10,
    background: "white",
    color: "var(--coral)",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        background: "white",
        border: "2px solid var(--coral)",
        borderRadius: 12,
        padding: "6px 12px",
      }}
    >
      <button
        onClick={decrement}
        disabled={value <= min}
        aria-label="Diminuir porção"
        style={{
          ...btnStyle,
          border: "none",
          padding: 0,
          opacity: value <= min ? 0.4 : 1,
          cursor: value <= min ? "default" : "pointer",
        }}
      >
        −
      </button>

      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--texto)",
          minWidth: 28,
          textAlign: "center",
          userSelect: "none",
        }}
      >
        {value}
      </span>

      <button
        onClick={increment}
        disabled={value >= max}
        aria-label="Aumentar porção"
        style={{
          ...btnStyle,
          border: "none",
          padding: 0,
          opacity: value >= max ? 0.4 : 1,
          cursor: value >= max ? "default" : "pointer",
        }}
      >
        +
      </button>
    </div>
  );
}

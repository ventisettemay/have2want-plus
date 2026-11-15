import React from "react";

type LedIndicatorProps = {
  size?: "xs" | "sm" | "md" | "lg";
  /** Colore in formato hex (es. "10b981") o tailwind (es. "emerald-500") */
  color: string;
  /** Se vero, pulsa dolcemente (respira) */
  pulse?: boolean;
  /** Se vero, lampeggia veloce (stato urgente) */
  blink?: boolean;
  /** Classe extra per styling ulteriore */
  extraClass?: string;
  className?: string;
};

const LedIndicatorPro = ({
  size = "md",
  color,
  pulse = true,
  blink = false,
  extraClass = "",
  className = ""
}: LedIndicatorProps) => {
  // Mappa dimensioni: w-2.5 h-2.5 fino a w-8 h-8
  const sizeMap = {
    xs: "w-2.5 h-2.5 rounded-full",
    sm: "w-4 h-4 rounded-full",
    md: "w-6 h-6 rounded-full",
    lg: "w-8 h-8 rounded-full"
  };

  // Classe animazione: pulse = respira (2s ciclico), blink = lampeggio veloce
  const animateClass = pulse
    ? "animate-pulse-led"
    : blink
      ? "animate-blink-led"
      : "animate-none";

  return (
    <span
      className={`
        ${sizeMap[size]}
        rounded-full
        bg-${color}-500
        position-relative
        ${animateClass}
        ${extraClass}
        ${className}
        flex-shrink-0
      `}
      style={{
        // Ombreto "effetto luce reale" - solo quando pulse è true
        boxShadow: pulse
          ? `0 0 10px rgba(${hexToRgb(color)}, 0.5), 0 0 20px rgba(${hexToRgb(color)}, 0.2)`
          : "0 0 5px rgba(0,0,0,0.1)"
      }}
    />
  );
};

/** Helper: converte colore tailwind/hex in stringa rgb per box-shadow */
function hexToRgb(color: string): string {
  // Se è già rgb, restituisci così com'è
  if (color.startsWith("rgb")) return color;
  // Mappa colori tailwind comuni (estensibile)
  const colorMap: Record<string, string> = {
    emerald: "34, 197, 94",
    amber: "251, 191, 36",
    sky: "3, 155, 229",
    rose: "251, 64, 184",
    violet: "168, 85, 247",
    cyan: "6, 203, 207",
    white: "255, 255, 255"
  };
  const mapped = colorMap[color] || "255,255,255";
  return mapped;
}

export { LedIndicatorPro, hexToRgb };
export default LedIndicatorPro;

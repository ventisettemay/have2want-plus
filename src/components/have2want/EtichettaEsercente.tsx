import React from "react";
import { LedIndicatorPro } from "../ui/LedIndicatorPro";

interface EtichettaEsercenteProps {
  acceptsPi?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function EtichettaEsercente({
  acceptsPi = true,
  size = "sm",
  className = ""
}: EtichettaEsercenteProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg
        bg-amber-500/10 border border-amber-500/40
        text-amber-300 text-[10px] font-black uppercase tracking-wider
        shadow-[0_0_12px_rgba(245,158,11,0.3)]
        ${className}
      `}
    >
      <LedIndicatorPro
        size={size === "sm" ? "sm" : "md"}
        color="amber"
        pulse={true}
      />
      <span>Esercente Partner</span>
      {acceptsPi && (
        <span className="flex items-center gap-0.5">
          <span>π</span>
          <span className="text-[9px]">Accetta</span>
        </span>
      )}
    </div>
  );
}

export default EtichettaEsercente;

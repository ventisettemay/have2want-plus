import React from "react";
import { LedIndicatorPro, hexToRgb } from "../ui/LedIndicatorPro";

type AvatarUtenteChatProps = {
  nome: string;
  genere: 'uomo' | 'donna' | 'nonSpecificato';
  isActive?: boolean;
};

export function AvatarUtenteChat({ nome, genere, isActive }: AvatarUtenteChatProps) {
  // Colori: uomo = azzurro, donna = rosa
  const colors = {
    uomo: "60f5ff",      // azzurro chiaro
    donna: "ffb3e6",     // rosa chiaro
    nonSpecificato: "9ca3af" // grigio
  };

  const bgColor = colors[genere] || colors.nonSpecificato;
  const iniziale = nome.charAt(0).toUpperCase();

  return (
    <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
      {/* LED stato sotto l'avatar - pulsa quando utente attivo */}
      {isActive && (
        <LedIndicatorPro
          size="xs"
          color={genere === "uomo" ? "60f5ff" : genere === "donna" ? "ffb3e6" : "9ca3af"}
          pulse={true}
          className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full"
        />
      )}

      <div
        style={{
          backgroundColor: `#${bgColor}`,
          boxShadow: isActive
            ? `0 0 8px rgba(${hexToRgb(bgColor)}, 0.5)`
            : "none"
        }}
        className="w-full h-full rounded-full flex items-center justify-center"
      >
        {iniziale}
      </div>
    </div>
  );
}

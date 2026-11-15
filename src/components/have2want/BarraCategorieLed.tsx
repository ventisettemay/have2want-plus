import React, { useState, useEffect } from "react";
import { LedIndicatorPro } from "../ui/LedIndicatorPro";

export function BarraCategorieLed({ onCategoriaClick }: { onCategoriaClick?: (cat: string) => void }) {
  const categorie = ['vendo', 'baratto', 'acquisto'];
  const colori = ['emerald', 'amber', 'sky'];
  
  // Stato: quale LED è "attivo" (respira), gli altri sono fermi
  const [attivo, setAttivo] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAttivo(prev => prev >= 2 ? 0 : prev + 1);
    }, 1800); // Cambia chi respira ogni 1.8s
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 pt-2 px-2">
      {categorie.map((cat, idx) => {
        // L'LED corrente respira, gli altri sono fermi (solo bordo)
        const isAttivo = idx === attivo;
        const color = colori[idx];
        
        return (
          <div key={cat} className="flex items-center gap-1">
            {/* LED: solo quello attivo pulsa, gli altri no */}
            <LedIndicatorPro 
              size="sm" 
              color={color} 
              pulse={isAttivo} 
              className="mx-1"
            />
            {/* Testo sotto piccolo */}
            <span className="text-[8px] font-medium opacity-80 mt-0.5">{cat === 'vendo' ? 'VENDO' : cat === 'baratto' ? 'BARATTO' : 'CERCO'}</span>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, MapPin, Coins, HeartHandshake, Globe, ExternalLink } from "lucide-react";
import { EtichettaEsercente } from "./EtichettaEsercente";

interface EsercenteProfile {
  id: string;
  name: string;
  title: string;
  category: string;
  city: string;
  piPrice: number;
  acceptsPi: boolean;
  reputation: number;
  avatar: string;
  isExerciser: boolean;
}

const ESERCENTI_DATA: EsercenteProfile[] = [
  {
    id: "esc-001",
    name: "Bottega Artigiana Astese",
    title: "Artigianato & Restauro",
    category: "casa_fai_da_te",
    city: "Asti",
    piPrice: 12.50,
    acceptsPi: true,
    reputation: 4.9,
    avatar: "https://images.unsplash.com/photo-1586027427069-3dc466a4a0a7?w=200&auto=format&fit=crop",
    isExerciser: true,
  },
  {
    id: "esc-002",
    name: "Punto Vendita Pi Torino",
    title: "Elettronica & Accessori",
    category: "elettronica_informatica",
    city: "Torino",
    piPrice: 45.00,
    acceptsPi: true,
    reputation: 4.7,
    avatar: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&auto=format&fit=crop",
    isExerciser: true,
  },
  {
    id: "esc-003",
    name: "Mercato Solidale Milano",
    title: "Prodotti Biologici & Locali",
    category: "servizi_lavoro_buoni",
    city: "Milano",
    piPrice: 8.00,
    acceptsPi: true,
    reputation: 5.0,
    avatar: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop",
    isExerciser: true,
  },
  {
    id: "esc-004",
    name: "Officina Meccanica Roma",
    title: "Riparazioni Auto & Moto",
    category: "auto_moto_veicoli",
    city: "Roma",
    piPrice: 30.00,
    acceptsPi: true,
    reputation: 4.8,
    avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&auto=format&fit=crop",
    isExerciser: true,
  },
  {
    id: "esc-005",
    name: "Libreria Culturale Firenze",
    title: "Libri Usati & Antiquariato",
    category: "libri_scuola_cultura",
    city: "Firenze",
    piPrice: 5.50,
    acceptsPi: true,
    reputation: 4.6,
    avatar: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop",
    isExerciser: true,
  },
];

export function BannerRotanteEsercizi() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndice((prev) => (prev + 1) % ESERCENTI_DATA.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const esercente = ESERCENTI_DATA[indice];

  return (
    <div className="w-full overflow-hidden border-y border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={indice}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex items-center gap-3 px-4 py-2.5"
        >
          <img
            src={esercente.avatar}
            alt={esercente.name}
            className="w-10 h-10 rounded-xl object-cover border-2 border-amber-500/50 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white truncate">
                {esercente.name}
              </span>
              <EtichettaEsercente acceptsPi={esercente.acceptsPi} size="sm" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <MapPin className="w-3 h-3" /> {esercente.city}
              <span>•</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {esercente.reputation}
              <span>•</span>
              <Coins className="w-3 h-3 text-emerald-400" /> {esercente.piPrice} π
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {ESERCENTI_DATA.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === indice ? "bg-amber-400 scale-125" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default BannerRotanteEsercizi;

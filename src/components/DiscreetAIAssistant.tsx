import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  Send,
  ShieldCheck,
  Mic,
  MicOff,
  Navigation,
  ArrowRight,
  AlertCircle,
  Camera,
  X
} from "lucide-react";
import { HaveWantListing, SalvavatuttoGuide } from "../types";
import { classifyIntent, calculateProximity, ProcessedProduct } from "../lib/testnetEngine";
import { buildApiUrl } from "../lib/apiConfig";
import { isValidCoord } from "../lib/worldAtlas";

interface DiscreetAIAssistantProps {
  listings: HaveWantListing[];
  guides: SalvavatuttoGuide[];
  onNavigateToSection: (section: "bacheca" | "salvavatutto" | "pi-hub") => void;
}

interface Message {
  sender: "ai" | "user";
  text: string;
  imageUrl?: string;
  imageName?: string;
  is18PlusNotice?: boolean;
  productPayload?: ProcessedProduct;
  suggestedAction?: {
    label: string;
    target: "bacheca" | "salvavatutto" | "pi-hub";
  };
}

export function WelcomeTechnologyCard() {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl border border-blue-500 shadow-lg my-4">
      <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
        <span>✨ Ricerca &amp; Orientamento HAVE2WANT PLUS</span>
      </h3>
      <p className="text-sm text-gray-300 mb-3">
        Interagisci <strong>digitando</strong>, parlando al <strong>microfono</strong> o <strong>allegando una foto</strong>. La ricerca interroga annunci attivi reali, guide Salvavatutto e catalogo Testnet:
      </p>
      <ul className="text-xs space-y-2 text-gray-400">
        <li>
          🎙️ <strong className="text-white">Ricerca Vocale Locale:</strong> Riconoscimento vocale del browser elaborato sul dispositivo.
        </li>
        <li>
          📍 <strong className="text-white">Prossimità Reale GPS:</strong> Calcolo distanza Haversine solo quando il GPS del dispositivo è autorizzato.
        </li>
        <li>
          🛡️ <strong className="text-white">Nessun LLM Esterno Dichiarato:</strong> Le risposte usano il motore semantico locale su annunci e guide reali.
        </li>
      </ul>
    </div>
  );
}

export const DiscreetAIAssistant: React.FC<DiscreetAIAssistantProps> = ({
  listings,
  guides,
  onNavigateToSection,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Assistente Locale Simply Discreet pronto.\nPuoi cercare tra gli annunci reali della bacheca, le guide pratiche Salvavatutto, le 9 Forme di Interazione o i Punti di Incontro Certificati.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    name: string;
    file?: File;
  } | null>(null);
  const attachedImageRef = useRef<{ dataUrl: string; name: string; file?: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAttachedImage = (img: { dataUrl: string; name: string; file?: File } | null) => {
    setAttachedImage(img);
    attachedImageRef.current = img;
  };

  // Nessuna coordinata hardcoded predefinita: null finché il GPS non risponde
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"waiting" | "gps_active" | "gps_unavailable">("waiting");

  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      updateAttachedImage({
        dataUrl: uploadEvent.target?.result as string,
        name: file.name,
        file: file,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
          });
          setGpsStatus("gps_active");
        },
        () => {
          setUserCoords(null);
          setGpsStatus("gps_unavailable");
        },
        { timeout: 5000 }
      );
    } else {
      setGpsStatus("gps_unavailable");
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);

    rec.onresult = (event: any) => {
      const textResult = event.results[0][0].transcript;
      setInputQuery(textResult);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
              setUserCoords(coords);
              setGpsStatus("gps_active");
              sendToBackendAndClassify(textResult, coords, attachedImageRef.current);
            },
            () => {
              sendToBackendAndClassify(textResult, userCoords, attachedImageRef.current);
            },
            { timeout: 5000 }
          );
        } else {
          sendToBackendAndClassify(textResult, userCoords, attachedImageRef.current);
        }
        setIsListening(false);
      }, 1500);
    };

    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [userCoords]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const sendToBackend = async (text: string, coords: { lat: number; lng: number } | null) => {
    try {
      const res = await fetch(buildApiUrl("/api/testnet/query"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: text,
          ...(coords ? { user_lat: coords.lat, user_lng: coords.lng } : {}),
        }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Backend /api/testnet/query non attivo
    }
    return null;
  };

  const sendToBackendAndClassify = async (
    rawText: string,
    coords: { lat: number; lng: number } | null,
    imgPayload?: { dataUrl: string; name: string; file?: File } | null
  ) => {
    const currentImg = imgPayload !== undefined ? imgPayload : attachedImageRef.current;
    const text = rawText.trim();
    if (!text && !currentImg) return;

    const userDisplayText = text || (currentImg ? `[Foto: ${currentImg.name}]` : "");

    const nextMessages: Message[] = [
      ...messages,
      {
        sender: "user",
        text: userDisplayText,
        imageUrl: currentImg?.dataUrl,
        imageName: currentImg?.name,
      },
    ];
    setMessages(nextMessages);
    setInputQuery("");
    updateAttachedImage(null);
    setIsThinking(true);

    if (currentImg?.file) {
      try {
        const formData = new FormData();
        formData.append("image", currentImg.file);
        formData.append("product_name", text || currentImg.name.replace(/\.[^/.]+$/, ""));
        if (coords) {
          formData.append("user_lat", String(coords.lat));
          formData.append("user_lng", String(coords.lng));
        }
        await fetch(buildApiUrl("/api/testnet/publish"), { method: "POST", body: formData }).catch(() => {});
      } catch {
        // Upload opzionale
      }
    }

    const queryToSend = [text, currentImg?.name].filter(Boolean).join(" ");
    await sendToBackend(queryToSend, coords);

    const q = queryToSend.toLowerCase();
    const tokens = q.split(/\s+/).filter((t) => t.length >= 2);

    // 1. Ricerca diretta negli annunci reali della piattaforma
    const matchingListings = listings
      .map((l) => {
        const hay = `${l.title} ${l.description} ${l.category} ${l.author?.city || ""} ${(l.tags || []).join(" ")}`.toLowerCase();
        const score = tokens.reduce((acc, t) => (hay.includes(t) ? acc + 1 : acc), 0);
        const distKm =
          coords && isValidCoord(l.lat, l.lng)
            ? calculateProximity(coords.lat, coords.lng, l.lat!, l.lng!)
            : null;
        return { listing: l, score, distKm };
      })
      .filter((x) => x.score > 0 || q.includes("vicin") || q.includes("tutti"))
      .sort((a, b) => b.score - a.score || (a.distKm ?? 99999) - (b.distKm ?? 99999))
      .slice(0, 4);

    // 2. Ricerca diretta nelle guide Salvavatutto reali
    const matchingGuides = guides
      .map((g) => {
        const hay = `${g.title} ${g.summary} ${g.category} ${(g.tags || []).join(" ")}`.toLowerCase();
        const score = tokens.reduce((acc, t) => (hay.includes(t) ? acc + 1 : acc), 0);
        return { guide: g, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 3. Fallback Testnet Intent Engine se c'è un riscontro esatto
    const intentResult = coords
      ? classifyIntent(queryToSend, coords.lat, coords.lng)
      : { matched: false, text_response: "" };

    if (q.includes("9 form") || q.includes("nove form") || q.includes("interazion")) {
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text:
            "Le 9 Forme di Interazione Libera in HAVE2WANT PLUS:\n" +
            "1. Baratto puro\n2. Cessione in Pi Coin (π)\n3. Ricerca bisogno (CERCO)\n4. Prestito temporaneo\n5. Passaggio / Carpooling\n6. Competenza & Servizio locale\n7. Filiera corta Km Zero\n8. Scambio libri scolastici\n9. Orientamento gratuito specialisti",
          suggestedAction: { label: "Apri Bacheca Annunci", target: "bacheca" },
        },
      ]);
    } else if (matchingListings.length > 0) {
      const lines = matchingListings.map(({ listing: l, distKm }) => {
        const loc = l.author?.city || l.locationArea || "Territorio";
        const distLabel = distKm !== null ? ` • ${distKm} km` : "";
        return `• ${l.title} (${l.intent}) — ${loc}${distLabel}`;
      });
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: `Ho trovato ${matchingListings.length} annunci pertinenti nel catalogo reale:\n${lines.join("\n")}${
            matchingGuides.length > 0
              ? `\n\nGuide Salvavatutto correlate: ${matchingGuides.map((g) => g.guide.title).join(", ")}`
              : ""
          }`,
          suggestedAction: { label: "Esplora nella Bacheca", target: "bacheca" },
        },
      ]);
    } else if (matchingGuides.length > 0 || q.includes("guida") || q.includes("salvavatutto")) {
      const guideLines = (matchingGuides.length > 0 ? matchingGuides.map((m) => m.guide) : guides.slice(0, 3))
        .map((g) => `• ${g.title} (${g.category})`);
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: `In Salvavatutto sono presenti ${guides.length} guide pratiche:\n${guideLines.join("\n")}`,
          suggestedAction: { label: "Apri Archivio Salvavatutto", target: "salvavatutto" },
        },
      ]);
    } else if (intentResult.matched) {
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: intentResult.text_response,
          is18PlusNotice: (intentResult as any).product?.is_18_plus,
          productPayload: (intentResult as any).product,
        },
      ]);
    } else if (currentImg) {
      const cleanName = currentImg.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: `📷 Foto acquisita: "${cleanName}".\n${
            coords ? `GPS attivo: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}).` : "GPS non attivo sul dispositivo."
          }\nNota: Nessun servizio AI generativo remoto è configurato su questo endpoint; puoi pubblicare la foto direttamente dalla bacheca.`,
          imageUrl: currentImg.dataUrl,
          suggestedAction: { label: "Vai alla Bacheca per Pubblicare", target: "bacheca" },
        },
      ]);
    } else if (q.includes("pi") || q.includes("wallet") || q.includes("sicur") || q.includes("punt")) {
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: "I trasferimenti Pi avvengono direttamente sul Pi Wallet ufficiale senza custodia interna. Per gli scambi dal vivo usa sempre i Punti di Incontro Certificati (OpenStreetMap) e la Stretta di Mano con PIN a 4 cifre.",
          suggestedAction: { label: "Apri Hub Pi Network", target: "pi-hub" },
        },
      ]);
    } else {
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: `Nessuna corrispondenza diretta trovata nei ${listings.length} annunci e ${guides.length} guide per "${text}".\n(Servizio LLM conversazionale remoto non configurato su questo server: prova parole chiave presenti in bacheca o nelle guide).`,
          suggestedAction: { label: "Sfoglia Bacheca Completa", target: "bacheca" },
        },
      ]);
    }
    setIsThinking(false);
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputQuery.trim();
    if (!text && !attachedImage) return;
    sendToBackendAndClassify(text, userCoords, attachedImage);
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="space-y-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Assistente Discreto Locale</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Motore Locale
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                {userCoords ? (
                  <>
                    <span>GPS: {userCoords.lat.toFixed(3)}, {userCoords.lng.toFixed(3)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-cyan-400">Posizione reale attiva</span>
                  </>
                ) : (
                  <span className="text-amber-400">
                    {gpsStatus === "waiting" ? "Rilevamento GPS..." : "GPS non autorizzato (ricerca globale senza coordinate fittizie)"}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>{userCoords ? "Haversine Attivo" : "Solo Testo"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          "Annunci vicini",
          "Guide Salvavatutto",
          "9 Forme di Interazione",
          "Punti sicuri e Pi Wallet",
        ].map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputQuery(promptText);
              sendToBackendAndClassify(promptText, userCoords);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 whitespace-nowrap transition-colors text-[11px] cursor-pointer"
          >
            {promptText}
          </button>
        ))}
      </div>

      <div className="h-72 overflow-y-auto space-y-3 pr-2 text-xs">
        <WelcomeTechnologyCard />
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {m.sender === "ai" ? (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Bot className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                Tu
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === "user"
                  ? "bg-cyan-500 text-slate-950 font-medium rounded-tr-none"
                  : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
              }`}
            >
              {m.imageUrl && (
                <div className="mb-2.5">
                  <img
                    src={m.imageUrl}
                    alt={m.imageName || "Foto allegata"}
                    className="max-h-48 max-w-full rounded-xl object-cover border border-slate-800 shadow-md"
                  />
                  {m.imageName && (
                    <span
                      className={`text-[10px] mt-1 block truncate ${
                        m.sender === "user" ? "text-slate-900 font-semibold" : "text-slate-400"
                      }`}
                    >
                      📎 {m.imageName}
                    </span>
                  )}
                </div>
              )}

              {m.is18PlusNotice && (
                <div className="mb-2 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Sezione 18+: Scheda Tecnica Informativa Oggettiva</span>
                </div>
              )}

              <p className="whitespace-pre-line font-sans">{m.text}</p>

              {m.suggestedAction && (
                <button
                  onClick={() => onNavigateToSection(m.suggestedAction!.target)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[11px] transition-all cursor-pointer"
                >
                  <span>{m.suggestedAction.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
            Ricerca tra annunci, guide e prossimità GPS in corso...
          </div>
        )}
      </div>

      {attachedImage && (
        <div className="flex items-center gap-2.5 p-2 px-3 bg-slate-950 rounded-xl border border-cyan-500/40 text-xs text-slate-300">
          <img
            src={attachedImage.dataUrl}
            alt="Anteprima"
            className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-200 truncate">{attachedImage.name}</p>
            <p className="text-[10px] text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Immagine pronta per l'invio
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateAttachedImage(null)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Rimuovi foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleAsk} className="pt-2 flex items-center gap-2">
        <button
          type="button"
          id="photo-button"
          onClick={() => fileInputRef.current?.click()}
          title="Scatta foto o seleziona immagine dal dispositivo"
          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          id="photo-file-input"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {sttSupported && (
          <button
            type="button"
            id="mic-button"
            onClick={toggleSpeechRecognition}
            title={isListening ? "In ascolto (Parla ora)..." : "Attiva riconoscimento vocale"}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border shrink-0 ${
              isListening
                ? "bg-red-500 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/40 scale-105"
                : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800"
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        )}

        <input
          ref={chatInputRef}
          id="chat-input"
          type="text"
          placeholder={
            isListening
              ? "Ascolto vocale attivo... (parla adesso)"
              : attachedImage
              ? "Aggiungi note per la foto o premi Invia..."
              : "Cerca annunci, guide o parla al microfono..."
          }
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className={`flex-1 px-4 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
            isListening ? "border-red-500/80 bg-red-950/10" : "border-slate-800 focus:border-cyan-500"
          }`}
        />

        <button
          type="submit"
          id="ask-discreet-ai-btn"
          disabled={isThinking}
          className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Invia</span>
        </button>
      </form>
    </div>
  );
};

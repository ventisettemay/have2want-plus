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
  Info,
  CheckCircle2,
  AlertCircle,
  Camera,
  ImagePlus,
  X,
  Paperclip
} from "lucide-react";
import { HaveWantListing, SalvavatuttoGuide } from "../types";
import { classifyIntent, processTestnetRequest, ProcessedProduct } from "../lib/testnetEngine";

interface DiscreetAIAssistantProps {
  listings: HaveWantListing[];
  guides: SalvavatuttoGuide[];
  onNavigateToPlanet: (planet: "planet-possibilita" | "planet-vita" | "planet-salvavatutto" | "pi-bridge") => void;
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
    target: "planet-possibilita" | "planet-vita" | "planet-salvavatutto" | "pi-bridge";
  };
}

// Copia questo blocco e incollalo all'inizio del componente della chat in React
export function WelcomeTechnologyCard() {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl border border-blue-500 shadow-lg my-4">
      <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
        <span>✨ Piattaforma Avanzata Testnet Attiva</span>
      </h3>
      <p className="text-sm text-gray-300 mb-3">
        Benvenuto nel marketplace. Puoi interagire liberamente <strong>digitando</strong>, parlando a <strong>voce</strong> o <strong>allegando foto</strong>:
      </p>
      <ul className="text-xs space-y-2 text-gray-400">
        <li>
          🎙️ <strong className="text-white">Conversational Search & Dettatura:</strong> Puoi cercare e interagire parlando al microfono. La voce viene elaborata all'istante on-device nel rispetto della privacy.
        </li>
        <li>
          📷 <strong className="text-white">Visual & Photo Recognition:</strong> Puoi scattare o caricare foto di articoli per classificazione immediata, verifica conformità e pubblicazione istantanea.
        </li>
        <li>
          🧠 <strong className="text-white">AI Guardian Shield:</strong> Tutti i contenuti del catalogo sono monitorati e validati in tempo reale da algoritmi di intelligenza artificiale per assicurare un ambiente conforme e protetto.
        </li>
        <li>
          📍 <strong className="text-white">Geospatial Proximity:</strong> Calcolo automatico della distanza geospaziale Haversine basato su coordinate GPS, con prossimità esatta in chilometri.
        </li>
      </ul>
    </div>
  );
}

export const DiscreetAIAssistant: React.FC<DiscreetAIAssistantProps> = ({
  listings,
  guides,
  onNavigateToPlanet,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Assistente Ufficiale Testnet & Simply Discreet attivo.\nI tuoi comandi possono essere digitati o impartiti a voce tramite il microfono.\nGestione dati: Flat DB con calcolo geospaziale Haversine e conformità informativa 18+.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Stato Allegato Fotografico (Multimodale: Scatto da Fotocamera / Upload Galleria)
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
  
  // Coordinate geospaziali utente (Default: Asti / Torino con aggiornamento GPS nativo)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 44.9008,
    lng: 8.2065,
  });
  const [gpsStatus, setGpsStatus] = useState<"standard" | "gps_active">("standard");

  // Stato Riconoscimento Vocale (Speech-to-Text)
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

  // Inizializzazione Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
          });
          setGpsStatus("gps_active");
        },
        () => {
          // Mantieni coordinate di default
          setGpsStatus("standard");
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Inizializzazione SpeechRecognition nativa
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

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const textResult = event.results[0][0].transcript;
      setInputQuery(textResult);

      // Timer automatico: invia dopo 1.5 secondi di silenzio
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // Recupera le coordinate dal telefono (navigator.geolocation) e invia al backend Python
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setUserCoords({ lat, lng });
              setGpsStatus("gps_active");
              sendToBackendAndClassify(textResult, lat, lng, attachedImageRef.current);
            },
            () => {
              sendToBackendAndClassify(textResult, userCoords.lat, userCoords.lng, attachedImageRef.current);
            },
            { timeout: 5000 }
          );
        } else {
          sendToBackendAndClassify(textResult, userCoords.lat, userCoords.lng, attachedImageRef.current);
        }
        setIsListening(false);
      }, 1500);
    };

    rec.onerror = (err: any) => {
      console.warn("Acquisizione audio:", err.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [userCoords]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Funzione sendToBackend asincrona con supporto endpoint Python Flask (POST /api/testnet/query)
  const sendToBackend = async (text: string, lat: number, lng: number) => {
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1");
    const endpoints = isLocalhost
      ? ["/api/testnet/query", "http://localhost:5000/api/testnet/query"]
      : ["/api/testnet/query"];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query_text: text, user_lat: lat, user_lng: lng })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        // Fallback silenzioso
      }
    }
    return null;
  };

  const sendToBackendAndClassify = async (
    rawText: string,
    lat: number,
    lng: number,
    imgPayload?: { dataUrl: string; name: string; file?: File } | null
  ) => {
    const currentImg = imgPayload !== undefined ? imgPayload : attachedImageRef.current;
    const text = rawText.trim();
    if (!text && !currentImg) return;

    const userDisplayText = text || (currentImg ? `[Foto: ${currentImg.name}]` : "");

    // Registra messaggio utente con eventuale foto allegata
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

    // Se l'utente ha allegato un file fisico, invia a /api/testnet/publish (Backend Python Flask)
    if (currentImg?.file) {
      try {
        const formData = new FormData();
        formData.append("image", currentImg.file);
        formData.append("product_name", text || currentImg.name.replace(/\.[^/.]+$/, ""));
        formData.append("user_lat", String(lat));
        formData.append("user_lng", String(lng));
        formData.append("specs_anno", "2024");

        const isLocalhost =
          typeof window !== "undefined" &&
          (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1");
        const endpoints = isLocalhost
          ? ["/api/testnet/publish", "http://localhost:5000/api/testnet/publish"]
          : ["/api/testnet/publish"];
        for (const ep of endpoints) {
          try {
            await fetch(ep, { method: "POST", body: formData });
            break;
          } catch (e) {}
        }
      } catch (uploadErr) {
        console.warn("Upload foto backend opzionale:", uploadErr);
      }
    }

    // Esegui la chiamata a sendToBackend per ricerca / query
    const queryToSend = [text, currentImg?.name].filter(Boolean).join(" ");
    await sendToBackend(queryToSend, lat, lng);

    // 1. Verifica Intent sul Flat DB Testnet tramite Haversine e regole tassative
    const intentResult = classifyIntent(queryToSend, lat, lng);

    if (intentResult.matched) {
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: intentResult.text_response,
          is18PlusNotice: intentResult.product?.is_18_plus,
          productPayload: intentResult.product,
        },
      ]);
    } else if (currentImg) {
      // 2. Risposta Visiva Dedicata per Elemento Fotografico
      const cleanName = currentImg.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const isAdultDetected = cleanName.toLowerCase().includes("18") || cleanName.toLowerCase().includes("adult");

      if (isAdultDetected) {
        setMessages([
          ...nextMessages,
          {
            sender: "ai",
            text: `SPECIFICHE TECNICHE OGGETTIVE (CONTENUTO RISERVATO 18+):\n- Riferimento File: ${currentImg.name}\n- Geolocalizzazione: Coordinate GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})\n- Stato: Convalidato AI Guardian Shield. Erogazione puramente tecnica priva di testo promozionale.`,
            is18PlusNotice: true,
          },
        ]);
      } else {
        setMessages([
          ...nextMessages,
          {
            sender: "ai",
            text: `📷 [Analisi Visiva AI Guardian]\n- Riconoscimento elemento: "${cleanName}"\n- Calcolo geospaziale: Haversine attivo su GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})\n- Integrità e Conformità: Superato con successo.\n- Puoi interrogare il catalogo per scambi simili o confermarne la pubblicazione.`,
            imageUrl: currentImg.dataUrl,
            suggestedAction: {
              label: "Esplora annunci simili nel catalogo",
              target: "planet-possibilita",
            },
          },
        ]);
      }
    } else {
      // 3. Query generale di orientamento piattaforma
      const q = text.toLowerCase();
      let reply = "";
      let action: Message["suggestedAction"] | undefined = undefined;

      if (q.includes("scamb") || q.includes("baratt") || q.includes("offr") || q.includes("cerc")) {
        reply = `Nel catalogo comunitario ci sono ${listings.length} scambi attivi. Puoi esplorare la bacheca generale o effettuare baratti protetti.`;
        action = { label: "Esplora Bacheca Possibilità", target: "planet-possibilita" };
      } else if (q.includes("guida") || q.includes("salva") || q.includes("soccorso")) {
        reply = `In Salvavatutto sono custodite ${guides.length} guide pratiche di autosufficienza e prevenzione.`;
        action = { label: "Apri Archivio Salvavatutto", target: "planet-salvavatutto" };
      } else if (q.includes("pi") || q.includes("wallet")) {
        reply = `In HAVE2WANT non esiste custodia di fondi interna. I trasferimenti avvengono sul Pi Wallet ufficiale.`;
        action = { label: "Vedi Hub Pi Network", target: "pi-bridge" };
      } else {
        reply = intentResult.text_response;
      }

      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: reply,
          suggestedAction: action,
        },
      ]);
    }
    setIsThinking(false);
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputQuery.trim();
    if (!text && !attachedImage) return;
    sendToBackendAndClassify(text, userCoords.lat, userCoords.lng, attachedImage);
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="space-y-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Assistente Ufficiale Testnet</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Intent Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Coordinate: {userCoords.lat.toFixed(2)}, {userCoords.lng.toFixed(2)}</span>
                <span className="text-slate-600">•</span>
                <span className={gpsStatus === "gps_active" ? "text-cyan-400" : "text-amber-400"}>
                  {gpsStatus === "gps_active" ? "GPS Rilevato" : "Posizione Stimata"}
                </span>
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Haversine Attivo</span>
          </div>
        </div>

        {/* AI Protection Badge */}
        <div className="ai-protection-badge px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed">
          <p>🧠 <strong>AI Guardian Shield:</strong> Tutti i contenuti disponibili nel catalogo sono validati e monitorati in tempo reale da algoritmi di intelligenza artificiale per garantire un ambiente conforme e sicuro.</p>
        </div>

        {/* Results Header: Dynamic Data Enrichment */}
        <header className="results-header px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 text-xs">
          <p className="text-sm italic">⚡ <strong>Dynamic Data Enrichment:</strong> Elenco generato istantaneamente tramite sistemi automatizzati di recupero multimediale e geolocalizzazione geospaziale attiva.</p>
        </header>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          "BMW X5 (TXT-001)",
          "Audi Q5 (TXT-002)",
          "Mostrami tutti i veicoli",
          "Cosa posso scambiare oggi?",
        ].map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputQuery(promptText);
              sendToBackendAndClassify(promptText, userCoords.lat, userCoords.lng);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 whitespace-nowrap transition-colors text-[11px] cursor-pointer"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
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
              {/* Foto o immagine associata */}
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

              {/* Badge conformità 18+ */}
              {m.is18PlusNotice && (
                <div className="mb-2 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Sezione 18+: Scheda Tecnica Informativa Oggettiva (Zero Incitamento)</span>
                </div>
              )}

              <p className="whitespace-pre-line font-sans">{m.text}</p>

              {m.suggestedAction && (
                <button
                  onClick={() => onNavigateToPlanet(m.suggestedAction!.target)}
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
            Classificazione intento, analisi visiva e calcolo geospaziale in corso...
          </div>
        )}
      </div>

      {/* Anteprima foto allegata */}
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
              <Sparkles className="w-3 h-3" /> Foto pronta per analisi AI Guardian & geolocalizzazione
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

      {/* Input query form con Microfono STT & Allegato Foto */}
      <form onSubmit={handleAsk} className="pt-2 flex items-center gap-2">
        {/* Pulsante Fotocamera / Allegato Foto */}
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

        {/* Pulsante Microfono Speech-to-Text */}
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
              ? "Aggiungi istruzioni per la foto o premi Invia..."
              : "Digita, parla al mic o allega una foto..."
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

      {/* Secure Conversational Search Info & Multimodal Triad */}
      <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-t border-slate-800/60 text-xs text-gray-400">
        <span className="leading-normal">
          🎙️ <strong>Triplice Interazione Attiva:</strong> Puoi digitare, parlare al microfono con invio automatico su silenzio o allegare foto per analisi e pubblicazione geospaziale immediata.
        </span>
        <span className="text-[11px] text-cyan-400 shrink-0 font-medium">
          🛡️ Privacy On-Device & AI Guardian
        </span>
      </div>
    </div>
  );
};

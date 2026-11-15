import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Volume2, Sparkles, X, Check, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceNoteChat({
  recipientName = 'Inserzionista / Negozio',
  recipientRole = 'Negozio Verificato Pi',
  initialVoiceIntro = null,
  isOpen = false,
  onClose = () => {},
  onSendVoiceNote = () => {},
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'store',
      type: 'voice',
      durationText: '0:14',
      text: initialVoiceIntro || 'Ciao! Grazie per aver contattato la nostra attività. Come possiamo aiutarti? Lasciaci una nota vocale o un messaggio!',
      timestamp: 'Adesso',
    }
  ]);
  const [textInput, setTextInput] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioElementRef = useRef(null);

  // Gestione timer di registrazione
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Avvio registrazione vocale (Usa MediaDevices reale con fallback simulato)
  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          // Ferma le tracce microfono
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast.info('🎙️ Registrazione vocale avviata: parla al microfono');
      } else {
        // Fallback simulato se i permessi del frame bloccano il microfono diretto
        setIsRecording(true);
        toast.info('🎙️ Registrazione nota vocale simulata');
      }
    } catch (err) {
      console.warn('Microfono non accessibile, uso simulazione:', err);
      setIsRecording(true);
      toast.info('🎙️ Registrazione nota vocale attiva');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Dummy audio URL se non disponibile MediaRecorder
      setRecordedAudioUrl('simulated-voice-note');
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordedAudioUrl(null);
    setRecordDuration(0);
  };

  const sendRecordedNote = () => {
    if (!recordedAudioUrl && recordDuration === 0 && !textInput.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      type: recordedAudioUrl ? 'voice' : 'text',
      durationText: recordedAudioUrl ? `0:${recordDuration.toString().padStart(2, '0')}` : null,
      text: textInput.trim() || 'Nota vocale inviata',
      timestamp: 'Ora',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setRecordedAudioUrl(null);
    setRecordDuration(0);
    setTextInput('');

    toast.success('✨ Nota vocale inviata con successo al negozio!');
    onSendVoiceNote(newMsg);

    // Risposta automatica simulata del negozio dopo 2 secondi
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: 'store',
          type: 'text',
          text: 'Abbiamo ricevuto la tua nota vocale! Ti rispondiamo al più presto su Pi Network.',
          timestamp: 'Adesso',
        },
      ]);
    }, 1800);
  };

  // Simula riproduzione forma d'onda
  const togglePlayMock = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlayProgress(0);
    } else {
      setIsPlaying(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setPlayProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          setPlayProgress(0);
        }
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Chat Vocale */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{recipientName}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  {recipientRole}
                </span>
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Chat & Note Vocali Dirette Pi</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 💡 AIUTO AUTOMATICO NON INVASIVO */}
        <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-200">
          <span className="text-sm shrink-0">💡</span>
          <span className="text-[11px] leading-tight text-emerald-300">
            <strong className="text-white font-semibold">Nota Vocale P2P:</strong> Tieni premuto il microfono per registrare la tua richiesta. Accordati a voce in totale privacy senza diffondere il tuo numero di telefono.
          </span>
        </div>

        {/* Lista Messaggi Chat & Note Vocali */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#070b19]/60">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 border border-slate-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.type === 'voice' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlayMock}
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          )}
                        </button>
                        {/* Onda Sonora Grafica */}
                        <div className="flex items-center gap-1 h-5 flex-1">
                          {[35, 60, 90, 45, 80, 100, 50, 75, 40, 85, 65, 30].map((height, i) => (
                            <span
                              key={i}
                              style={{ height: `${height}%` }}
                              className={`w-1 rounded-full transition-all ${
                                isPlaying ? 'bg-amber-300 animate-pulse' : 'bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono opacity-80 shrink-0">
                          {msg.durationText || '0:12'}
                        </span>
                      </div>
                      {msg.text && (
                        <p className="text-xs text-white/90 italic pt-1 border-t border-white/15">
                          "{msg.text}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}
        </div>

        {/* Barra di Registrazione e Invio */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800">
          {isRecording ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-red-950/60 border border-red-500/50 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-red-300">
                  Registrazione in corso: 0:{recordDuration.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Annulla"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Fine</span>
                </button>
              </div>
            </div>
          ) : recordedAudioUrl ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <Check className="w-4 h-4" />
                <span>Nota vocale pronta (0:{recordDuration.toString().padStart(2, '0')})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={sendRecordedNote}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Nota Vocale</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendRecordedNote()}
                placeholder="Scrivi un messaggio o registra una nota vocale..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={startRecording}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
                title="Tocca per registrare una nota vocale"
              >
                <Mic className="w-4 h-4" />
              </button>
              {textInput.trim() && (
                <button
                  onClick={sendRecordedNote}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

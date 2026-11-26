import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, X, Check, Store, AlertCircle, Video, Users, MessageCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { sendChatMessageToCloud, subscribeToChatMessages } from '@/lib/firestoreService';

const DEFAULT_NEIGHBORHOOD_GROUPS = [
  { id: 'grp_centro_storico', name: 'Gruppo Quartiere Centro', area: 'Scambi & Avvisi Rionali' },
  { id: 'grp_orto_km0', name: 'Gruppo Vicinato Km 0', area: 'Orti, Attrezzi & Surplus' },
  { id: 'grp_riparazioni', name: 'Gruppo Riparazioni & Mestieri', area: 'Aiuto Reciproco Locale' },
];

export default function VoiceNoteChat({
  chatRoomId = '',
  recipientName = 'Inserzionista / Negozio',
  recipientRole = 'Negozio Verificato Pi',
  initialVoiceIntro = null,
  isOpen = false,
  onClose = () => {},
  onSendVoiceNote = () => {},
  onOpenVideoChat = null,
}) {
  const [chatScope, setChatScope] = useState('PRIVATE'); // 'PRIVATE' | 'GROUPS'
  const [neighborhoodGroups, setNeighborhoodGroups] = useState(DEFAULT_NEIGHBORHOOD_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState(DEFAULT_NEIGHBORHOOD_GROUPS[0].id);
  const [newGroupName, setNewGroupName] = useState('');

  const activeGroup =
    neighborhoodGroups.find((g) => g.id === selectedGroupId) || neighborhoodGroups[0];

  const effectiveRoomId =
    chatScope === 'GROUPS'
      ? `neighborhood_${selectedGroupId}`
      : chatRoomId ||
        `room_${String(recipientName || 'pioneer')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .slice(0, 48)}`;

  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [micError, setMicError] = useState(null);
  const [cloudChatStatus, setCloudChatStatus] = useState('checking'); // 'synced' | 'local_only' | 'checking'
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'store',
      type: 'text',
      text:
        initialVoiceIntro ||
        'Ciao! Puoi inviare un messaggio scritto o registrare una nota vocale reale dal tuo microfono.',
      timestamp: 'Adesso',
    },
  ]);
  const [textInput, setTextInput] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioElementRef = useRef(null);
  const createdUrlsRef = useRef([]);

  // Reset audio playback on close/unmount and revoke Blob URLs
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      createdUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // ignore
        }
      });
      createdUrlsRef.current = [];
    };
  }, []);

  // Sottoscrizione Firestore alla stanza chat quando disponibile e autorizzata
  useEffect(() => {
    if (!isOpen) return;
    setCloudChatStatus('checking');
    const unsub = subscribeToChatMessages(
      effectiveRoomId,
      (remoteMsgs) => {
        setCloudChatStatus('synced');
        if (remoteMsgs && remoteMsgs.length > 0) {
          setChatMessages((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));
            remoteMsgs.forEach((rm) => {
              const existing = byId.get(rm.id);
              byId.set(rm.id, {
                id: rm.id,
                sender: 'user',
                type: rm.type === 'voice' ? 'voice' : 'text',
                audioUrl: existing?.audioUrl || null,
                durationText: rm.durationText || null,
                text: rm.text || '',
                timestamp: rm.createdAt
                  ? new Date(rm.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                  : 'Cloud',
              });
            });
            return Array.from(byId.values());
          });
        }
      },
      () => {
        setCloudChatStatus('local_only');
      }
    );
    return () => unsub();
  }, [isOpen, effectiveRoomId]);

  // Gestione timer di registrazione
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Avvio registrazione vocale reale (MediaDevices + MediaRecorder, nessuna simulazione)
  const startRecording = async () => {
    setMicError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      const msg = 'Registrazione vocale non supportata da questo browser o contesto non sicuro.';
      setMicError(msg);
      toast.error(msg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          const url = URL.createObjectURL(audioBlob);
          createdUrlsRef.current.push(url);
          setRecordedAudioUrl(url);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast.info('🎙️ Registrazione vocale avviata: parla al microfono');
    } catch (err) {
      const msg =
        'Accesso al microfono negato o non disponibile. Consenti il microfono nelle impostazioni del browser.';
      setMicError(msg);
      toast.error(msg);
      console.warn('Errore microfono reale:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
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

  const sendRecordedNote = async () => {
    if (!recordedAudioUrl && !textInput.trim()) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      type: recordedAudioUrl ? 'voice' : 'text',
      audioUrl: recordedAudioUrl || null,
      durationText: recordedAudioUrl
        ? `0:${recordDuration.toString().padStart(2, '0')}`
        : null,
      text: textInput.trim() || (recordedAudioUrl ? 'Nota vocale registrata' : ''),
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setRecordedAudioUrl(null);
    setRecordDuration(0);
    setTextInput('');

    const cloudRes = await sendChatMessageToCloud(effectiveRoomId, {
      id: newMsg.id,
      senderName: 'Pioneer Locale',
      type: newMsg.type,
      text: newMsg.text,
      durationText: newMsg.durationText,
    });
    if (cloudRes.ok) {
      setCloudChatStatus('synced');
      toast.success('Messaggio sincronizzato su Firestore');
    } else {
      setCloudChatStatus('local_only');
      toast.success(
        newMsg.type === 'voice'
          ? '🎙️ Nota vocale registrata nella sessione corrente'
          : '✉️ Messaggio salvato nella sessione corrente'
      );
    }
    onSendVoiceNote(newMsg);
  };

  // Riproduzione audio reale tramite elemento HTMLAudioElement
  const togglePlayRealAudio = (msg) => {
    if (!msg.audioUrl) {
      toast.error('File audio non disponibile per questo messaggio');
      return;
    }

    if (playingMsgId === msg.id && audioElementRef.current) {
      audioElementRef.current.pause();
      setPlayingMsgId(null);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    const audio = new Audio(msg.audioUrl);
    audioElementRef.current = audio;
    audio.onended = () => {
      setPlayingMsgId(null);
    };
    audio.onerror = () => {
      setPlayingMsgId(null);
      toast.error('Impossibile riprodurre la nota vocale su questo dispositivo');
    };
    audio
      .play()
      .then(() => {
        setPlayingMsgId(msg.id);
      })
      .catch(() => {
        setPlayingMsgId(null);
        toast.error('Riproduzione audio bloccata dal browser');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Chat Vocale */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              {chatScope === 'GROUPS' ? <Users className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                <span className="truncate">
                  {chatScope === 'GROUPS' ? activeGroup?.name : recipientName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  {chatScope === 'GROUPS' ? 'Gruppo di Quartiere' : recipientRole}
                </span>
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  {chatScope === 'GROUPS'
                    ? activeGroup?.area || 'Canale rionale condiviso'
                    : 'Chat Privata & Note Vocali (Microfono Locale)'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenVideoChat && (
              <button
                type="button"
                onClick={() => onOpenVideoChat({
                  name: chatScope === 'GROUPS' ? activeGroup?.name : recipientName,
                  roomId: effectiveRoomId,
                })}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-md"
                title="Apri Videochat separata con questo contatto o gruppo"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videochat</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Separazione netta: Chat Privata vs Gruppi di Quartiere */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChatScope('PRIVATE')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              chatScope === 'PRIVATE'
                ? 'bg-[#00ff66] text-black'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat Privata</span>
          </button>
          <button
            type="button"
            onClick={() => setChatScope('GROUPS')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              chatScope === 'GROUPS'
                ? 'bg-sky-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gruppi di Quartiere</span>
          </button>
        </div>

        {chatScope === 'GROUPS' && (
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {neighborhoodGroups.map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setSelectedGroupId(grp.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer border ${
                    selectedGroupId === grp.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {grp.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Crea nuovo gruppo di quartiere..."
                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newGroupName.trim();
                  if (!trimmed) return;
                  const newId = `grp_${Date.now()}`;
                  setNeighborhoodGroups((prev) => [
                    ...prev,
                    { id: newId, name: trimmed, area: 'Gruppo locale creato da te' },
                  ]);
                  setSelectedGroupId(newId);
                  setNewGroupName('');
                  toast.success(`Gruppo di quartiere "${trimmed}" attivo`);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Crea</span>
              </button>
            </div>
          </div>
        )}

        {/* Avviso trasparente su persistenza Firestore / Kilo */}
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/25 flex items-center gap-2 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong className="text-white font-semibold">
              {cloudChatStatus === 'synced' ? 'Firestore attivo:' : 'Nota di stato:'}
            </strong>{' '}
            {cloudChatStatus === 'synced'
              ? 'Microfono MediaRecorder e sincronizzazione Firestore attivi.'
              : <>Microfono reale MediaRecorder attivo. La persistenza remota richiede regole Firestore su <code className="text-amber-300">chats/messages</code> lato Kilo.</>}
          </span>
        </div>

        {/* Lista Messaggi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#070b19]/60">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isMsgPlaying = playingMsgId === msg.id;
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
                  {msg.type === 'voice' && msg.audioUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePlayRealAudio(msg)}
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
                          title={isMsgPlaying ? 'Metti in pausa' : 'Riproduci nota vocale reale'}
                        >
                          {isMsgPlaying ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          )}
                        </button>
                        <div className="flex items-center gap-1 h-5 flex-1">
                          {[35, 60, 90, 45, 80, 100, 50, 75, 40, 85, 65, 30].map((height, i) => (
                            <span
                              key={i}
                              style={{ height: `${height}%` }}
                              className={`w-1 rounded-full transition-all ${
                                isMsgPlaying ? 'bg-amber-300 animate-pulse' : 'bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono opacity-80 shrink-0">
                          {msg.durationText || '0:00'}
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

          {micError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{micError}</span>
            </div>
          )}
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
                  type="button"
                  onClick={cancelRecording}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Annulla"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
                <button
                  type="button"
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
                  type="button"
                  onClick={cancelRecording}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 cursor-pointer"
                  title="Elimina registrazione"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={sendRecordedNote}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Salva Nota Vocale</span>
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
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
                title="Registra nota vocale reale dal microfono"
              >
                <Mic className="w-4 h-4" />
              </button>
              {textInput.trim() && (
                <button
                  type="button"
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

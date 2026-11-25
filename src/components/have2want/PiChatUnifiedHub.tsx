import React, { useState, useCallback } from 'react';
import { MessageCircle, Video, X, Mic, Settings } from 'lucide-react';
import VoiceNoteChat from './VoiceNoteChat';
import VideoChatModal from './VideoChatModal';
import { FREE_SERVICES_CONFIG } from '@/lib/freeServicesConfig';
import { getDynamicIceServers } from '@/lib/turnService';

interface PiChatUnifiedHubProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentUserId?: string;
  recipientName?: string;
  recipientRole?: string;
  listingId?: string;
  initialVoiceIntro?: string | null;
  onSendVoiceNote?: (msg: any) => void;
}

export const PiChatUnifiedHub: React.FC<PiChatUnifiedHubProps> = ({
  isOpen = true,
  onClose = () => {},
  currentUserId = 'current_user',
  recipientName = 'Utente / Creator',
  recipientRole = 'Community Member',
  listingId = 'pi_chat_room',
  initialVoiceIntro = null,
  onSendVoiceNote = () => {},
}) => {
  const [activeMode, setActiveMode] = useState<'CHAT_VOICE' | 'VIDEO_CALL'>('CHAT_VOICE');
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(FREE_SERVICES_CONFIG.iceServers);
  const [isLoadingIce, setIsLoadingIce] = useState(false);

  // Carica ICE servers dinamici (STUN Google + TURN Metered/OpenRelay) all'avvio
  const loadIceServers = useCallback(async () => {
    setIsLoadingIce(true);
    try {
      const dynamicServers = await getDynamicIceServers();
      setIceServers(dynamicServers);
    } catch (err) {
      console.warn('[PiChatUnifiedHub] Errore caricamento ICE servers dinamici, uso fallback statico:', err);
    } finally {
      setIsLoadingIce(false);
    }
  }, []);

  React.useEffect(() => {
    loadIceServers();
  }, [loadIceServers]);

  const handleCloseVideo = useCallback(() => {
    setActiveMode('CHAT_VOICE');
  }, []);

  const handleCloseAll = useCallback(() => {
    if (activeMode === 'VIDEO_CALL') {
      setActiveMode('CHAT_VOICE');
    } else {
      onClose();
    }
  }, [activeMode, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header Unificato */}
        <div className="px-4 py-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{recipientName}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                  {recipientRole}
                </span>
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>PI_CHAT_SAT — Chat, Note Vocali, Videochiamata WebRTC</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab Chat & Vocale */}
            <button
              type="button"
              onClick={() => setActiveMode('CHAT_VOICE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMode === 'CHAT_VOICE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat & Vocale</span>
            </button>

            {/* Tab Videochiamata */}
            <button
              type="button"
              onClick={() => setActiveMode('VIDEO_CALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMode === 'VIDEO_CALL'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Videochiamata</span>
              {isLoadingIce && <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />}
            </button>

            <button
              onClick={handleCloseAll}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer shrink-0"
              title={activeMode === 'VIDEO_CALL' ? 'Torna alla chat' : 'Chiudi'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenuto: Chat Vocale o Videochiamata */}
        <div className="flex-1 overflow-hidden relative">
          {activeMode === 'CHAT_VOICE' ? (
            <VoiceNoteChat
              isOpen={true}
              onClose={handleCloseAll}
              recipientName={recipientName}
              recipientRole={recipientRole}
              initialVoiceIntro={initialVoiceIntro}
              onSendVoiceNote={onSendVoiceNote}
            />
          ) : (
            <VideoChatModal
              isOpen={true}
              onClose={handleCloseVideo}
              listingId={listingId}
              otherUserName={recipientName}
              currentUserId={currentUserId}
              iceServers={iceServers}
            />
          )}
        </div>

        {/* Footer info servizi gratuiti */}
        <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-900 text-[10px] text-zinc-500 flex items-center justify-between">
          <span>
            WebRTC: STUN Google + TURN OpenRelay (metered.ca) — Zero costi, P2P client-side
          </span>
          <span className="text-zinc-400">PI_CHAT_SAT · STARLINK-COMM</span>
        </div>
      </div>
    </div>
  );
};

export default PiChatUnifiedHub;
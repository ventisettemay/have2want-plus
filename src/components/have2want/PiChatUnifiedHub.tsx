import React, { useState, useEffect } from 'react';
import { MessageCircle, Video, X } from 'lucide-react';
import VoiceNoteChat from './VoiceNoteChat';
import { VideoChatModal } from './VideoChatModal';
import { GOOGLE_PUBLIC_STUN_SERVERS, IceServerEntry } from '@/lib/freeServicesConfig';
import { getDynamicIceServers } from '@/lib/turnService';

const VoiceNoteChatComponent = VoiceNoteChat as React.ComponentType<Record<string, any>>;

export interface PiChatUnifiedHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'CHAT' | 'VIDEO';
  chatRoomId?: string;
  recipientName?: string;
  recipientRole?: string;
  initialVoiceIntro?: string | null;
  currentUserId?: string;
  onSendVoiceNote?: (payload: any) => void;
}

export default function PiChatUnifiedHub({
  isOpen,
  onClose,
  initialTab = 'CHAT',
  chatRoomId = 'h2w_p2p',
  recipientName = 'Inserzionista / Negozio',
  recipientRole = 'Negozio Verificato Pi',
  initialVoiceIntro = null,
  currentUserId = 'pioneer_local',
  onSendVoiceNote,
}: PiChatUnifiedHubProps) {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'VIDEO'>(initialTab);
  const [iceServers, setIceServers] = useState<IceServerEntry[]>(GOOGLE_PUBLIC_STUN_SERVERS);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getDynamicIceServers()
      .then((servers) => {
        if (active && Array.isArray(servers) && servers.length > 0) {
          setIceServers(servers);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="pi-chat-unified-hub"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md"
    >
      {/* Barra superiore unificata Chat / Videochiamata */}
      <div className="relative z-[60] w-full max-w-2xl mx-auto mt-2 px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab('CHAT')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'CHAT'
                ? 'bg-[#00ff66] text-black'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat &amp; Vocali</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VIDEO')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'VIDEO'
                ? 'bg-[#00ff66] text-black'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videochiamata</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer flex items-center justify-center shadow-xl"
          aria-label="Chiudi Chat Unificata"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative">
        {activeTab === 'CHAT' ? (
          <VoiceNoteChatComponent
            isOpen={true}
            onClose={onClose}
            chatRoomId={chatRoomId}
            recipientName={recipientName}
            recipientRole={recipientRole}
            initialVoiceIntro={initialVoiceIntro}
            onSendVoiceNote={onSendVoiceNote}
            onOpenVideoChat={() => setActiveTab('VIDEO')}
          />
        ) : (
          <VideoChatModal
            isOpen={true}
            onClose={() => setActiveTab('CHAT')}
            listingId={chatRoomId}
            otherUserName={recipientName}
            currentUserId={currentUserId}
            iceServersOverride={iceServers}
          />
        )}
      </div>
    </div>
  );
}

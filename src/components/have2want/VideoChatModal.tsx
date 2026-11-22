import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Video, Mic, MicOff, Settings, Minimize, Maximize2, Volume2, VolumeX, Users, MoreHorizontal, Monitor, PhoneOff } from "lucide-react";
import { getDynamicIceServers } from '@/lib/turnService';

interface VideoChatModalProps {
  isOpen?: boolean;
  onClose: () => void;
  listingId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  currentUserId?: string;
}

export function VideoChatModal({ 
  isOpen = true, 
  onClose, 
  listingId = "h2w_call", 
  otherUserName = "Fornitore Partner", 
  otherUserAvatar,
  currentUserId
}: VideoChatModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]);

  useEffect(() => {
    const loadIceServers = async () => {
      const servers = await getDynamicIceServers();
      setIceServers(servers);
    };
    loadIceServers();
  }, []);

  useEffect(() => {
    if (isOpen) {
      initializeMedia();
      initializePeerConnection();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Errore accesso media:', err);
    }
  };

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers });
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    setPeerConnection(pc);
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setConnectionState('disconnected');
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(videoTrack);
        videoTrack.onended = () => setIsScreenSharing(false);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    } else {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
    }
  };

  const handleMinimize = () => {
    // Logica per minimizzare
  };

  const handleMaximize = () => {
    // Logica per massimizzare
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="w-full max-w-4xl h-[90vh] max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">{otherUserName}</h3>
                <p className="text-xs text-slate-400">Videochiamata su annuncio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : connectionState === 'connecting' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                {connectionState === 'connected' ? 'Connesso' : connectionState === 'connecting' ? 'Connessione...' : 'Disconnesso'}
              </span>
              <button onClick={handleMaximize} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Massimizza">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button onClick={handleMinimize} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Minimizza">
                <Minimize className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors" title="Chiudi">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Area */}
          <div className="relative flex-1 overflow-hidden bg-black">
            {/* Remote Video */}
            <div className="absolute inset-0">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: remoteStream ? 'block' : 'none' }}
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-slate-400">
                    <div className="w-16 h-16 rounded-full border-4 border-sky-500/50 border-t-transparent animate-spin mb-4 mx-auto" />
                    <p className="text-slate-400">In attesa di connessione...</p>
                    <p className="text-xs text-slate-500 mt-2">In attesa che {otherUserName} accetti la chiamata</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video (PiP) */}
            {localStream && (
              <div className="absolute bottom-4 right-4 z-10">
                <div className="relative w-48 h-32 sm:w-64 sm:h-40">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full rounded-xl object-cover border-2 border-slate-700 shadow-2xl"
                  />
                </div>
              </div>
            )}

            {/* Connection Status Overlay */}
            {connectionState === 'connecting' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-sm rounded-full border border-amber-500/50 flex items-center gap-2 text-amber-400 text-sm">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Connessione in corso...</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-all ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'Riattiva microfono' : 'Muta microfono'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition-colors ${
                isVideoOff
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isVideoOff ? 'Attiva video' : 'Disattiva video'}
            >
              {isVideoOff ? <Video className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-xl transition-colors ${
                isScreenSharing
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isScreenSharing ? 'Stop condivisione schermo' : 'Condividi schermo'}
            >
              {isScreenSharing ? (
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Monitor className="w-4 h-4" />
                  <span>Condivisione</span>
                </span>
              ) : (
                <Monitor className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
              title="Chiudi chiamata"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default VideoChatModal;

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Video, Mic, MicOff, Minimize, Maximize2, Monitor, PhoneOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { publishRtcSignalToCloud, subscribeRtcSignals } from "@/lib/firestoreService";
import { GOOGLE_PUBLIC_STUN_SERVERS, IceServerEntry } from "@/lib/freeServicesConfig";
import { getDynamicIceServers } from "@/lib/turnService";

interface VideoChatModalProps {
  isOpen?: boolean;
  onClose: () => void;
  listingId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  currentUserId?: string;
  iceServersOverride?: IceServerEntry[];
}

export function VideoChatModal({
  isOpen = true,
  onClose,
  listingId = "h2w_call",
  otherUserName = "Fornitore Partner",
  iceServersOverride,
}: VideoChatModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "awaiting_signaling" | "signaling_ready" | "connected" | "disconnected"
  >("awaiting_signaling");
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [iceServers, setIceServers] = useState<IceServerEntry[]>(
    () => iceServersOverride || GOOGLE_PUBLIC_STUN_SERVERS
  );
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const iceBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const callRoomId = `call_${String(listingId || "h2w").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  useEffect(() => {
    if (iceServersOverride && iceServersOverride.length > 0) {
      setIceServers(iceServersOverride);
      return;
    }
    let mounted = true;
    getDynamicIceServers().then((servers) => {
      if (mounted && Array.isArray(servers) && servers.length > 0) {
        setIceServers(servers);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, [iceServersOverride]);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    let cancelled = false;
    setConnectionState("awaiting_signaling");
    setIsMinimized(false);
    const pc = initializePeerConnection(iceServers);

    const unsubSignals = subscribeRtcSignals(
      callRoomId,
      async (data) => {
        if (cancelled || !peerRef.current) return;
        const myUid = auth.currentUser?.uid;
        if (!data || (myUid && data.senderUid === myUid)) return;
        const conn = peerRef.current;
        try {
          if (data.offer && conn.signalingState === "stable" && !conn.currentRemoteDescription) {
            await conn.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await conn.createAnswer();
            await conn.setLocalDescription(answer);
            await publishRtcSignalToCloud(callRoomId, {
              answer: { type: answer.type, sdp: answer.sdp },
            });
          } else if (data.answer && !conn.currentRemoteDescription) {
            await conn.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          if (Array.isArray(data.candidates)) {
            for (const c of data.candidates) {
              if (c && c.candidate) {
                await conn.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
            }
          }
        } catch (err) {
          console.warn("WebRTC signaling step notice:", err);
        }
      },
      () => {
        if (!cancelled) setConnectionState("awaiting_signaling");
      }
    );

    (async () => {
      const stream = await initializeMedia();
      if (cancelled) return;
      if (stream && pc) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        if (auth.currentUser?.uid) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const sigRes = await publishRtcSignalToCloud(callRoomId, {
              offer: { type: offer.type, sdp: offer.sdp },
            });
            if (sigRes.ok && !cancelled) {
              setConnectionState("signaling_ready");
            }
          } catch {
            // Firestore calls rule or network unavailable -> stay in awaiting_signaling
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubSignals();
      cleanup();
    };
  }, [isOpen, callRoomId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeMedia = async (): Promise<MediaStream | null> => {
    setMediaError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMediaError("Fotocamera e microfono non disponibili in questo browser.");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Errore accesso media:", err);
      setMediaError("Permesso webcam/microfono negato o dispositivo non rilevato.");
      return null;
    }
  };

  const initializePeerConnection = (servers: IceServerEntry[] = iceServers): RTCPeerConnection | null => {
    if (typeof RTCPeerConnection === "undefined") return null;
    const pc = new RTCPeerConnection({ iceServers: servers as RTCIceServer[] });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceBufferRef.current = [...iceBufferRef.current.slice(-12), event.candidate.toJSON()];
        void publishRtcSignalToCloud(callRoomId, {
          candidates: iceBufferRef.current,
        });
      }
    };
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setConnectionState("connected");
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setConnectionState("connected");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnectionState("disconnected");
      }
    };
    peerRef.current = pc;
    setPeerConnection(pc);
    return pc;
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    iceBufferRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setConnectionState("disconnected");
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
        toast.error("Condivisione schermo non supportata in questo browser");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) await sender.replaceTrack(videoTrack);
        if (videoTrack) {
          videoTrack.onended = () => setIsScreenSharing(false);
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) await sender.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-3 flex items-center gap-3 text-white">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
          <Video className="w-4 h-4 text-sky-400" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black truncate max-w-[140px]">{otherUserName}</div>
          <div className="text-[10px] text-amber-300">Video ridotto a icona</div>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          title="Espandi"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 cursor-pointer"
          title="Chiudi"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
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
                <p className="text-xs text-slate-400">Canale video annuncio #{listingId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  connectionState === "connected"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {connectionState === "connected"
                  ? "Connesso P2P"
                  : connectionState === "signaling_ready"
                    ? "In attesa risposta remota (SDP Firestore attivo)"
                    : "Signaling remoto in attesa di regole Kilo"}
              </span>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Riduci a icona"
              >
                <Minimize className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                title="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Area */}
          <div className="relative flex-1 overflow-hidden bg-black">
            <div className="absolute inset-0">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: remoteStream ? "block" : "none" }}
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6">
                  <div className="text-center max-w-md space-y-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-sm font-black text-white">
                      Anteprima Camera Locale Attiva • Signaling Remoto Richiesto
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      L'hardware webcam/microfono locale è pronto, ma lo scambio SDP/ICE remoto tra due dispositivi richiede l'endpoint WebRTC di segnalazione su backend Kilo.
                    </p>
                    {mediaError && (
                      <p className="text-xs text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg px-3 py-2">
                        {mediaError}
                      </p>
                    )}
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
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] text-white font-bold">
                    La tua camera
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm">
            <button
              type="button"
              onClick={toggleMute}
              disabled={!localStream}
              className={`p-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 ${
                isMuted
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
              title={isMuted ? "Riattiva microfono" : "Muta microfono"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleVideo}
              disabled={!localStream}
              className={`p-3 rounded-xl transition-colors cursor-pointer disabled:opacity-40 ${
                isVideoOff
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
              title={isVideoOff ? "Attiva video" : "Disattiva video"}
            >
              {isVideoOff ? <Video className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleScreenShare}
              className={`p-3 rounded-xl transition-colors cursor-pointer ${
                isScreenSharing
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
              title={isScreenSharing ? "Stop condivisione schermo" : "Condividi schermo"}
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
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

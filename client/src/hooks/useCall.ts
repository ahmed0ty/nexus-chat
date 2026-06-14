"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";

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

export type CallState = "idle" | "calling" | "incoming" | "active";

export const useCall = () => {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callerName, setCallerName] = useState<string>("");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakerRef = useRef(true);

  useEffect(() => {
    isSpeakerRef.current = isSpeaker;
  }, [isSpeaker]);

  useEffect(() => {
    remoteAudioRef.current = new Audio();
    remoteAudioRef.current.autoplay = true;
    ringtoneRef.current = new Audio(
      "https://www.soundjay.com/phone/sounds/phone-calling-1.mp3"
    );
    ringtoneRef.current.loop = true;
    return () => {
      remoteAudioRef.current = null;
      ringtoneRef.current = null;
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  }, []);

  const startTimer = useCallback(() => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }, []);

  const playRingtone = useCallback(() => {
    ringtoneRef.current?.play().catch(() => {});
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    stopTimer();
    stopRingtone();
    pendingOfferRef.current = null;
  }, [stopTimer, stopRingtone]);

  // ← endCall معرّف قبل createPeerConnection عشان نحل مشكلة الـ access before declare
  const endCall = useCallback(() => {
    const socket = getSocket();
    socket.emit("call:end");
    cleanupCall();
    setCallState("idle");
    setIsMuted(false);
  }, [cleanupCall]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const socket = getSocket();

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("call:ice", { candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.volume = isSpeakerRef.current ? 1.0 : 0.5;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        stopRingtone();
        startTimer();
        setCallState("active");
      }
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        // استخدم الـ socket مباشرة بدل endCall عشان نتجنب circular dependency
        getSocket().emit("call:end");
        cleanupCall();
        setCallState("idle");
        setIsMuted(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [startTimer, stopRingtone, cleanupCall]);

  const startCall = useCallback(
    async (conversationId: string) => {
      if (callState !== "idle") return;
      const socket = getSocket();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = stream;

        const pc = createPeerConnection();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:offer", { offer, conversationId });
        setCallState("calling");
        playRingtone();
      } catch (err) {
        console.error("Failed to start call:", err);
        cleanupCall();
      }
    },
    [callState, createPeerConnection, playRingtone, cleanupCall]
  );

  const acceptCall = useCallback(async () => {
    if (!pendingOfferRef.current) return;
    const socket = getSocket();
    stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription(pendingOfferRef.current)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { answer });
      setCallState("active");
      startTimer();
    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanupCall();
      setCallState("idle");
    }
  }, [createPeerConnection, stopRingtone, startTimer, cleanupCall]);

  const rejectCall = useCallback(() => {
    const socket = getSocket();
    stopRingtone();
    socket.emit("call:reject");
    cleanupCall();
    setCallState("idle");
  }, [stopRingtone, cleanupCall]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current
      .getAudioTracks()
      .forEach((t) => (t.enabled = !newMuted));
    setIsMuted(newMuted);
  }, [isMuted]);

  const toggleSpeaker = useCallback(() => {
    const newSpeaker = !isSpeaker;
    isSpeakerRef.current = newSpeaker;
    setIsSpeaker(newSpeaker);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = newSpeaker ? 1.0 : 0.5;
    }
  }, [isSpeaker]);

  useEffect(() => {
    const socket = getSocket();

    const onOffer = ({
      offer,
      callerName: name,
    }: {
      offer: RTCSessionDescriptionInit;
      callerName: string;
    }) => {
      if (callState !== "idle") {
        socket.emit("call:reject");
        return;
      }
      pendingOfferRef.current = offer;
      setCallerName(name);
      setCallState("incoming");
      playRingtone();
    };

    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    };

    const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const onEnd = () => {
      cleanupCall();
      setCallState("idle");
      setIsMuted(false);
    };

    const onReject = () => {
      stopRingtone();
      cleanupCall();
      setCallState("idle");
    };

    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:end", onEnd);
    socket.on("call:reject", onReject);

    return () => {
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:end", onEnd);
      socket.off("call:reject", onReject);
    };
  }, [callState, playRingtone, stopRingtone, cleanupCall]);

  return {
    callState,
    callerName,
    callDuration,
    isMuted,
    isSpeaker,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  };
};
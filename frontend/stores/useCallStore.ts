import { create } from "zustand";

export type CallType = "voice" | "video";
export type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

interface CallUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  conversationId?: string;
}

interface CallState {
  status: CallStatus;
  type: CallType | null;
  caller: CallUser | null;
  receiver: CallUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  incomingSignal: any | null; // Store WebRTC signal

  // Actions
  startCall: (receiver: CallUser, type: CallType) => void;
  receiveCall: (caller: CallUser, type: CallType, signal?: any) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setStatus: (status: CallStatus) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  status: "idle",
  type: null,
  caller: null,
  receiver: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  incomingSignal: null,

  startCall: (receiver, type) => {
    console.log("🟢 startCall - receiver:", receiver.displayName);
    // Both users enter call room immediately
    // Caller sees "calling" state, callee sees "ringing" state
    set({
      status: "calling",
      type,
      receiver,
      caller: null,
    });
  },

  receiveCall: (caller, type, signal) => {
    console.log("🔵 receiveCall - caller:", caller.displayName);
    // Callee enters call room with ringing state
    set({
      status: "ringing",
      type,
      caller,
      receiver: null,
      incomingSignal: signal,
    });
  },

  acceptCall: () => {
    console.log("🟢 acceptCall - starting WebRTC connection");
    // Both users will connect WebRTC streams
    set({ status: "connected" });
  },

  rejectCall: () => {
    // Will be handled by useWebRTC hook
    set({ status: "ended" });
  },

  endCall: () => {
    console.log("🔴 endCall() called, current status:", get().status);
    // Set to ended for useWebRTC to emit socket event
    set({ status: "ended" });
    console.log("🔴 Status set to 'ended'");
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Toggle
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff; // Toggle
      });
      set({ isVideoOff: !isVideoOff });
    }
  },

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setStatus: (status) => {
    console.log("🔄 setStatus:", status);
    set({ status });
  },

  reset: () => {
    set({
      status: "idle",
      type: null,
      caller: null,
      receiver: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      incomingSignal: null,
    });
  },
}));

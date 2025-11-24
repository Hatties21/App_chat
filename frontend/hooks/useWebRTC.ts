import { useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import { useCallStore } from "@/stores/useCallStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

// Expose cleanup function and peer signaling globally
let globalCleanup: (() => void) | null = null;
let globalPeerSignal: ((signal: SimplePeer.SignalData) => void) | null = null;

export function cleanupCall() {
  if (globalCleanup) {
    console.log("🧹 Calling global cleanup...");
    globalCleanup();
  } else {
    console.warn("⚠️ Global cleanup not available yet");
  }
}

export function signalPeer(signal: SimplePeer.SignalData) {
  if (globalPeerSignal) {
    console.log("📡 Signaling peer with external signal");
    globalPeerSignal(signal);
  } else {
    console.warn("⚠️ Peer signal function not available yet");
  }
}

export function useWebRTC() {
  const { user } = useAuthStore();
  const { emitCallInitiate } = useSocket();
  const {
    status,
    type,
    caller,
    receiver,
    setLocalStream,
    setRemoteStream,
    setStatus,
    endCall,
    reset,
  } = useCallStore();

  // Emit callInitiate when caller starts call
  useEffect(() => {
    if (status === "calling" && receiver && user) {
      console.log("📞 Caller initiating call to:", receiver.displayName);
      
      emitCallInitiate({
        conversationId: receiver.conversationId,
        to: receiver.id,
        from: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl,
        },
        type,
      });
    }
  }, [status, receiver, user, type]);

  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const incomingSignalRef = useRef<SimplePeer.SignalData | null>(null);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.warn("⏳ Socket not available yet in useWebRTC, will retry...");
      return;
    }
    
    if (!socket.connected) {
      console.warn("⏳ Socket not connected yet, waiting...");
      // Wait for connection
      const onConnect = () => {
        console.log("✅ Socket connected in useWebRTC");
        socketRef.current = socket;
      };
      socket.once("connect", onConnect);
      return () => {
        socket.off("connect", onConnect);
      };
    }
    
    socketRef.current = socket;
    console.log("✅ useWebRTC initialized, socket connected:", socket.connected);
    console.log("Socket ID:", socket.id);

    // Call listeners moved to useSocket for reliability
    // Call listeners moved to useSocket for reliability
    // We do NOT remove them here anymore because useSocket manages them
    // and removing them here would kill useSocket's listeners too
    
    console.log("✅ useWebRTC initialized (call events handled by useSocket)");
    
    console.log("✅ useWebRTC initialized (callIncoming handled by useSocket)");

    // Listen for call accepted - MOVED TO useSocket for consistency
    // socket.on("callAccepted", ({ signal }) => {
    //   console.log("✅ Call accepted, received signal");
    //   if (peerRef.current) {
    //     console.log("✅ Signaling peer with accept signal");
    //     peerRef.current.signal(signal);
    //   } else {
    //     console.warn("⚠️ Peer not ready, storing signal");
    //     incomingSignalRef.current = signal;
    //   }
    //   setStatus("connected");
    // });

    // OLD LISTENERS - DISABLED (moved to useSocket or not needed for toast test)
    // socket.on("call:rejected", () => {
    //   console.log("Call rejected");
    //   toast.error("Cuộc gọi bị từ chối");
    //   cleanup();
    // });

    // socket.on("call:ended", () => {
    //   console.log("Call ended by other user");
    //   toast.info("Cuộc gọi đã kết thúc");
    //   cleanup();
    // });

    // socket.on("call:signal", ({ signal }) => {
    //   if (peerRef.current) {
    //     peerRef.current.signal(signal);
    //   }
    // });

    return () => {
      // Don't remove listeners on cleanup in development
      // React Strict Mode causes double mount/unmount
      if (process.env.NODE_ENV === 'production' && socket) {
        socket.off("call:incoming");
        socket.off("call:accepted");
        socket.off("call:rejected");
        socket.off("call:ended");
        socket.off("call:signal");
      }
    };
  }, [user]); // Re-run when user changes

  // Handle WebRTC connection when call is accepted
  useEffect(() => {
    console.log("🔍 WebRTC effect - status:", status, "receiver:", receiver?.displayName, "caller:", caller?.displayName);
    
    // Start WebRTC connection when status becomes "connected"
    // This happens after callee accepts the call
    if (status === "connected" && user && !peerRef.current) {
      const isInitiator = !!receiver; // Caller is initiator
      console.log(`📞 Starting WebRTC connection, initiator: ${isInitiator}`);
      initiatePeerConnection(isInitiator);
    }
  }, [status, receiver, caller, user]);

  // Apply incoming signal after peer is created
  useEffect(() => {
    if (peerRef.current && incomingSignalRef.current && status === "connected") {
      peerRef.current.signal(incomingSignalRef.current);
      incomingSignalRef.current = null;
    }
  }, [status]);

  const initiatePeerConnection = async (initiator: boolean) => {
    try {
      // Get media stream
      const constraints = {
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Create peer connection
      const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });

      peer.on("signal", (signal: SimplePeer.SignalData) => {
        console.log("📡 Peer generated signal, initiator:", initiator);
        const socket = socketRef.current;
        if (!socket) {
          console.error("❌ Socket not available for signaling");
          return;
        }

        // Send signal to the other user
        const otherUserId = receiver?.id || caller?.id;
        const conversationId = receiver?.conversationId || caller?.conversationId;
        
        if (otherUserId && conversationId) {
          console.log(`📡 Sending signal to ${otherUserId}`);
          socket.emit("callSignal", {
            conversationId,
            to: otherUserId,
            signal,
          });
        }
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        console.log("🎥 Received remote stream!", remoteStream.getTracks().length, "tracks");
        setRemoteStream(remoteStream);
        setStatus("connected");
        console.log("✅ Status set to connected, call should be active now");
      });

      peer.on("error", (err: Error) => {
        console.error("Peer error:", err);
        toast.error("Lỗi kết nối");
        cleanup();
      });

      peer.on("close", () => {
        console.log("Peer connection closed");
        cleanup();
      });

      peerRef.current = peer;
    } catch (error: any) {
      console.error("Failed to get media:", error);
      
      if (error.name === "NotAllowedError") {
        toast.error("Vui lòng cho phép truy cập camera/microphone");
      } else {
        toast.error("Không thể khởi tạo cuộc gọi");
      }
      
      cleanup();
    }
  };

  // Handle call rejection/ending
  useEffect(() => {
    if (status === "ended") {
      console.log("🔴 Status is 'ended', cleaning up...");
      
      // Cleanup and reset immediately
      // Socket events are emitted from components (IncomingCallModal, CallWindow)
      setTimeout(() => {
        cleanup();
      }, 100);
    }
  }, [status]);

  const cleanup = () => {
    // Stop all media tracks
    const { localStream, remoteStream } = useCallStore.getState();
    localStream?.getTracks().forEach(track => {
      track.stop();
      console.log("🛑 Stopped local track:", track.kind);
    });
    remoteStream?.getTracks().forEach(track => {
      track.stop();
      console.log("🛑 Stopped remote track:", track.kind);
    });
    
    // Destroy peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      console.log("🛑 Peer connection destroyed");
    }
    
    incomingSignalRef.current = null;
    
    // Reset call store to idle state
    reset();
    console.log("✅ Call cleanup complete, state reset to idle");
  };

  // Expose cleanup and peer signal globally
  useEffect(() => {
    globalCleanup = cleanup;
    globalPeerSignal = (signal: SimplePeer.SignalData) => {
      console.log("📡 globalPeerSignal called, peerRef.current:", !!peerRef.current);
      if (peerRef.current) {
        console.log("📡 Signaling peer connection with signal");
        try {
          peerRef.current.signal(signal);
          console.log("✅ Signal sent to peer successfully");
        } catch (error) {
          console.error("❌ Error signaling peer:", error);
        }
      } else {
        console.warn("⚠️ Peer not ready, storing signal for later");
        incomingSignalRef.current = signal;
      }
    };
    
    return () => {
      globalCleanup = null;
      globalPeerSignal = null;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, []);

  return null;
}

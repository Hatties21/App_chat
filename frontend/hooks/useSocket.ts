"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { initSocket, getSocket } from "@/lib/socket";
import { toast } from "sonner";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  const { 
    addMessage, 
    addTypingUser, 
    removeTypingUser,
    updateUserOnlineStatus,
  } = useChatStore();

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Get access token from auth store
    const accessToken = useAuthStore.getState().accessToken;
    
    if (!accessToken) {
      return;
    }

    // Initialize socket connection using shared instance
    const socket = initSocket(accessToken);
    socketRef.current = socket;
    
    // Remove existing listeners to prevent duplicates
    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("message:new");
    socket.off("typing:start");
    socket.off("typing:stop");
    socket.off("user:online");
    socket.off("user:offline");
    socket.off("callIncoming");
    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callEnded");
    socket.off("callSignal");

    // Connection events
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Message events
    socket.on("message:new", (message) => {
      console.log("📨 New message received:", message);
      useChatStore.getState().addMessage(message);
    });

    // Typing events
    socket.on("typing:start", ({ userId, conversationId, displayName }) => {
      // Don't show typing indicator for self
      if (userId === user?.id) {
        return;
      }
      
      console.log(`⌨️ ${displayName} is typing in ${conversationId}`);
      useChatStore.getState().addTypingUser(conversationId, userId, displayName);
    });

    socket.on("typing:stop", ({ userId, conversationId }) => {
      console.log(`⌨️ User ${userId} stopped typing in ${conversationId}`);
      useChatStore.getState().removeTypingUser(conversationId, userId);
    });

    // Online status events
    socket.on("user:online", ({ userId, timestamp }) => {
      console.log(`🟢 User ${userId} is online`);
      useChatStore.getState().updateUserOnlineStatus(userId, true);
    });

    socket.on("user:offline", ({ userId, lastSeen }) => {
      console.log(`⚫ User ${userId} is offline`);
      useChatStore.getState().updateUserOnlineStatus(userId, false, lastSeen);
    });

    // Call events - Register here with messaging events for reliability
    socket.on("callIncoming", ({ from, type, conversationId }) => {
      console.log("📞 callIncoming event received");
      
      const currentUser = useAuthStore.getState().user;
      
      // Only process if I'm NOT the caller
      if (currentUser && from.id !== currentUser.id) {
        console.log("🔔 I'm the CALLEE, showing incoming call");
        
        import("@/stores/useCallStore").then(({ useCallStore }) => {
          // Add conversationId to caller info
          useCallStore.getState().receiveCall(
            { ...from, conversationId }, 
            type
          );
        });
      } else {
        console.log("⏭️ I'm the CALLER, already in call room");
      }
    });

    socket.on("callAccepted", ({ conversationId }) => {
      console.log("✅ Call accepted, starting WebRTC");
      
      import("@/stores/useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().setStatus("connected");
      });
    });

    socket.on("callRejected", ({ conversationId }) => {
      console.log("❌ Call rejected");
      toast.error("Cuộc gọi bị từ chối");
      
      import("@/hooks/useWebRTC").then(({ cleanupCall }) => {
        cleanupCall();
      });
    });

    socket.on("callEnded", ({ conversationId }) => {
      console.log("📴 Call ended");
      toast.info("Cuộc gọi đã kết thúc");
      
      import("@/hooks/useWebRTC").then(({ cleanupCall }) => {
        cleanupCall();
      });
    });

    // WebRTC signaling
    socket.on("callSignal", ({ signal, from }) => {
      console.log("📡 Received signal from:", from);
      
      import("@/hooks/useWebRTC").then(({ signalPeer }) => {
        signalPeer(signal);
      });
    });

    // Cleanup on unmount
    return () => {
      // Don't disconnect here, let disconnectSocket() handle it
      // socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Helper functions to emit events
  const emitTypingStart = (conversationId: string) => {
    const socket = getSocket();
    socket?.emit("typing:start", { conversationId });
  };

  const emitTypingStop = (conversationId: string) => {
    const socket = getSocket();
    socket?.emit("typing:stop", { conversationId });
  };

  const emitMessageSend = (conversationId: string, messageId: string) => {
    const socket = getSocket();
    socket?.emit("message:send", { conversationId, messageId });
  };

  const emitCallInitiate = (data: any) => {
    const socket = getSocket();
    console.log("📞 Emitting callInitiate:", data);
    console.log("Socket instance:", socket?.id, "Connected:", socket?.connected);
    
    if (socket && socket.connected) {
      socket.emit("callInitiate", data);
    } else {
      console.error("❌ Cannot emit callInitiate: Socket not connected or null");
      toast.error("Lỗi kết nối: Không thể gọi");
    }
  };

  const emitCallAccept = (conversationId: string, callerId: string) => {
    const socket = getSocket();
    console.log("✅ Emitting callAccept for conversation:", conversationId);
    socket?.emit("callAccept", { conversationId, callerId });
  };

  const emitCallReject = (conversationId: string) => {
    const socket = getSocket();
    console.log("❌ Emitting callReject for conversation:", conversationId);
    socket?.emit("callReject", { conversationId });
  };

  const emitCallEnd = (conversationId: string) => {
    const socket = getSocket();
    console.log("📴 Emitting callEnd for conversation:", conversationId);
    socket?.emit("callEnd", { conversationId });
  };

  return {
    socket: socketRef.current,
    emitTypingStart,
    emitTypingStop,
    emitMessageSend,
    emitCallInitiate,
    emitCallAccept,
    emitCallReject,
    emitCallEnd,
  };
}

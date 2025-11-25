"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ConversationList from "@/components/chat/ConversationList";
import FriendsTab from "@/components/chat/FriendsTab";
import { ChatDropZone } from "@/components/chat/ChatDropZone";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { CallWindow } from "@/components/call/CallWindow";
import { IncomingCallModal } from "@/components/call/IncomingCallModal";
import SignOut from "@/components/auth/SignOut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

export default function HomeClient() {
  const { user } = useAuthStore();
  const { currentConversationId, setCurrentConversation, conversations } = useChatStore();
  const [activeTab, setActiveTab] = useState<"chats" | "friends">("chats");
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageInputRef = useRef<any>(null);

  // console.log("🏠 HomeClient rendered"); // Disabled debug log

  // Initialize socket connection
  useSocket();
  
  // Initialize WebRTC for calls
  useWebRTC();

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("✅ Notification permission granted");
          }
        });
      }
    }
  }, []);

  // Handle userId query param for direct messaging
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && user) {
      handleStartChatWithUser(userId);
    }
  }, [searchParams, user]);

  const handleStartChatWithUser = async (targetUserId: string) => {
    try {
      console.log("Starting chat with user:", targetUserId);
      
      // Check if conversation already exists (for direct chats)
      const existingConv = conversations.find(conv => 
        conv.type === 'direct' && conv.otherUser?._id === targetUserId
      );

      if (existingConv) {
        console.log("Found existing conversation:", existingConv._id);
        setCurrentConversation(existingConv._id);
        setActiveTab("chats");
        // Clear query param
        router.replace("/");
        return;
      }

      // Create new conversation
      console.log("Creating new conversation...");
      const { data } = await api.post("/api/conversations", {
        participantIds: [targetUserId],
        isGroup: false,
      });

      console.log("New conversation created:", data.conversation._id);
      setCurrentConversation(data.conversation._id);
      setActiveTab("chats");
      
      // Clear query param
      router.replace("/");
      
      toast.success("Đã mở cuộc trò chuyện");
    } catch (error: any) {
      console.error("Error starting chat:", error);
      toast.error("Không thể mở cuộc trò chuyện");
      router.replace("/");
    }
  };

  const handleFileDrop = (file: File) => {
    // Pass file to MessageInput
    if (messageInputRef.current?.handleExternalFile) {
      messageInputRef.current.handleExternalFile(file);
    }
  };

  return (
    <>
      {/* Call Components */}
      <CallWindow />
      <IncomingCallModal />
      
      <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Chad
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = "/profile"}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>
                {user?.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium cursor-pointer hover:underline">
              {user?.displayName}
            </span>
          </button>
          <SignOut />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Always visible */}
        <div className="w-80 border-r flex flex-col">
          {/* Tabs */}
          <div className="flex border-b bg-muted/30">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "chats"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Trò chuyện
              {activeTab === "chats" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "friends"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Bạn bè
              {activeTab === "friends" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chats" && <ConversationList />}
            {activeTab === "friends" && <FriendsTab />}
          </div>
        </div>

        {/* Chat Area */}
        {currentConversationId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader />
            <ChatDropZone onFileDrop={handleFileDrop}>
              <MessageList />
              <MessageInput ref={messageInputRef} />
            </ChatDropZone>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Chào mừng đến với Chad
            </h3>
            <p className="text-sm text-center max-w-sm">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tìm kiếm bạn bè để bắt đầu nhắn tin
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

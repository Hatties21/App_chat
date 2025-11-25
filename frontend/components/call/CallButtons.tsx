"use client";

import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/stores/useCallStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

export function CallButtons() {
  const { user } = useAuthStore();
  const { currentConversationId, conversations } = useChatStore();
  const { startCall, status } = useCallStore();

  const currentConv = conversations.find(c => c._id === currentConversationId);
  const isDirectChat = currentConv?.type === "direct";
  const otherUser = currentConv?.otherUser;

  if (!isDirectChat || !otherUser || status !== "idle") {
    return null;
  }

  const handleVoiceCall = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    startCall(
      {
        id: otherUser._id,
        username: otherUser.username,
        displayName: otherUser.displayName || otherUser.username,
        avatarUrl: otherUser.avatarUrl,
        conversationId: currentConversationId ?? undefined, // Convert null to undefined
      },
      "voice"
    );
  };

  const handleVideoCall = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    startCall(
      {
        id: otherUser._id,
        username: otherUser.username,
        displayName: otherUser.displayName || otherUser.username,
        avatarUrl: otherUser.avatarUrl,
        conversationId: currentConversationId ?? undefined, // Convert null to undefined
      },
      "video"
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleVoiceCall}
        title="Voice Call"
      >
        <Phone className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleVideoCall}
        title="Video Call"
      >
        <Video className="w-5 h-5" />
      </Button>
    </div>
  );
}

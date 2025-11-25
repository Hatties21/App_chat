"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Users } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { GroupSettingsModal } from "./GroupSettingsModal";
import { OnlineStatus } from "./OnlineStatus";
import { CallButtons } from "../call/CallButtons";
import type { ConversationWithDetails } from "@/types/conversation";

export function ChatHeader() {
  // Optimize: Only subscribe to what we need
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const [showSettings, setShowSettings] = useState(false);

  const currentConversation = currentConversationId
    ? (conversations.find((c) => c._id === currentConversationId) as ConversationWithDetails)
    : null;

  React.useEffect(() => {
    setShowSettings(false);
  }, [currentConversationId]);

  if (!currentConversation) {
    return <div className="h-16 border-b" />;
  }

  const isGroup = currentConversation.type === "group";
  const displayName = isGroup
    ? currentConversation.group?.groupname
    : currentConversation.otherUser?.displayName;
  const avatarUrl = isGroup
    ? currentConversation.group?.avatarUrl
    : currentConversation.otherUser?.avatarUrl;

  return (
    <>
      <div className="h-16 border-b flex items-center justify-between px-6 flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
              {displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="font-semibold leading-tight">{displayName}</h2>
            {!isGroup && currentConversation.otherUser && (
              <OnlineStatus
                isOnline={currentConversation.otherUser.isOnline}
                lastSeen={currentConversation.otherUser.lastSeen}
              />
            )}
            {isGroup && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Users className="w-3 h-3" />
                Nhóm
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isGroup && <CallButtons />}
          {isGroup && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(true)}
              title="Cài đặt nhóm"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {showSettings && isGroup && (
        <GroupSettingsModal
          conversation={currentConversation}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            fetchConversations(true);
          }}
        />
      )}
    </>
  );
}

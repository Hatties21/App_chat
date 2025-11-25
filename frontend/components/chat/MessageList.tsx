"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Smile } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { MessageAttachment } from "./MessageAttachment";
import { ReadReceipt } from "./ReadReceipt";
import { TypingIndicator } from "./TypingIndicator";

export default function MessageList() {
  // Optimize: Only subscribe to what we need
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const hasMore = useChatStore((s) => s.hasMore);
  const loadingMore = useChatStore((s) => s.loadingMore);
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);
  const user = useAuthStore((s) => s.user);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);
  const [showPickerForMessage, setShowPickerForMessage] = useState<string | null>(null);
  const isLoadingMore = currentConversationId ? loadingMore[currentConversationId] : false;
  const canLoadMore = currentConversationId ? hasMore[currentConversationId] : false;

  const currentMessages = currentConversationId
    ? messages[currentConversationId] || []
    : [];

  const currentConversation = currentConversationId
    ? conversations.find(c => c._id === currentConversationId)
    : null;

  // Memoize expensive calculation
  const latestReadMessageId = useMemo(() => {
    if (!user?.id) return null;
    
    const myMessagesWithReads = currentMessages
      .filter(msg => {
        const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId._id;
        return senderId === user.id && msg.readBy && msg.readBy.length > 0;
      })
      .filter(msg => {
        const othersRead = msg.readBy?.filter(r => {
          const userId = typeof r.userId === 'string' ? r.userId : r.userId._id;
          return userId !== user.id;
        });
        return othersRead && othersRead.length > 0;
      });

    if (myMessagesWithReads.length > 0) {
      return myMessagesWithReads[myMessagesWithReads.length - 1]._id;
    }
    
    return null;
  }, [currentMessages, user?.id]);

  useEffect(() => {
    if (shouldScrollToBottom && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [currentMessages, shouldScrollToBottom]);

  useEffect(() => {
    setShouldScrollToBottom(true);
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [currentConversationId]);

  const handleScroll = () => {
    if (!scrollRef.current || !currentConversationId) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isNearBottom);

    if (scrollTop < 100 && canLoadMore && !isLoadingMore) {
      setPrevScrollHeight(scrollHeight);
      loadMoreMessages(currentConversationId);
    }
  };

  useEffect(() => {
    if (scrollRef.current && prevScrollHeight > 0) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTop = newScrollHeight - prevScrollHeight;
      setPrevScrollHeight(0);
    }
  }, [currentMessages.length, prevScrollHeight]);

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Chọn một cuộc trò chuyện để bắt đầu
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 min-h-0" 
      ref={scrollRef}
      onScroll={handleScroll}
    >
      {canLoadMore && (
        <div className="flex justify-center py-2">
          {isLoadingMore ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <button
              onClick={() => currentConversationId && loadMoreMessages(currentConversationId)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Tải thêm tin nhắn cũ
            </button>
          )}
        </div>
      )}

      <div className="space-y-1">
        {currentMessages.map((message, index) => {
          const senderId =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId._id;
          const isMe = senderId === user?.id;
          const senderName =
            typeof message.senderId === "object"
              ? message.senderId.displayName
              : "Unknown";

          const prevMessage = currentMessages[index - 1];
          const nextMessage = currentMessages[index + 1];
          
          const prevSenderId = prevMessage && (typeof prevMessage.senderId === "string" 
            ? prevMessage.senderId 
            : prevMessage.senderId._id);
          const prevTimeDiff = prevMessage 
            ? new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
            : Infinity;
          const isGroupedWithPrev = prevMessage && prevSenderId === senderId;
          const hasLargeGapWithPrev = prevTimeDiff > 3 * 60 * 1000;
          
          const nextSenderId = nextMessage && (typeof nextMessage.senderId === "string" 
            ? nextMessage.senderId 
            : nextMessage.senderId._id);
          const nextTimeDiff = nextMessage 
            ? new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()
            : Infinity;
          const isGroupedWithNext = nextMessage && nextSenderId === senderId;
          const hasLargeGapWithNext = nextTimeDiff > 3 * 60 * 1000;

          const isFirstInGroup = !isGroupedWithPrev && isGroupedWithNext;
          const isMiddleInGroup = isGroupedWithPrev && isGroupedWithNext;
          const isLastInGroup = isGroupedWithPrev && !isGroupedWithNext;
          const isSingle = !isGroupedWithPrev && !isGroupedWithNext;

          const getBubbleRadius = () => {
            if (isSingle) {
              return "rounded-2xl";
            }
            if (isMe) {
              if (isFirstInGroup) return "rounded-2xl rounded-br-md";
              if (isMiddleInGroup) return "rounded-2xl rounded-tr-md rounded-br-md";
              if (isLastInGroup) return "rounded-2xl rounded-tr-md";
            } else {
              if (isFirstInGroup) return "rounded-2xl rounded-bl-md";
              if (isMiddleInGroup) return "rounded-2xl rounded-tl-md rounded-bl-md";
              if (isLastInGroup) return "rounded-2xl rounded-tl-md";
            }
            return "rounded-2xl";
          };

          return (
            <div key={message._id}>
              {!isMe && (isFirstInGroup || isSingle) && (
                <div className="flex items-center gap-2 mb-2 ml-11">
                  <span className="text-xs text-muted-foreground">
                    {senderName}
                  </span>
                </div>
              )}
              
              <div
                className={`flex gap-3 items-end ${isMe ? "flex-row-reverse" : ""} ${
                  isGroupedWithNext 
                    ? hasLargeGapWithNext 
                      ? "mb-4" 
                      : "mb-0.5" 
                    : "mb-3"
                } group`}
                onMouseEnter={() => setHoveredMessageId(message._id)}
                onMouseLeave={() => {
                  setHoveredMessageId(null);
                  setShowPickerForMessage(null);
                }}
              >
                {!isMe && (isLastInGroup || isSingle) && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback>
                      {senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isMe && (isFirstInGroup || isMiddleInGroup) && (
                  <div className="w-8 h-8 flex-shrink-0" />
                )}

                <div className={`flex flex-col ${isMe ? "items-end" : ""}`}>
                <div className="relative group/message">
                  <div
                    className={`${getBubbleRadius()} ${
                      message.text || !message.attachments?.length || message.attachments[0].mime?.startsWith('image/') === false
                        ? 'px-4 py-2'
                        : 'p-1'
                    } max-w-md ${
                      message.attachments?.length && message.attachments[0].mime?.startsWith('image/') && !message.text
                        ? 'bg-transparent'
                        : isMe
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted shadow-sm"
                    } ${(message as any).isPending ? "opacity-60" : ""} transition-shadow hover:shadow-md`}
                    onMouseEnter={() => setHoveredBubbleId(message._id)}
                    onMouseLeave={() => setHoveredBubbleId(null)}
                  >
                    {message.text && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    )}
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <MessageAttachment 
                        attachments={message.attachments} 
                        isMe={isMe}
                      />
                    )}
                  </div>

                  {hoveredBubbleId === message._id && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-background border border-border rounded shadow-sm z-10`}>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(message.createdAt), "EEEE HH:mm", { locale: vi })}
                        {message.editedAt && " (đã chỉnh sửa)"}
                      </span>
                    </div>
                  )}

                  {hoveredMessageId === message._id && (
                    <button
                      onClick={() => setShowPickerForMessage(
                        showPickerForMessage === message._id ? null : message._id
                      )}
                      className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'} p-1.5 bg-background border rounded-full shadow-sm hover:bg-accent transition-colors`}
                    >
                      <Smile className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  
                  <MessageReactions
                    messageId={message._id}
                    reactions={message.reactions || []}
                    isMe={isMe}
                    showPicker={showPickerForMessage === message._id}
                    onAddReaction={addReaction}
                    onRemoveReaction={removeReaction}
                    onTogglePicker={() => setShowPickerForMessage(null)}
                  />
                </div>

                {isMe && message._id === latestReadMessageId && message.readBy && currentConversation && (
                  <ReadReceipt
                    readBy={message.readBy}
                    currentUserId={user?.id || ''}
                    conversationType={currentConversation.type}
                  />
                )}
                
                {(message as any).isPending && (
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang gửi...
                  </span>
                )}
              </div>
            </div>
            </div>
          );
        })}

        {currentConversationId && typingUsers[currentConversationId] && typingUsers[currentConversationId].length > 0 && (
          <TypingIndicator 
            displayName={typingUsers[currentConversationId][0].displayName} 
          />
        )}
      </div>
    </div>
  );
}

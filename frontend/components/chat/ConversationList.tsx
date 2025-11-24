"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Users, UserCheck, UserX, Clock, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useChatStore } from "@/stores/useChatStore";
import { friendService, type Friend, type FriendRequest } from "@/services/friendService";
import { conversationService } from "@/services/conversationService";
import type { ConversationWithDetails } from "@/types/conversation";
import { CreateGroupModal } from "./CreateGroupModal";

let friendsCache: Friend[] | null = null;
let requestsCache: { sent: FriendRequest[]; received: FriendRequest[] } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export default function ConversationList() {
  // Optimize: Only subscribe to what we need
  const conversations = useChatStore((s) => s.conversations);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const setCurrentConversation = useChatStore((s) => s.setCurrentConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const [friends, setFriends] = useState<Friend[]>(friendsCache || []);
  const [requests, setRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>(requestsCache || { sent: [], received: [] });
  const [loading, setLoading] = useState(!friendsCache);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const fetchFriendsData = async (force = false) => {
    const now = Date.now();
    const isCacheValid = friendsCache && requestsCache && (now - lastFetchTime < CACHE_DURATION);

    if (isCacheValid && !force) {
      setFriends(friendsCache!);
      setRequests(requestsCache!);
      return;
    }

    try {
      const [friendsData, requestsData] = await Promise.all([
        friendService.getAllFriends(),
        friendService.getFriendRequests(),
      ]);
      
      friendsCache = friendsData.friends;
      requestsCache = requestsData;
      lastFetchTime = now;
      
      setFriends(friendsData.friends);
      setRequests(requestsData);
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchFriendsData()]);
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      toast.success("Đã chấp nhận lời mời kết bạn");
      fetchFriendsData(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chấp nhận thất bại";
      toast.error(message);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await friendService.declineFriendRequest(requestId);
      toast.success("Đã từ chối lời mời");
      fetchFriendsData(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Từ chối thất bại";
      toast.error(message);
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const { conversationId } = await conversationService.createDirectConversation(friendId);
      await fetchConversations(true);
      setCurrentConversation(conversationId);
      toast.success("Đã mở cuộc trò chuyện");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện";
      toast.error(message);
    }
  };

  const getConversationName = (conv: ConversationWithDetails): string => {
    if (conv.type === "group") {
      return conv.group?.groupname || "Nhóm";
    }
    if (conv.otherUser) {
      return conv.otherUser.displayName;
    }
    return "Direct Message";
  };

  const getConversationAvatar = (conv: ConversationWithDetails): string | undefined => {
    if (conv.type === "group") {
      return conv.group?.avatarUrl;
    }
    if (conv.otherUser) {
      return conv.otherUser.avatarUrl;
    }
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  const conversationFriendIds = new Set(
    (conversations as ConversationWithDetails[])
      .filter((conv): conv is ConversationWithDetails => 
        conv.type === "direct" && !!conv.otherUser
      )
      .map((conv) => conv.otherUser!._id)
  );

  const friendsWithoutConversations = friends.filter(
    (friend) => !conversationFriendIds.has(friend._id)
  );

  return (
    <ScrollArea className="h-full">
      {requests.received.length > 0 && (
        <>
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lời mời kết bạn ({requests.received.length})
            </h3>
            <div className="space-y-2">
              {requests.received.map((request) => (
                <div
                  key={request._id}
                  className="p-3 border rounded-lg space-y-3 bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.from.avatarUrl} />
                      <AvatarFallback>
                        {request.from.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {request.from.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{request.from.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => handleAcceptRequest(request._id)}
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Chấp nhận
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => handleDeclineRequest(request._id)}
                    >
                      <UserX className="w-3 h-3 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Tin nhắn ({conversations.length})
          </h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setShowCreateGroupModal(true)}
            disabled={friends.length === 0}
            title={friends.length === 0 ? "Bạn cần có bạn bè để tạo nhóm" : "Tạo nhóm mới"}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có tin nhắn nào</p>
            <p className="text-xs mt-1">
              Bắt đầu chat với bạn bè!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setCurrentConversation(conv._id)}
                className={`w-full py-3 px-3 flex items-start gap-3 hover:bg-accent rounded-lg transition-all text-left relative ${
                  currentConversationId === conv._id ? "bg-accent shadow-sm ring-1 ring-primary/10" : ""
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={getConversationAvatar(conv)} />
                    <AvatarFallback>
                      {getConversationName(conv).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conv.type === 'direct' && conv.otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate text-sm">
                      {getConversationName(conv)}
                    </span>
                    <div className="flex items-center gap-2">
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      )}
                      {(conv.unreadCount ?? 0) > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs rounded-full text-white shadow-sm animate-in zoom-in-50 duration-200">
                          {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {typingUsers[conv._id] && typingUsers[conv._id].length > 0 ? (
                    <p className="text-xs text-primary italic truncate">
                      {typingUsers[conv._id][0].displayName} đang nhập...
                    </p>
                  ) : conv.lastMessagePreview ? (
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {conv.lastMessagePreview.content.length > 15
                        ? `${conv.lastMessagePreview.content.substring(0, 15)}...`
                        : conv.lastMessagePreview.content}
                    </p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {friendsWithoutConversations.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Bạn bè chưa nhắn tin ({friendsWithoutConversations.length})
            </h3>
            <div className="space-y-1">
              {friendsWithoutConversations.map((friend) => (
                <button
                  key={friend._id}
                  onClick={() => handleStartChat(friend._id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors text-left"
                >
                  <Avatar>
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>
                      {friend.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{friend.username}
                    </p>
                  </div>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            fetchConversations(true);
          }}
        />
      )}
    </ScrollArea>
  );
}

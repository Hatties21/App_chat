"use client";

import { useEffect, useState, useRef } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import { friendService } from "@/services/friendService";
import { userService, type SearchUser } from "@/services/userService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  Check, 
  X, 
  Users,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type TabType = "friends" | "requests" | "search";

export default function FriendsTab() {
  const [activeSubTab, setActiveSubTab] = useState<TabType>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentFromSearch, setSentFromSearch] = useState<Set<string>>(new Set());
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const {
    friends,
    sentRequests,
    receivedRequests,
    loading,
    setFriends,
    setRequests,
    setLoading,
    removeFriend,
    removeReceivedRequest,
    removeSentRequest,
    addFriend,
    addSentRequest,
  } = useFriendStore();

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        friendService.getAllFriends(),
        friendService.getFriendRequests(),
      ]);
      setFriends(friendsData.friends);
      setRequests(requestsData.sent, requestsData.received);
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Auto search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await userService.searchUsers(searchQuery);
        setSearchResults(data.users);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSendRequest = async (userId: string) => {
    try {
      // Optimistic update
      setSentFromSearch(prev => new Set(prev).add(userId));
      
      const response = await friendService.sendFriendRequest(userId);
      toast.success("Đã gửi lời mời kết bạn");
      
      // Add to store immediately if response contains the request
      if (response.request) {
        addSentRequest(response.request);
      } else {
        // Fallback: reload all data
        await loadFriendsData();
      }
    } catch (error: any) {
      // Rollback optimistic update on error
      setSentFromSearch(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast.error(error?.response?.data?.error || "Không thể gửi lời mời");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await friendService.acceptFriendRequest(requestId);
      removeReceivedRequest(requestId);
      addFriend(result.newFriend);
      toast.success("Đã chấp nhận lời mời");
    } catch (error) {
      toast.error("Không thể chấp nhận lời mời");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await friendService.declineFriendRequest(requestId);
      removeReceivedRequest(requestId);
      toast.success("Đã từ chối lời mời");
    } catch (error) {
      toast.error("Không thể từ chối lời mời");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendService.cancelFriendRequest(requestId);
      removeSentRequest(requestId);
      toast.success("Đã hủy lời mời");
    } catch (error) {
      toast.error("Không thể hủy lời mời");
    }
  };

  const handleStartChat = (friendId: string) => {
    router.push(`/?userId=${friendId}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub Tabs */}
      <div className="flex border-b bg-background">
        <button
          onClick={() => setActiveSubTab("friends")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all relative ${
            activeSubTab === "friends"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          Bạn bè
          {activeSubTab === "friends" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("requests")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all relative ${
            activeSubTab === "requests"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          Lời mời
          {receivedRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {receivedRequests.length}
            </span>
          )}
          {activeSubTab === "requests" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("search")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all relative ${
            activeSubTab === "search"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          Tìm kiếm
          {activeSubTab === "search" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Search Tab */}
      {activeSubTab === "search" && (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm người dùng..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="text-sm pl-9 pr-9"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {searching && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                <Loader2 className="w-10 h-10 mb-3 opacity-50 animate-spin" />
                <p className="text-sm text-center">Đang tìm kiếm...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                <Search className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm text-center">
                  {searchQuery ? "Không tìm thấy" : "Nhập để tìm kiếm"}
                </p>
                <p className="text-xs text-center mt-2 opacity-70">
                  Gợi ý sẽ hiện tự động khi bạn gõ
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((user) => {
                  const requestSent = sentFromSearch.has(user._id) || 
                    sentRequests.some(r => r.to._id === user._id);
                  const isFriend = friends.some(f => f._id === user._id);

                  return (
                    <div
                      key={user._id}
                      className="p-3 grid grid-cols-[40px_1fr_90px] gap-3 items-center hover:bg-accent transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-sm">
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-sm font-medium truncate" title={user.displayName}>
                          {user.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={`@${user.username}`}>
                          @{user.username}
                        </p>
                      </div>
                      <div>
                        {isFriend ? (
                          <Button size="sm" variant="outline" disabled className="text-xs w-full">
                            Bạn bè
                          </Button>
                        ) : requestSent ? (
                          <Button size="sm" variant="outline" disabled className="text-xs gap-1 w-full">
                            <Clock className="w-3 h-3" />
                            Đã gửi
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendRequest(user._id)}
                            className="text-xs gap-1 w-full"
                          >
                            <UserPlus className="w-3 h-3" />
                            Kết bạn
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Friends Tab */}
      {activeSubTab === "friends" && (
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <Users className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm text-center">Chưa có bạn bè</p>
            </div>
          ) : (
            <div className="divide-y">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="p-3 flex items-center gap-3 hover:bg-accent transition-colors group cursor-pointer"
                  onClick={() => {
                    console.log("Navigating to profile:", friend._id);
                    router.push(`/profile/${friend._id}`);
                  }}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="text-sm">
                      {friend.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{friend.username}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(friend._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Requests Tab */}
      {activeSubTab === "requests" && (
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : receivedRequests.length === 0 && sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <UserPlus className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm text-center">Không có lời mời</p>
            </div>
          ) : (
            <div className="space-y-4 p-3">
              {receivedRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                    Đã nhận ({receivedRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {receivedRequests.map((request) => (
                      <div
                        key={request._id}
                        className="p-3 rounded-lg bg-accent/50 flex items-center gap-3"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="text-sm">
                            {request.from.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {request.from.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{request.from.username}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request._id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sentRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                    Đã gửi ({sentRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {sentRequests.map((request) => (
                      <div
                        key={request._id}
                        className="p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="text-sm">
                            {request.to.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {request.to.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Đang chờ...
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request._id)}
                          className="text-xs"
                        >
                          Hủy
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

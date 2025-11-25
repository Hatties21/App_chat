"use client";

import { useState } from "react";
import { UserPlus, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { userService, type SearchUser } from "@/services/userService";
import { friendService } from "@/services/friendService";
import { SearchAutocomplete, type SearchSuggestion } from "@/components/ui/search-autocomplete";

interface UserSearchProps {
  onClose?: () => void;
}

export default function UserSearch({ onClose }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const fetchSuggestions = async (searchQuery: string): Promise<SearchSuggestion[]> => {
    try {
      const { users: results } = await userService.searchUsers(searchQuery);
      return results;
    } catch (error) {
      return [];
    }
  };

  const handleSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.displayName);
    setUsers([suggestion as SearchUser]);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }

    try {
      setLoading(true);
      const { users: results } = await userService.searchUsers(query);
      setUsers(results);
      
      if (results.length === 0) {
        toast.info("Không tìm thấy người dùng nào");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Tìm kiếm thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendService.sendFriendRequest(userId);
      setSentRequests(prev => new Set(prev).add(userId));
      toast.success("Đã gửi lời mời kết bạn");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Gửi lời mời thất bại");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tìm kiếm người dùng</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <SearchAutocomplete
            value={query}
            onChange={setQuery}
            onSelect={handleSelect}
            onSearch={handleSearch}
            placeholder="Tìm theo username hoặc email..."
            fetchSuggestions={fetchSuggestions}
            minChars={1}
            debounceMs={500}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <UserPlus className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">
              {query ? "Không tìm thấy kết quả" : "Nhập từ khóa để tìm kiếm"}
            </p>
            <p className="text-xs text-center mt-2 opacity-70">
              Gợi ý sẽ hiện khi bạn gõ (tối thiểu 2 ký tự)
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => {
              const requestSent = sentRequests.has(user._id);

              return (
                <div
                  key={user._id}
                  className="p-4 flex items-center justify-between hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {requestSent ? (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="w-4 h-4 mr-2" />
                      Đã gửi
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendRequest(user._id)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Kết bạn
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { conversationService } from "@/services/conversationService";
import type { Friend } from "@/services/friendService";

interface CreateGroupModalProps {
  friends: Friend[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupModal({ friends, onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    if (selectedFriends.size === 0) {
      toast.error("Vui lòng chọn ít nhất 1 thành viên");
      return;
    }

    try {
      setCreating(true);
      await conversationService.createGroupConversation({
        groupname: groupName.trim(),
        memberIds: Array.from(selectedFriends),
      });
      toast.success("Đã tạo nhóm thành công");
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tạo nhóm";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tạo nhóm mới
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Tên nhóm</Label>
            <Input
              id="groupName"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Chọn thành viên ({selectedFriends.size} đã chọn)
            </Label>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {friends.map((friend) => (
                <button
                  key={friend._id}
                  onClick={() => toggleFriend(friend._id)}
                  className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                    selectedFriends.has(friend._id)
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>
                      {friend.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium truncate text-sm">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{friend.username}
                    </p>
                  </div>
                  {selectedFriends.has(friend._id) && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !groupName.trim() || selectedFriends.size === 0}
            className="flex-1"
          >
            {creating ? "Đang tạo..." : "Tạo nhóm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Settings,
  Users,
  UserPlus,
  Crown,
  Shield,
  UserMinus,
  LogOut,
  Trash2,
  Edit2,
  Check,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { participantService, type Participant } from "@/services/participantService";
import { conversationService } from "@/services/conversationService";
import { friendService, type Friend } from "@/services/friendService";
import type { ConversationWithDetails } from "@/types/conversation";
import { useAuthStore } from "@/stores/useAuthStore";

interface GroupSettingsModalProps {
  conversation: ConversationWithDetails;
  onClose: () => void;
  onUpdate: () => void;
}

export function GroupSettingsModal({
  conversation,
  onClose,
  onUpdate,
}: GroupSettingsModalProps) {
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(conversation.group?.groupname || "");
  const [showAddMember, setShowAddMember] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const currentUserParticipant = participants.find((p) => p.userID._id === user?.id);
  const isOwner = currentUserParticipant?.role === "owner";
  const isAdmin = currentUserParticipant?.role === "admin" || isOwner;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [participantsData, friendsData] = await Promise.all([
        participantService.getParticipants(conversation._id),
        friendService.getAllFriends(),
      ]);
      setParticipants(participantsData.participants);
      setFriends(friendsData.friends);
      
      const myParticipant = participantsData.participants.find(
        (p) => p.userID._id === user?.id
      );
      setIsMuted(myParticipant?.mute || false);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Không thể tải thông tin nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }

    try {
      await conversationService.updateGroupInfo(conversation._id, {
        groupname: newGroupName.trim(),
      });
      toast.success("Đã cập nhật tên nhóm");
      setEditingName(false);
      onUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật tên nhóm";
      toast.error(message);
    }
  };

  const handleAddMember = async (friendId: string) => {
    try {
      await participantService.addMembers(conversation._id, [friendId]);
      toast.success("Đã thêm thành viên");
      loadData();
      setShowAddMember(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể thêm thành viên";
      toast.error(message);
    }
  };

  const handleRemoveMember = async (userId: string, displayName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ${displayName} khỏi nhóm?`)) return;

    try {
      await participantService.removeMember(conversation._id, userId);
      toast.success("Đã xóa thành viên");
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa thành viên";
      toast.error(message);
    }
  };

  const handleTransferOwnership = async (userId: string, displayName: string) => {
    if (!confirm(`Bạn có chắc muốn chuyển quyền chủ nhóm cho ${displayName}?`)) return;

    try {
      await participantService.transferOwnership(conversation._id, userId);
      toast.success(`Đã chuyển quyền chủ nhóm cho ${displayName}`);
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể chuyển quyền";
      toast.error(message);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Bạn có chắc muốn rời khỏi nhóm này?")) return;

    try {
      await participantService.leaveGroup(conversation._id);
      toast.success("Đã rời khỏi nhóm");
      onUpdate();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể rời nhóm";
      toast.error(message);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Bạn có chắc muốn XÓA nhóm này? Hành động này không thể hoàn tác!")) return;

    try {
      await conversationService.deleteGroup(conversation._id);
      toast.success("Đã xóa nhóm");
      onUpdate();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa nhóm";
      toast.error(message);
    }
  };

  const handleToggleMute = async () => {
    try {
      const newMuteState = !isMuted;
      await participantService.updateMySettings(conversation._id, { mute: newMuteState });
      setIsMuted(newMuteState);
      toast.success(newMuteState ? "Đã tắt thông báo" : "Đã bật thông báo");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật cài đặt";
      toast.error(message);
    }
  };

  const participantUserIds = new Set(participants.map((p) => p.userID._id));
  const availableFriends = friends.filter((f) => !participantUserIds.has(f._id));

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-yellow-500 text-white">Chủ nhóm</Badge>;
      case "admin":
        return <Badge className="bg-blue-500 text-white">Quản trị viên</Badge>;
      default:
        return <Badge variant="secondary">Thành viên</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full p-8">
          <p className="text-center text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cài đặt nhóm
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Thông tin nhóm</h3>

              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={conversation.group?.avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {conversation.group?.groupname?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Avatar nhóm</p>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="mt-2">
                      Thay đổi avatar
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tên nhóm</Label>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      maxLength={50}
                      placeholder="Nhập tên nhóm..."
                    />
                    <Button size="icon" onClick={handleUpdateGroupName}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setEditingName(false);
                        setNewGroupName(conversation.group?.groupname || "");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="flex-1 p-2 bg-muted rounded-md">
                      {conversation.group?.groupname}
                    </p>
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setEditingName(true)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Thành viên ({participants.length})
                </h3>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddMember(!showAddMember)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Thêm
                  </Button>
                )}
              </div>

              {showAddMember && availableFriends.length > 0 && (
                <div className="p-3 bg-accent/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Chọn bạn bè để thêm vào nhóm:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableFriends.map((friend) => (
                      <button
                        key={friend._id}
                        onClick={() => handleAddMember(friend._id)}
                        className="w-full p-2 flex items-center gap-3 hover:bg-background rounded-lg transition-colors"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={friend.avatarUrl} />
                          <AvatarFallback>
                            {(friend.displayName || friend.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-sm truncate">
                            {friend.displayName || friend.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                        <UserPlus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showAddMember && availableFriends.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tất cả bạn bè đã có trong nhóm
                </p>
              )}

              <div className="space-y-2">
                {participants.map((participant) => {
                  const isCurrentUser = participant.userID._id === user?.id;
                  const canManage =
                    isAdmin &&
                    !isCurrentUser &&
                    participant.role !== "owner" &&
                    !(participant.role === "admin" && !isOwner);

                  return (
                    <div
                      key={participant._id}
                      className="p-3 border rounded-lg flex items-center gap-3"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={participant.userID?.avatarUrl} />
                        <AvatarFallback>
                          {(participant.userID?.displayName || participant.userID?.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {participant.userID?.displayName || participant.userID?.username || "Unknown"}
                            {isCurrentUser && " (Bạn)"}
                          </p>
                          {getRoleIcon(participant.role)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{participant.userID?.username || "unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(participant.role)}
                        {canManage && (
                          <div className="flex gap-1">
                            {isOwner && participant.role !== "owner" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() =>
                                  handleTransferOwnership(
                                    participant.userID._id,
                                    participant.userID?.displayName ||
                                      participant.userID?.username ||
                                      "User"
                                  )
                                }
                                title="Chuyển quyền chủ nhóm"
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={() =>
                                handleRemoveMember(
                                  participant.userID._id,
                                  participant.userID?.displayName ||
                                    participant.userID?.username ||
                                    "User"
                                )
                              }
                              title="Xóa khỏi nhóm"
                            >
                              <UserMinus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Cài đặt thông báo</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleToggleMute}
              >
                {isMuted ? (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Bật thông báo
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Tắt thông báo
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-destructive">Vùng nguy hiểm</h3>

              <Button
                variant="outline"
                className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={handleLeaveGroup}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Rời khỏi nhóm
              </Button>

              {isOwner && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa nhóm vĩnh viễn
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

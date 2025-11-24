import api from "@/lib/api";
import type { Conversation } from "@/types/conversation";

export const conversationService = {
  getMyConversations: async (): Promise<{ conversations: Conversation[] }> => {
    const { data } = await api.get("/api/conversations");
    return data;
  },

  createDirectConversation: async (toUserId: string): Promise<{ conversationId: string }> => {
    const { data } = await api.post("/api/conversations/direct", { toUserId });
    return data;
  },

  createGroupConversation: async (payload: {
    groupname: string;
    avatarUrl?: string;
    memberIds: string[];
  }): Promise<{ conversationId: string }> => {
    const { data } = await api.post("/api/conversations/group", payload);
    return data;
  },

  updateGroupInfo: async (
    conversationId: string,
    payload: { groupname?: string; avatarUrl?: string }
  ): Promise<void> => {
    await api.patch(`/api/conversations/${conversationId}`, payload);
  },

  deleteGroup: async (conversationId: string): Promise<void> => {
    await api.delete(`/api/conversations/${conversationId}`);
  },

  markAsRead: async (conversationId: string, messageId?: string): Promise<void> => {
    await api.post(`/api/conversations/${conversationId}/read`, { messageId });
  },

  getUnreadCount: async (conversationId: string): Promise<{ unreadCount: number }> => {
    const { data } = await api.get(`/api/conversations/${conversationId}/unread-count`);
    return data;
  },
};

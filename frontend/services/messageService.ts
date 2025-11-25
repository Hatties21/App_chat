import api from "@/lib/api";
import type { Message } from "@/types/message";

export const messageService = {
  getMessages: async (
    conversationId: string,
    params?: { limit?: number; before?: string }
  ): Promise<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }> => {
    const { data } = await api.get(`/api/messages/${conversationId}`, { params });
    return data;
  },

  sendMessage: async (payload: {
    conversationID: string;
    type?: string;
    text?: string;
    attachments?: any[];
    clientMsgId?: string;
  }): Promise<{ message: Message }> => {
    const { data } = await api.post("/api/messages", payload);
    return data;
  },

  editMessage: async (messageId: string, text: string): Promise<{ message: Message }> => {
    const { data } = await api.patch(`/api/messages/${messageId}`, { text });
    return data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/api/messages/${messageId}`);
  },

  addReaction: async (messageId: string, emoji: string): Promise<{ message: Message }> => {
    const { data } = await api.post(`/api/messages/${messageId}/reactions`, { emoji });
    return data;
  },

  removeReaction: async (messageId: string, emoji: string): Promise<{ message: Message }> => {
    const { data } = await api.delete(`/api/messages/${messageId}/reactions`, { data: { emoji } });
    return data;
  },
};

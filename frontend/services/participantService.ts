import api from "@/lib/api";

export interface Participant {
  _id: string;
  conversationID: string;
  userID: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  role: "member" | "admin" | "owner";
  joinedAt: string;
  mute?: boolean;
  pinned?: boolean;
  nickname?: string;
}

export const participantService = {
  // Get all participants in a conversation
  getParticipants: async (conversationId: string): Promise<{ participants: Participant[] }> => {
    const { data } = await api.get(`/api/participants/${conversationId}`);
    return data;
  },

  // Add members to group (can add multiple)
  addMembers: async (conversationId: string, memberIds: string[]): Promise<void> => {
    await api.post(`/api/participants/${conversationId}/add`, { memberIds });
  },

  // Remove member from group
  removeMember: async (conversationId: string, userId: string): Promise<void> => {
    await api.delete(`/api/participants/${conversationId}/remove/${userId}`);
  },

  // Transfer ownership
  transferOwnership: async (conversationId: string, newOwnerId: string): Promise<void> => {
    await api.patch(`/api/participants/${conversationId}/transfer-ownership`, {
      conversationId,
      newOwnerId,
    });
  },

  // Update my participant settings (mute, etc)
  updateMySettings: async (
    conversationId: string,
    settings: { mute?: boolean; pinned?: boolean; nickname?: string }
  ): Promise<void> => {
    await api.patch(`/api/participants/${conversationId}/me`, settings);
  },

  // Leave conversation
  leaveGroup: async (conversationId: string): Promise<void> => {
    await api.delete(`/api/participants/${conversationId}/leave`);
  },
};

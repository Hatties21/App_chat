import api from "@/lib/api";

export interface FriendRequest {
  _id: string;
  from: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  to: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  message?: string;
  status: string;
  createdAt: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export const friendService = {
  // Send friend request
  sendFriendRequest: async (toUserId: string, message?: string) => {
    const { data } = await api.post("/api/friends/requests", {
      to: toUserId,
      message,
    });
    return data;
  },

  // Get friend requests (sent and received)
  getFriendRequests: async (): Promise<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }> => {
    const { data } = await api.get("/api/friends/requests");
    return data;
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string) => {
    const { data } = await api.post(`/api/friends/requests/${requestId}/accept`);
    return data;
  },

  // Decline friend request
  declineFriendRequest: async (requestId: string) => {
    await api.post(`/api/friends/requests/${requestId}/decline`);
  },

  // Cancel friend request (sent by me)
  cancelFriendRequest: async (requestId: string) => {
    await api.delete(`/api/friends/requests/${requestId}/cancel`);
  },

  // Get all friends
  getAllFriends: async (): Promise<{ friends: Friend[] }> => {
    const { data } = await api.get("/api/friends");
    return data;
  },

  // Remove friend
  removeFriend: async (friendId: string) => {
    await api.delete(`/api/friends/${friendId}`);
  },
};

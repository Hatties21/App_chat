import { create } from "zustand";
import { Friend, FriendRequest } from "@/services/friendService";

interface FriendStore {
  friends: Friend[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  loading: boolean;
  
  setFriends: (friends: Friend[]) => void;
  setRequests: (sent: FriendRequest[], received: FriendRequest[]) => void;
  setLoading: (loading: boolean) => void;
  
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  
  addSentRequest: (request: FriendRequest) => void;
  removeSentRequest: (requestId: string) => void;
  
  addReceivedRequest: (request: FriendRequest) => void;
  removeReceivedRequest: (requestId: string) => void;
}

export const useFriendStore = create<FriendStore>((set) => ({
  friends: [],
  sentRequests: [],
  receivedRequests: [],
  loading: false,
  
  setFriends: (friends) => set({ friends }),
  setRequests: (sent, received) => set({ sentRequests: sent, receivedRequests: received }),
  setLoading: (loading) => set({ loading }),
  
  addFriend: (friend) => set((state) => ({ 
    friends: [...state.friends, friend] 
  })),
  removeFriend: (friendId) => set((state) => ({ 
    friends: state.friends.filter(f => f._id !== friendId) 
  })),
  
  addSentRequest: (request) => set((state) => ({ 
    sentRequests: [...state.sentRequests, request] 
  })),
  removeSentRequest: (requestId) => set((state) => ({ 
    sentRequests: state.sentRequests.filter(r => r._id !== requestId) 
  })),
  
  addReceivedRequest: (request) => set((state) => ({ 
    receivedRequests: [...state.receivedRequests, request] 
  })),
  removeReceivedRequest: (requestId) => set((state) => ({ 
    receivedRequests: state.receivedRequests.filter(r => r._id !== requestId) 
  })),
}));

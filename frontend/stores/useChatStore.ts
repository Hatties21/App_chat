import { create } from "zustand";
import type { ConversationWithDetails } from "@/types/conversation";
import type { Message } from "@/types/message";
import { conversationService } from "@/services/conversationService";
import { messageService } from "@/services/messageService";
import { useAuthStore } from "@/stores/useAuthStore";

interface TypingUser {
  userId: string;
  displayName: string;
}

interface ChatState {
  conversations: ConversationWithDetails[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  loading: boolean;
  typingUsers: Record<string, TypingUser[]>;
  hasMore: Record<string, boolean>;
  loadingMore: Record<string, boolean>;
  lastConversationsFetch: number;

  // Actions
  fetchConversations: (force?: boolean) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, attachments?: any[]) => Promise<string>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  addTypingUser: (conversationId: string, userId: string, displayName: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: {},
  loading: false,
  typingUsers: {},
  hasMore: {},
  loadingMore: {},
  lastConversationsFetch: 0,

  fetchConversations: async (force = false) => {
    const state = get();
    const now = Date.now();
    const isCacheValid = state.conversations.length > 0 && 
                        (now - state.lastConversationsFetch < CACHE_DURATION);

    // Use cache if valid and not forced
    if (isCacheValid && !force) {
      console.log("Using cached conversations");
      return;
    }

    try {
      set({ loading: true });
      const { conversations } = await conversationService.getMyConversations();
      console.log("Fetched conversations:", conversations.length);
      set({ 
        conversations,
        lastConversationsFetch: now,
      });
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      set({ conversations: [] }); // Clear on error
    } finally {
      set({ loading: false });
    }
  },

  setCurrentConversation: (id) => {
    set({ currentConversationId: id });
    if (id) {
      // Immediately clear unread count in UI
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv._id === id ? { ...conv, unreadCount: 0 } : conv
        ),
      }));

      if (!get().messages[id]) {
        get().fetchMessages(id);
      }
      
      // Mark as read on server
      conversationService.markAsRead(id).catch(err => {
        console.error('Failed to mark as read:', err);
      });
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const { messages, hasMore } = await messageService.getMessages(conversationId, { limit: 25 });
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: messages.reverse(),
        },
        hasMore: {
          ...state.hasMore,
          [conversationId]: hasMore,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  },

  loadMoreMessages: async (conversationId) => {
    const state = get();
    if (state.loadingMore[conversationId] || !state.hasMore[conversationId]) {
      return;
    }

    try {
      set((state) => ({
        loadingMore: { ...state.loadingMore, [conversationId]: true },
      }));

      const existingMessages = state.messages[conversationId] || [];
      const oldestMessage = existingMessages[0];
      
      if (!oldestMessage) return;

      const { messages, hasMore } = await messageService.getMessages(conversationId, {
        limit: 25,
        before: oldestMessage.createdAt,
      });

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...messages.reverse(), ...existingMessages],
        },
        hasMore: {
          ...state.hasMore,
          [conversationId]: hasMore,
        },
        loadingMore: { ...state.loadingMore, [conversationId]: false },
      }));
    } catch (error) {
      console.error("Failed to load more messages:", error);
      set((state) => ({
        loadingMore: { ...state.loadingMore, [conversationId]: false },
      }));
    }
  },

  sendMessage: async (conversationId, text, attachments) => {
    const clientMsgId = `temp-${Date.now()}-${Math.random()}`;
    
    // Get current user info
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Determine message type
    const hasAttachments = attachments && attachments.length > 0;
    const messageType = hasAttachments 
      ? (attachments[0].mime?.startsWith('image/') ? 'image' : 'file')
      : 'text';

    const tempMessage: Message = {
      _id: clientMsgId,
      conversationID: conversationId,
      senderId: {
        _id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName || currentUser.username,
        avatarUrl: currentUser.avatarUrl,
      } as any,
      type: messageType,
      text,
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
      clientMsgId,
      isPending: true, // Mark as pending
    } as any;

    // Optimistically add message immediately
    get().addMessage(tempMessage);

    try {
      const { message } = await messageService.sendMessage({
        conversationID: conversationId,
        type: messageType,
        text,
        attachments: attachments || [],
        clientMsgId,
      });
      
      // Replace temp message with real one
      set((state) => {
        const convId = conversationId;
        const existing = state.messages[convId] || [];
        
        return {
          messages: {
            ...state.messages,
            [convId]: existing.map(m => 
              m._id === clientMsgId ? message : m
            ),
          },
        };
      });
      
      // Return the message ID for socket emit
      return message._id;
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Remove temp message on error
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.filter(
            (m) => m._id !== clientMsgId
          ),
        },
      }));
      
      throw error; // Re-throw for caller to handle
      
      throw error;
    }
  },

  addMessage: (message) => {
    set((state) => {
      const convId = message.conversationID;
      const existing = state.messages[convId] || [];
      
      // Avoid duplicates
      if (existing.some((m) => m._id === message._id)) {
        return state;
      }

      // Update conversation's last message preview
      const updatedConversations = state.conversations.map((conv) => {
        if (conv._id === convId) {
          const senderId = typeof message.senderId === 'string' 
            ? message.senderId 
            : message.senderId._id;
          
          return {
            ...conv,
            lastMessagePreview: {
              content: message.text || `[${message.type}]`,
              createdAt: message.createdAt,
              sender: senderId,
            } as any,
            lastMessageAt: message.createdAt,
          } as typeof conv;
        }
        return conv;
      });

      // Sort conversations by lastMessageAt
      updatedConversations.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });

      return {
        conversations: updatedConversations,
        messages: {
          ...state.messages,
          [convId]: [...existing, message],
        },
      };
    });
  },

  updateMessage: (messageId, updates) => {
    set((state) => {
      const newMessages = { ...state.messages };
      
      Object.keys(newMessages).forEach((convId) => {
        newMessages[convId] = newMessages[convId].map((msg) =>
          msg._id === messageId ? { ...msg, ...updates } : msg
        );
      });

      return { messages: newMessages };
    });
  },

  deleteMessage: (conversationId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.filter(
          (m) => m._id !== messageId
        ),
      },
    }));
  },

  addTypingUser: (conversationId, userId, displayName) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      
      // Don't add if already typing
      if (currentTyping.some(u => u.userId === userId)) {
        return state;
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: [...currentTyping, { userId, displayName }],
        },
      };
    });
  },

  removeTypingUser: (conversationId, userId) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: currentTyping.filter(u => u.userId !== userId),
        },
      };
    });
  },

  addReaction: async (messageId, emoji) => {
    try {
      const { message } = await messageService.addReaction(messageId, emoji);
      get().updateMessage(messageId, { reactions: message.reactions });
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  },

  removeReaction: async (messageId, emoji) => {
    try {
      const { message } = await messageService.removeReaction(messageId, emoji);
      get().updateMessage(messageId, { reactions: message.reactions });
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  },

  updateUserOnlineStatus: (userId, isOnline, lastSeen) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.type === 'direct' && conv.otherUser?._id === userId) {
          return {
            ...conv,
            otherUser: {
              ...conv.otherUser,
              isOnline,
              lastSeen: lastSeen || conv.otherUser.lastSeen,
            },
          };
        }
        return conv;
      }),
    }));
  },
}));

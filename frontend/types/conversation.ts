export interface LastMessagePreview {
  content: string;
  createdAt: string;
  sender: string;
}

export interface GroupInfo {
  groupname: string;
  avatarUrl?: string;
  createdBy: string;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  pairKey?: string;
  group?: GroupInfo;
  lastMessagePreview?: LastMessagePreview;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithDetails extends Conversation {
  otherUser?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
    username: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  unreadCount?: number;
}

export interface MarkAsReadPayload {
  messageId?: string;
}

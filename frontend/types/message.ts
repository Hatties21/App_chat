export type MessageType = "text" | "image" | "video" | "file";

export interface Attachment {
  url: string;
  mime?: string;
  size?: number;
  name?: string;
}

export interface Reaction {
  userId: string | { _id: string; displayName: string; avatarUrl?: string };
  emoji: string;
  createdAt: string;
}

export interface ReadBy {
  userId: string | { _id: string; displayName: string; avatarUrl?: string };
  readAt: string;
}

export interface Message {
  _id: string;
  senderId: string | { _id: string; displayName: string; avatarUrl?: string };
  conversationID: string;
  type: MessageType;
  text?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  readBy?: ReadBy[];
  clientMsgId?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

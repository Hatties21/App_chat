"use client";

import { useAuthStore } from "@/stores/useAuthStore";

interface Reaction {
  userId: {
    _id: string;
    displayName: string;
  } | string;
  emoji: string;
  createdAt: string;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  isMe: boolean;
  showPicker: boolean;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  onTogglePicker: () => void;
}

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export function MessageReactions({
  messageId,
  reactions = [],
  isMe,
  showPicker,
  onAddReaction,
  onRemoveReaction,
  onTogglePicker,
}: MessageReactionsProps) {
  const user = useAuthStore((s) => s.user);

  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReactionClick = (emoji: string) => {
    if (!user) return;

    const userReacted = reactions.some(
      (r) => {
        const userId = typeof r.userId === 'string' ? r.userId : r.userId._id;
        return userId === user.id && r.emoji === emoji;
      }
    );

    if (userReacted) {
      onRemoveReaction(messageId, emoji);
    } else {
      onAddReaction(messageId, emoji);
    }
  };

  const getUserNames = (reactionList: Reaction[]) => {
    return reactionList
      .map((r) => {
        const userId = typeof r.userId === 'string' ? r.userId : r.userId._id;
        const displayName = typeof r.userId === 'string' ? 'User' : r.userId.displayName;
        return userId === user?.id ? 'Bạn' : displayName;
      })
      .join(', ');
  };

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <>
      {hasReactions && (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
            const userReacted = reactionList.some((r) => {
              const userId = typeof r.userId === 'string' ? r.userId : r.userId._id;
              return userId === user?.id;
            });

            return (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110 ${
                  userReacted
                    ? 'bg-primary/15 border border-primary/30 shadow-sm'
                    : 'bg-muted hover:bg-muted/80 border border-transparent hover:border-border'
                }`}
                title={getUserNames(reactionList)}
              >
                <span className="text-base">{emoji}</span>
                <span className="text-xs font-semibold">{reactionList.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={onTogglePicker}
          />
          <div 
            className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} p-2 bg-popover border rounded-xl shadow-xl z-20 flex gap-1 animate-in fade-in zoom-in-95 duration-200`}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReactionClick(emoji);
                  onTogglePicker();
                }}
                className="text-2xl hover:scale-125 transition-all p-2 hover:bg-accent rounded-lg active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

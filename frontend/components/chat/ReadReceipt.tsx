"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ReadBy } from "@/types/message";

interface ReadReceiptProps {
  readBy: ReadBy[];
  currentUserId: string;
  conversationType: "direct" | "group";
}

export function ReadReceipt({ readBy, currentUserId, conversationType }: ReadReceiptProps) {
  if (!readBy || readBy.length === 0) return null;

  const othersRead = readBy.filter((r) => {
    const userId = typeof r.userId === 'string' ? r.userId : r.userId._id;
    return userId !== currentUserId;
  });

  if (othersRead.length === 0) return null;

  if (conversationType === "direct") {
    const reader = othersRead[0];
    const avatarUrl = typeof reader.userId === 'object' ? reader.userId.avatarUrl : undefined;
    const displayName = typeof reader.userId === 'object' ? reader.userId.displayName : 'User';

    return (
      <div className="flex items-center gap-1 mt-1">
        <Avatar className="w-4 h-4 border border-background">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-[8px]">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  if (conversationType === "group") {
    return (
      <div className="flex items-center gap-1 mt-1">
        {othersRead.length <= 3 ? (
          <div className="flex -space-x-2">
            {othersRead.map((reader) => {
              const userId = typeof reader.userId === 'string' ? reader.userId : reader.userId._id;
              const avatarUrl = typeof reader.userId === 'object' ? reader.userId.avatarUrl : undefined;
              const displayName = typeof reader.userId === 'object' ? reader.userId.displayName : 'User';

              return (
                <Avatar key={userId} className="w-4 h-4 border-2 border-background">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-[8px]">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Seen by {othersRead.length}
          </span>
        )}
      </div>
    );
  }

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface OnlineStatusProps {
  isOnline?: boolean;
  lastSeen?: string;
}

export function OnlineStatus({ isOnline, lastSeen }: OnlineStatusProps) {
  const [, setTick] = useState(0);

  // Update every minute to refresh the time display
  useEffect(() => {
    if (!isOnline && lastSeen) {
      const interval = setInterval(() => {
        setTick(prev => prev + 1);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isOnline, lastSeen]);

  if (isOnline) {
    return (
      <div className="text-xs text-primary flex items-center gap-1.5 font-medium">
        <span className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-full animate-pulse" />
        Đang hoạt động
      </div>
    );
  }

  // When offline, show time since last seen
  if (lastSeen) {
    const timeAgo = formatDistanceToNow(new Date(lastSeen), { 
      addSuffix: false, 
      locale: vi 
    });
    
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <span className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
        Hoạt động {timeAgo} trước
      </div>
    );
  }

  return null;
}

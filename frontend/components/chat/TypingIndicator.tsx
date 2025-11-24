"use client";

interface TypingIndicatorProps {
  displayName: string;
}

export function TypingIndicator({ displayName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-1 bg-muted rounded-full px-3 py-2">
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-primary/80 font-medium">{displayName} đang nhập...</span>
    </div>
  );
}

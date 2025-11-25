"use client";

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Heart, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { uploadService } from "@/services/uploadService";
import Image from "next/image";

const MessageInput = forwardRef((props, ref) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Optimize: Only subscribe to what we need
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const { emitTypingStart, emitTypingStop, emitMessageSend } = useSocket();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentConversationId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentConversationId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTyping = useCallback(() => {
    if (!currentConversationId) return;

    emitTypingStart(currentConversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(currentConversationId);
    }, 3000);
  }, [currentConversationId, emitTypingStart, emitTypingStop]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    handleTyping();
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const processFile = (file: File) => {
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  useImperativeHandle(ref, () => ({
    handleExternalFile: processFile
  }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (messageText?: string) => {
    if (!currentConversationId) return;

    const textToSend = messageText || text.trim();
    
    if (!textToSend && !selectedFile) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTypingStop(currentConversationId);
    
    const fileToSend = selectedFile;

    try {
      setUploading(true);

      let attachment = null;
      if (fileToSend) {
        const uploadResult = await uploadService.uploadFile(fileToSend);
        attachment = {
          url: uploadResult.file.url,
          name: uploadResult.file.name,
          size: uploadResult.file.size,
          mime: uploadResult.file.mime,
        };
      }

      const messageId = await sendMessage(
        currentConversationId, 
        textToSend || (attachment ? "" : ""), 
        attachment ? [attachment] : undefined
      );
      
      // Emit socket event with the actual message ID
      emitMessageSend(currentConversationId, messageId);
      
      // Clear input after successful send
      setText("");
      clearFile();
      
      if (attachment) {
        toast.success("File đã được gửi");
      }
    } catch (error) {
      toast.error("Không thể gửi tin nhắn");
      if (!messageText) {
        setText(textToSend);
      }
      if (fileToSend) {
        setSelectedFile(fileToSend);
      }
    } finally {
      setUploading(false);
      // Always restore focus after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleLike = () => {
    handleSend("❤️");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentConversationId) return null;

  return (
    <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {selectedFile && (
        <div className="mb-3 p-3 bg-accent rounded-lg">
          <div className="flex items-start gap-3">
            {previewUrl ? (
              <div className="relative w-20 h-20 rounded overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded bg-muted flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={clearFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3 items-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
        />
        
        <Button
          size="icon"
          variant="ghost"
          className="h-12 w-12 rounded-full shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            readOnly={uploading}
            className="flex-1 min-h-[48px] max-h-[120px] resize-none rounded-2xl px-4 py-3 text-base focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide"
            rows={1}
          />
          {uploading && (
            <div className="absolute inset-0 bg-background/50 rounded-2xl pointer-events-none" />
          )}
        </div>
        
        {text.trim() || selectedFile ? (
          <Button 
            onClick={() => handleSend()} 
            size="icon"
            className="h-12 w-12 rounded-full shrink-0 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            disabled={uploading}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleLike} 
            size="icon" 
            variant="ghost"
            className="h-12 w-12 rounded-full shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-all hover:scale-110 active:scale-95"
          >
            <Heart className="w-6 h-6 fill-current" />
          </Button>
        )}
      </div>
    </div>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;

"use client";

import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface Attachment {
  url: string;
  name?: string;
  size?: number;
  mime?: string;
}

interface MessageAttachmentProps {
  attachments: Attachment[];
  isMe: boolean;
}

export function MessageAttachment({ attachments, isMe }: MessageAttachmentProps) {
  const [imageError, setImageError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!attachments || attachments.length === 0) return null;

  const attachment = attachments[0];
  
  const isImageByMime = attachment.mime?.startsWith("image/");
  const isImageByExtension = attachment.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
  const isImageByName = attachment.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
  const isImage = isImageByMime || isImageByExtension || isImageByName;

  const handleImageClick = () => {
    if (isImage) {
      setShowLightbox(true);
    } else {
      window.open(attachment.url, "_blank");
    }
  };

  const handleDownload = () => {
    window.open(attachment.url, "_blank");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isImage && !imageError) {
    return (
      <>
        <div>
          <div className="relative rounded-lg overflow-hidden max-w-sm cursor-pointer group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt={attachment.name || "Image"}
              className="object-cover w-full h-auto max-h-96 rounded-lg transition-all group-hover:brightness-110"
              onError={() => setImageError(true)}
              onClick={handleImageClick}
            />
          </div>
        </div>

        {showLightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              onClick={() => setShowLightbox(false)}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt={attachment.name || "Image"}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleDownload}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors max-w-sm ${
          isMe
            ? "bg-primary/10 border-primary/20 hover:bg-primary/20"
            : "bg-muted hover:bg-muted/80"
        }`}
      >
        <div className={`p-2 rounded ${isMe ? "bg-primary/20" : "bg-background"}`}>
          {isImage ? (
            <ImageIcon className="w-5 h-5" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">
            {attachment.name || "File"}
          </p>
          {attachment.size && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
            </p>
          )}
        </div>
        <Download className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
}

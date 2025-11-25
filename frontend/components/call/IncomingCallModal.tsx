"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/stores/useCallStore";
import { useSocket } from "@/hooks/useSocket";
import { playRingtone, stopRingtone } from "@/lib/ringtone";

export function IncomingCallModal() {
  const { status, type, caller, acceptCall, rejectCall } = useCallStore();
  const { emitCallAccept, emitCallReject } = useSocket();
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (status === "ringing") {
      setRinging(true);
      
      // Play ringtone
      playRingtone();
      
      // Focus window/tab - bring to front
      if (typeof window !== "undefined") {
        window.focus();
        
        // Vibrate if supported (mobile devices)
        if ("vibrate" in navigator) {
          // Vibrate pattern: vibrate 200ms, pause 100ms, repeat
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // ALWAYS show notification (not just when hidden)
        // This is the only way to bring attention when browser is minimized
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            const notification = new Notification("📞 Cuộc gọi đến", {
              body: `${caller?.displayName} đang gọi cho bạn`,
              icon: caller?.avatarUrl || "/next.svg",
              tag: "incoming-call",
              requireInteraction: true, // Keep notification until user interacts
              silent: false, // Play system notification sound
            });
            
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
            
            // Auto-close notification when call ends
            const checkCallStatus = setInterval(() => {
              if (status !== "ringing") {
                notification.close();
                clearInterval(checkCallStatus);
              }
            }, 500);
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                const notification = new Notification("📞 Cuộc gọi đến", {
                  body: `${caller?.displayName} đang gọi cho bạn`,
                  icon: caller?.avatarUrl || "/next.svg",
                  tag: "incoming-call",
                  requireInteraction: true,
                  silent: false,
                });
                
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              }
            });
          }
        }
        
        // Flash title to get attention
        let originalTitle = document.title;
        let flashInterval = setInterval(() => {
          document.title = document.title === originalTitle 
            ? `📞 ${caller?.displayName} đang gọi...` 
            : originalTitle;
        }, 1000);
        
        return () => {
          clearInterval(flashInterval);
          document.title = originalTitle;
        };
      }
      
      return () => {
        stopRingtone();
      };
    } else {
      setRinging(false);
      stopRingtone();
    }
  }, [status, caller]);

  if (status !== "ringing" || !caller) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Caller Info */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
              <AvatarImage src={caller.avatarUrl} />
              <AvatarFallback className="text-3xl">
                {caller.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {ringing && (
              <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold">{caller.displayName}</h2>
            <p className="text-muted-foreground">
              {type === "video" ? "Video" : "Voice"} Call
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="destructive"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => {
              stopRingtone();
              if (caller?.conversationId) {
                emitCallReject(caller.conversationId);
              }
              rejectCall();
            }}
          >
            <PhoneOff className="w-5 h-5" />
            Từ chối
          </Button>
          <Button
            size="lg"
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => {
              stopRingtone();
              if (caller?.conversationId && caller?.id) {
                emitCallAccept(caller.conversationId, caller.id);
              }
              acceptCall();
            }}
          >
            {type === "video" ? (
              <Video className="w-5 h-5" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            Chấp nhận
          </Button>
        </div>
      </div>
    </div>
  );
}

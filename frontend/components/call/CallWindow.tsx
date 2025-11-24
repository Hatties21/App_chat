"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/stores/useCallStore";
import { useSocket } from "@/hooks/useSocket";

export function CallWindow() {
  const {
    status,
    type,
    caller,
    receiver,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    endCall,
  } = useCallStore();
  const { emitCallEnd } = useSocket();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);

  const otherUser = caller || receiver;
  const isActive = status === "calling" || status === "connected";

  // Debug logging
  useEffect(() => {
    console.log("📺 CallWindow render - status:", status, "isActive:", isActive, "otherUser:", otherUser?.displayName);
  }, [status, isActive, otherUser]);

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (status === "connected") {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [status]);

  if (!isActive || !otherUser) {
    console.log("📺 CallWindow hidden - isActive:", isActive, "otherUser:", !!otherUser);
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video Display */}
      <div className="relative w-full h-full">
        {/* Remote Video/Avatar */}
        {type === "video" && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-center space-y-4">
              <Avatar className="w-32 h-32 mx-auto ring-4 ring-primary/20">
                <AvatarImage src={otherUser.avatarUrl} />
                <AvatarFallback className="text-5xl">
                  {otherUser.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {otherUser.displayName}
                </h2>
                <p className="text-white/70">
                  {status === "calling" ? "Đang gọi..." : formatDuration(callDuration)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {type === "video" && localStream && (
          <div className="absolute top-4 right-4 w-32 h-48 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-white font-medium">{otherUser.displayName}</p>
          <p className="text-white/70 text-sm">
            {status === "calling" ? "Đang gọi..." : formatDuration(callDuration)}
          </p>
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-xl rounded-full px-6 py-4">
            {/* Mute Button */}
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "secondary"}
              className="rounded-full w-14 h-14"
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            {/* End Call Button */}
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16"
              onClick={() => {
                const conversationId = caller?.conversationId || receiver?.conversationId;
                if (conversationId) {
                  emitCallEnd(conversationId);
                }
                endCall();
              }}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            {/* Video Toggle Button */}
            {type === "video" && (
              <Button
                size="lg"
                variant={isVideoOff ? "destructive" : "secondary"}
                className="rounded-full w-14 h-14"
                onClick={toggleVideo}
              >
                {isVideoOff ? (
                  <VideoOff className="w-6 h-6" />
                ) : (
                  <Video className="w-6 h-6" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

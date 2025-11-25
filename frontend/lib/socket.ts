import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  // If socket already exists, just return it (don't create new one)
  if (socket) {
    console.log("⚠️ Socket already exists, reusing:", socket.id);
    return socket;
  }

  console.log("✅ Creating new socket connection");
  socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001", {
    auth: { token },
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

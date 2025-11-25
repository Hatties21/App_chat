import logger from "../utils/logger.js";

export const handleCallEvents = (io, socket) => {
  logger.info(`📞 Setting up call event handlers for socket: ${socket.id}`);
  
  // Initiate call - Both users join room immediately
  socket.on("callInitiate", (data) => {
    logger.info(`📞 CALL INITIATE from ${socket.userId}`);
    
    try {
      const { conversationId, to, from, type } = data;
      logger.info(`📞 Call: ${from?.displayName} -> ${to} (${type})`);
      
      // Emit to conversation room - both users will receive this
      io.to(conversationId).emit("callIncoming", {
        from,
        type,
        conversationId,
      });
      
      logger.info(`✅ callIncoming emitted to conversation ${conversationId}`);
    } catch (error) {
      logger.error(`Error in callInitiate:`, error);
    }
  });

  // Accept call - Start WebRTC connection
  socket.on("callAccept", ({ conversationId, callerId }) => {
    logger.info(`✅ Call accepted in conversation: ${conversationId}`);
    
    // Notify both users to start WebRTC
    io.to(conversationId).emit("callAccepted", {
      conversationId,
    });
    
    logger.info(`✅ callAccepted emitted to conversation ${conversationId}`);
  });

  // Reject call
  socket.on("callReject", ({ conversationId }) => {
    logger.info(`❌ Call rejected in conversation: ${conversationId}`);
    
    // Notify both users
    io.to(conversationId).emit("callRejected", {
      conversationId,
    });
    
    logger.info(`✅ callRejected emitted to conversation ${conversationId}`);
  });

  // End call
  socket.on("callEnd", ({ conversationId }) => {
    logger.info(`📴 Call ended in conversation: ${conversationId}`);
    
    // Notify both users
    io.to(conversationId).emit("callEnded", {
      conversationId,
    });
    
    logger.info(`✅ callEnded emitted to conversation ${conversationId}`);
  });

  // WebRTC signaling - Exchange ICE candidates and SDP
  socket.on("callSignal", ({ conversationId, signal, to }) => {
    logger.info(`📡 Signal from ${socket.userId} to ${to}`);
    
    // Find target socket and send signal
    for (const [socketId, sock] of io.sockets.sockets) {
      if (sock.userId === to) {
        sock.emit("callSignal", {
          signal,
          from: socket.userId,
        });
        logger.info(`✅ Signal sent to ${to}`);
        break;
      }
    }
  });
};

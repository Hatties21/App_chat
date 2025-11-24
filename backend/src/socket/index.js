import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Participant from '../models/Participant.js';
import logger from '../utils/logger.js';
import { handleCallEvents } from './callHandler.js';

const userSockets = new Map(); // userId -> Set of socketIds

export const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select('-hashedPassword');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`User connected: ${userId}`);

    // Track user's sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join room with userId (for direct messaging/calls)
    socket.join(userId);
    logger.info(`Socket ${socket.id} joined room: ${userId}`);

    // Update user online status
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Emit online status to all users
    socket.broadcast.emit('user:online', { 
      userId,
      timestamp: new Date().toISOString(),
    });

    // Join user's conversations
    await joinUserConversations(socket, userId);

    // Handle typing indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        userId,
        conversationId,
        displayName: socket.user.displayName,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', {
        userId,
        conversationId,
      });
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, messageId } = data;
        
        // Fetch the message and emit to conversation room
        const message = await Message.findById(messageId)
          .populate('senderId', 'displayName avatarUrl')
          .lean();

        if (message) {
          io.to(conversationId).emit('message:new', message);
        }
      } catch (error) {
        logger.error('Error handling message:send', error);
      }
    });

    // Handle message read
    socket.on('message:read', async ({ conversationId, messageId }) => {
      socket.to(conversationId).emit('message:read', {
        conversationId,
        messageId,
        userId,
      });
    });

    // Handle call events
    logger.info(`Registering call events for socket: ${socket.id}`);
    handleCallEvents(io, socket);
    logger.info(`Call events registered for socket: ${socket.id}`);

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${userId}`);
      
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        
        // If user has no more sockets, mark as offline
        if (sockets.size === 0) {
          userSockets.delete(userId);
          
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
          });
          
          socket.broadcast.emit('user:offline', { 
            userId,
            lastSeen: lastSeen.toISOString(),
          });
        }
      }
    });
  });
};

async function joinUserConversations(socket, userId) {
  try {
    const participants = await Participant.find({ userID: userId }).lean();
    const conversationIds = participants.map(p => p.conversationID.toString());
    
    conversationIds.forEach(convId => {
      socket.join(convId);
    });
    
    logger.info(`User ${userId} joined ${conversationIds.length} conversations`);
  } catch (error) {
    logger.error('Error joining conversations:', error);
  }
}

export const emitToUser = (userId, event, data) => {
  const sockets = userSockets.get(userId.toString());
  if (sockets) {
    sockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
};

export const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// Test endpoint to manually trigger call
router.post('/trigger-call', (req, res) => {
  const { to, from, type } = req.body;
  
  logger.info(`📞 TEST: Call trigger received via HTTP`);
  logger.info(`From: ${from.id} -> To: ${to} (${type})`);
  
  // Get io instance from app
  const io = req.app.get('io');
  
  if (!io) {
    logger.error('Socket.io instance not found!');
    return res.status(500).json({ error: 'Socket.io not initialized' });
  }
  
  // Emit directly
  logger.info(`Emitting call:incoming to room: ${to}`);
  io.to(to).emit('call:incoming', {
    from,
    type,
    signal: { type: 'offer', sdp: 'test' }
  });
  
  logger.info(`Event emitted successfully`);
  
  res.json({ 
    success: true, 
    message: 'Call event emitted',
    to,
    from: from.id
  });
});

export default router;

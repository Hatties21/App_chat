import Session from '../models/Session.js';
import logger from './logger.js';

/**
 * Cleanup expired sessions
 * Chạy định kỳ để xóa sessions đã hết hạn
 */
export const cleanupExpiredSessions = async () => {
  try {
    const deletedCount = await Session.cleanupExpired();
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired sessions`);
    }
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up sessions:', error);
    return 0;
  }
};

/**
 * Start cleanup job
 * Chạy mỗi 1 giờ
 */
export const startSessionCleanupJob = () => {
  // Chạy ngay lập tức
  cleanupExpiredSessions();
  
  // Chạy mỗi 1 giờ
  const interval = 60 * 60 * 1000; // 1 hour
  setInterval(cleanupExpiredSessions, interval);
  
  console.log('🧹 Session cleanup job started (runs every 1 hour)');
  logger.info('Session cleanup job started (runs every 1 hour)');
};

/**
 * Cleanup old sessions for a specific user
 * Giữ lại N sessions mới nhất
 */
export const cleanupUserSessions = async (userId, keepCount = 5) => {
  try {
    await Session.limitUserSessions(userId, keepCount);
    logger.info(`Cleaned up old sessions for user: ${userId}`);
  } catch (error) {
    logger.error('Error cleaning up user sessions:', error);
  }
};

import Session from "../models/Session.js";
import { AppError } from "../middlewares/errorHandler.js";
import logger from "../utils/logger.js";

/**
 * Get all active sessions for current user
 */
export const getMySessions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('deviceInfo createdAt expiresAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get current session token
    const currentToken = req.cookies?.refreshToken;

    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.refreshToken === currentToken,
    }));

    return res.status(200).json({
      success: true,
      sessions: sessionsWithCurrent,
      total: sessions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw new AppError("Session không tồn tại", 404);
    }

    // Delete session
    await Session.deleteOne({ _id: sessionId });

    logger.info(`Session revoked: ${sessionId} for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Đã đăng xuất thiết bị",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke all sessions except current
 */
export const revokeAllOtherSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentToken = req.cookies?.refreshToken;

    if (!currentToken) {
      throw new AppError("Token không tồn tại", 401);
    }

    // Delete all sessions except current
    const result = await Session.deleteMany({
      userId,
      refreshToken: { $ne: currentToken },
    });

    logger.info(`Revoked ${result.deletedCount} sessions for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: `Đã đăng xuất ${result.deletedCount} thiết bị khác`,
      revokedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke all sessions (logout from all devices)
 */
export const revokeAllSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await Session.deleteMany({ userId });

    // Clear current cookie
    res.clearCookie("refreshToken");

    logger.info(`Revoked all ${result.deletedCount} sessions for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Đã đăng xuất tất cả thiết bị",
      revokedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

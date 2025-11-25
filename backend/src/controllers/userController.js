import User from "../models/User.js";
import { AppError } from "../middlewares/errorHandler.js";
import logger from "../utils/logger.js";

export const authMe = async (req, res, next) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
    }

    const searchTerm = q.trim();

    // Search by username or email (case-insensitive)
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { username: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { displayName: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .select("_id username email displayName avatarUrl")
      .limit(20)
      .lean();

    logger.info(`User search: "${searchTerm}" - ${users.length} results`);

    return res.status(200).json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-hashedPassword')
      .lean();

    if (!user) {
      throw new AppError("Không tìm thấy người dùng", 404);
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, phone, avatarUrl, theme } = req.body;

    // Validate input
    const updates = {};
    if (displayName !== undefined) {
      if (displayName.trim().length === 0) {
        throw new AppError("Tên hiển thị không được để trống", 400);
      }
      if (displayName.length > 50) {
        throw new AppError("Tên hiển thị không quá 50 ký tự", 400);
      }
      updates.displayName = displayName.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 500) {
        throw new AppError("Giới thiệu không quá 500 ký tự", 400);
      }
      updates.bio = bio.trim();
    }

    if (phone !== undefined) {
      if (phone && phone.length > 20) {
        throw new AppError("Số điện thoại không hợp lệ", 400);
      }
      updates.phone = phone.trim() || null;
    }

    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl.trim() || null;
    }

    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        throw new AppError("Theme không hợp lệ", 400);
      }
      updates.theme = theme;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-hashedPassword");

    if (!updatedUser) {
      throw new AppError("Không tìm thấy người dùng", 404);
    }

    logger.info(`User profile updated: ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
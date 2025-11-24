import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import { AppError } from "../middlewares/errorHandler.js";
import logger from "../utils/logger.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const signUp = async (req, res, next) => {
  try {
    const { username, password, email, displayName } = req.body;

    // kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({ username });
    if (duplicate) {
      throw new AppError("Username đã tồn tại", 409);
    }

    // kiểm tra email tồn tại chưa
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new AppError("Email đã được sử dụng", 409);
    }

    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    // tạo user mới
    await User.create({
      username,
      hashedPassword,
      email,
      displayName,
    });

    logger.info(`New user registered: ${username}`);
    return res.status(201).json({ 
      success: true,
      message: "Đăng ký thành công!" 
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // lấy hashedPassword trong db để so với password input
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError("Username hoặc password không chính xác", 401);
    }

    // kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordCorrect) {
      throw new AppError("Username hoặc password không chính xác", 401);
    }

    // Giới hạn số session per user (max 5 devices)
    await Session.limitUserSessions(user._id, 5);

    // tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Lấy device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress,
      lastUsedAt: new Date(),
    };

    // tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
      deviceInfo,
    });

    // trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", //backend, frontend deploy riêng
      maxAge: REFRESH_TOKEN_TTL,
    });

    logger.info(`User signed in: ${username} from ${deviceInfo.ip}`);
    
    // trả access token về trong res
    return res.status(200).json({ 
      success: true,
      message: `${user.displayName} đã đăng nhập thành công!`, 
      accessToken 
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await Session.deleteOne({ refreshToken: token });
      res.clearCookie("refreshToken");
    }

    logger.info(`User signed out`);
    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new AppError("Token không tồn tại", 401);
    }

    const session = await Session.findOne({ refreshToken: token, isRevoked: false });
    if (!session) {
      throw new AppError("Token không hợp lệ hoặc đã hết hạn", 403);
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      throw new AppError("Token đã hết hạn", 403);
    }

    // Update last used time
    session.deviceInfo.lastUsedAt = new Date();
    await session.save();

    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    logger.info(`Token refreshed for user: ${session.userId}`);

    return res.status(200).json({ 
      success: true,
      accessToken 
    });
  } catch (error) {
    next(error);
  }
};
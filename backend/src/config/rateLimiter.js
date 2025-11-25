import rateLimit from 'express-rate-limit';

const isDevelopment = process.env.NODE_ENV !== 'production';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for chat app (lots of messages/updates)
  message: 'Quá nhiều request từ IP này, vui lòng thử lại sau',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth endpoints rate limiter (signin, signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // Increased for better UX
  message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút',
  skipSuccessfulRequests: false, // Count all requests (even successful ones)
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 20 : 3, // Very strict
  message: 'Quá nhiều lần thử, vui lòng thử lại sau 1 giờ',
  skipSuccessfulRequests: true, // Only count failed requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Refresh token limiter (more lenient)
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 20, // Allow more refresh attempts
  message: 'Quá nhiều lần refresh token, vui lòng đăng nhập lại',
  standardHeaders: true,
  legacyHeaders: false,
});

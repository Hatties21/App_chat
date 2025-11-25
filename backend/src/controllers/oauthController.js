import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    console.log("=== Google OAuth Callback ===");
    console.log("User:", user ? "✓ Found" : "✗ Missing");

    if (!user) {
      logger.error("Google OAuth: No user in request");
      console.error("Redirecting to signin with error");
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
    }

    // Generate JWT token (use ACCESS_TOKEN_SECRET to match authMiddleware)
    const token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Token generated:", token ? "✓ Success" : "✗ Failed");

    // Update last login
    user.lastSeen = new Date();
    await user.save();

    logger.info(`Google OAuth success: ${user.email}`);

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`;
    console.log("Redirecting to:", redirectUrl);

    // Redirect to frontend with token
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error("Google OAuth callback error:", error);
    console.error("Error in callback:", error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/signin?error=oauth_failed`);
  }
};



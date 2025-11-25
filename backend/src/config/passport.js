import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Hardcoded credentials for testing
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "1036161385188-7pacfuqka9vsr427er54e8uelrhqcv6n.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback";

console.log("=== Google OAuth Configuration ===");
console.log("CLIENT_ID:", GOOGLE_CLIENT_ID ? "✓ Found" : "✗ Missing");
console.log("CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "✓ Found" : "✗ Missing");
console.log("CALLBACK_URL:", GOOGLE_CALLBACK_URL);
console.log("==================================");

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
try {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
        async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          logger.info(`Google OAuth: Existing user logged in - ${user.email}`);
          return done(null, user);
        }

        // Check if email already exists (linked to regular account)
        const email = profile.emails[0].value;
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
          logger.info(`Google OAuth: Linked to existing account - ${email}`);
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          email: email,
          displayName: profile.displayName,
          username: email.split("@")[0] + "_" + Date.now(), // Generate unique username
          avatarUrl: profile.photos[0]?.value,
          // No password needed for OAuth users
        });

        logger.info(`Google OAuth: New user created - ${email}`);
        done(null, user);
      } catch (error) {
        logger.error("Google OAuth error:", error);
        done(error, null);
      }
    }
    )
  );
  console.log("✓ Google OAuth strategy registered successfully");
  logger.info("✓ Google OAuth strategy registered successfully");
} catch (error) {
  console.error("✗ Failed to register Google OAuth strategy:", error);
  logger.error("✗ Failed to register Google OAuth strategy:", error);
}

export default passport;

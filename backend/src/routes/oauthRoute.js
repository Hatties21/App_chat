import express from "express";
import passport from "passport";
import { googleCallback } from "../controllers/oauthController.js";

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/signin?error=oauth_failed`,
    session: false 
  }),
  googleCallback
);

export default router;

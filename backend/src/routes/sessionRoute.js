import express from "express";
import {
  getMySessions,
  revokeSession,
  revokeAllOtherSessions,
  revokeAllSessions,
} from "../controllers/sessionController.js";

const router = express.Router();

// Get all active sessions
router.get("/", getMySessions);

// Revoke a specific session
router.delete("/:sessionId", revokeSession);

// Revoke all other sessions (keep current)
router.post("/revoke-others", revokeAllOtherSessions);

// Revoke all sessions (logout from all devices)
router.post("/revoke-all", revokeAllSessions);

export default router;

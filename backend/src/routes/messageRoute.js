import express from "express";
import { 
  sendMessage, 
  getMessages, 
  editMessage, 
  deleteMessage,
  addReaction,
  removeReaction
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/:conversationId", getMessages);

router.post("/", sendMessage);

router.patch("/:messageId", editMessage);

router.delete("/:messageId", deleteMessage);

// Reaction routes
router.post("/:messageId/reactions", addReaction);
router.delete("/:messageId/reactions", removeReaction);

export default router;
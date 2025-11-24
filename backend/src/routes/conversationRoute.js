import express from "express";
import { 
  createGroupConversation, 
  deleteGroupConversation, 
  directConversation, 
  getMyConversations, 
  updateGroupInfo,
  markAsRead,
  getUnreadCount
} from "../controllers/conversationController.js";

const router = express.Router();

// Get my conversations
router.get("/", getMyConversations);

// Create direct conversation
router.post("/direct", directConversation);

// Create group conversation
router.post("/group", createGroupConversation);

// Update group info
router.patch("/:conversationId", updateGroupInfo);

// Delete group conversation
router.delete("/:conversationId", deleteGroupConversation);

// Mark as read
router.post("/:conversationId/read", markAsRead);

// Get unread count
router.get("/:conversationId/unread-count", getUnreadCount);

export default router;
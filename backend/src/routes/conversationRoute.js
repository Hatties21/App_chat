import express from "express";
import { createGroupConversation, deleteGroupConversation, directConversation, getMyConversations, updateGroupInfo } from "../controllers/conversationController.js";

const router = express.Router();

router.get("/me", getMyConversations);

router.post("/direct", directConversation);

router.post("/group", createGroupConversation);

router.patch("/:conversationId/group", updateGroupInfo);

router.delete("/:conversationId/group", deleteGroupConversation);

export default router;
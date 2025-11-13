import express from "express";
import { sendMessage, getMessages,editMessage, deleteMessage } from "../controllers/messageController.js";

const router = express.Router();

router.get("/:conversationId", getMessages);

router.post("/", sendMessage);

router.patch("/:messageId", editMessage);

router.delete("/:messageId", deleteMessage);

export default router;
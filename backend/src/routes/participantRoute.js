import express from "express";
import { addMembers, getParticipants, leaveGroup, markRead, removeMember, transferOwnership, updateMyParticipantSettings } from "../controllers/participantController.js";

const router = express.Router();

router.get("/:conversationId", getParticipants);

router.post("/:conversationId/add", addMembers);

router.patch("/:conversationId/mark-read", markRead);

router.patch("/:conversationId/transfer-ownership", transferOwnership);

router.patch("/:conversationId/me", updateMyParticipantSettings);

router.delete("/:conversationId/remove/:userId", removeMember);

router.delete("/:conversationId/leave", leaveGroup);

export default router;
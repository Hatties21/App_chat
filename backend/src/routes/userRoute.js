import express from "express";
import { authMe, updateProfile, searchUsers, getUserProfile } from "../controllers/userController.js";
import { validate, userSchemas } from "../middlewares/validation.js";

const router = express.Router();

// Search users
router.get("/search", searchUsers);

// Get current user profile
router.get("/me", authMe);

// Get user profile by ID
router.get("/:userId", getUserProfile);

// Update current user profile
router.patch("/me", validate(userSchemas.updateProfile), updateProfile);

export default router;
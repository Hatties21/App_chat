import express from 'express';
import { signUp, signIn, signOut, refreshToken } from '../controllers/authController.js';
import { validate, authSchemas } from '../middlewares/validation.js';
import { authLimiter, refreshLimiter } from '../config/rateLimiter.js';

const router = express.Router();

// Apply auth limiter to signup and signin
router.post('/signup', authLimiter, validate(authSchemas.signUp), signUp);
router.post('/signin', authLimiter, validate(authSchemas.signIn), signIn);

// No limiter for signout (it's safe)
router.post('/signout', signOut);

// Separate limiter for refresh token (more lenient)
router.post('/refresh-token', refreshLimiter, refreshToken);

export default router;
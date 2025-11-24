import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import oauthRoute from './routes/oauthRoute.js';
import userRoute from './routes/userRoute.js';
import friendRoute from './routes/friendRoute.js';
import conversationRoute from './routes/conversationRoute.js';
import messageRoute from './routes/messageRoute.js';
import participantRoute from './routes/participantRoute.js';
import sessionRoute from './routes/sessionRoute.js';
import uploadRoute from './routes/uploadRoute.js';
import testCallRoute from './routes/testCallRoute.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import logger from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initializeSocket } from './socket/index.js';
import { apiLimiter, authLimiter } from './config/rateLimiter.js';
import passportConfig from './config/passport.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

const PORT = process.env.PORT || 5001;

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
}));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Rate limiting (from config)
app.use('/api/', apiLimiter);

// Body parser middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport
app.use(passportConfig.initialize());

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

// Swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (rate limiting applied in route file)
app.use("/api/auth", authRoute);
app.use("/api/auth", oauthRoute); // OAuth routes
app.use("/api/test-call", testCallRoute); // Test route (no auth needed)

// Private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/participants", participantRoute);
app.use("/api/sessions", sessionRoute);
app.use("/api/upload", uploadRoute);

// Error handler (must be last)
app.use(errorHandler);

// Store io instance in app for access in routes
app.set('io', io);

// Initialize Socket.IO
initializeSocket(io);

// Start server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    // Use console.log for startup messages (always visible)
    console.log(`✅ Server đang chạy trên cổng ${PORT}`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    
    // Also log to file
    logger.info(`Server started on port ${PORT}`);
  });
  
  // Start session cleanup job
  import('./utils/sessionCleanup.js').then(({ startSessionCleanupJob }) => {
    startSessionCleanupJob();
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { io };
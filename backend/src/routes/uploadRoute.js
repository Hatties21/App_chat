import express from 'express';
import { upload } from '../middlewares/upload.js';
import { uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route is working' });
});

// Upload single file
router.post('/', upload.single('file'), uploadFile);

export default router;

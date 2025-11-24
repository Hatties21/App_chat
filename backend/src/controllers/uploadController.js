import { uploadToCloudinary } from '../config/cloudinary.js';
import { cleanupFile } from '../middlewares/upload.js';
import logger from '../utils/logger.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info(`Uploading file: ${req.file.originalname}`);

    // Check if Cloudinary is configured
    const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

    let fileUrl;
    let publicId = null;

    if (useCloudinary) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file);
      fileUrl = result.url;
      publicId = result.publicId;
      
      // Clean up local file after upload
      cleanupFile(req.file.path);
    } else {
      // Use local storage
      // Generate URL for local file (use backend URL, not client URL)
      const filename = req.file.filename;
      const backendUrl = `http://localhost:${process.env.PORT || 5001}`;
      fileUrl = `${backendUrl}/uploads/${filename}`;
      
      logger.info('Using local storage (Cloudinary not configured)');
    }

    logger.info(`File uploaded successfully: ${fileUrl}`);

    return res.status(200).json({
      success: true,
      file: {
        url: fileUrl,
        publicId: publicId,
        format: req.file.mimetype.split('/')[1],
        size: req.file.size,
        name: req.file.originalname,
        mime: req.file.mimetype,
      },
    });
  } catch (error) {
    // Clean up local file on error
    if (req.file) {
      cleanupFile(req.file.path);
    }
    
    logger.error('Upload error:', error);
    next(error);
  }
};

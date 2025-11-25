import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info('Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '✗ Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✓ Found' : '✗ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✓ Found' : '✗ Missing',
});

export const uploadToCloudinary = async (file, folder = 'chat-attachments') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'auto', // Automatically detect file type
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
  }
};

export default cloudinary;

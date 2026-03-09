// backend/src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    console.log('Cloudinary Configured'.cyan.underline);
  } catch (error) {
    console.error('Cloudinary configuration failed:'.red, error);
  }
};

export { cloudinary, connectCloudinary };
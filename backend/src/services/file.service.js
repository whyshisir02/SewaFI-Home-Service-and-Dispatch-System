const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const logger = require('../config/logger');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (env.FILE.ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.FILE.MAX_SIZE },
});

const fileService = {
  uploadToCloudinary: async (file, folder = 'sewafi') => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `sewafi/${folder}`,
          resource_type: 'auto',
          transformation: [{ width: 800, height: 800, crop: 'limit' }],
        },
        (error, result) => {
          if (error) {
            logger.error(`Upload failed: ${error.message}`);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(file.buffer);
    });
  },

  uploadProfileImage: async (file, userId) => {
    const result = await fileService.uploadToCloudinary(file, `profiles/${userId}`);
    return { url: result.secure_url, publicId: result.public_id };
  },

  uploadServiceImage: async (file, serviceId) => {
    const result = await fileService.uploadToCloudinary(file, `services/${serviceId}`);
    return { url: result.secure_url, publicId: result.public_id };
  },

  uploadCategoryImage: async (file, categoryId) => {
    const result = await fileService.uploadToCloudinary(file, `categories/${categoryId}`);
    return { url: result.secure_url, publicId: result.public_id };
  },

  deleteFromCloudinary: async (publicId) => {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      logger.error(`Delete failed: ${error.message}`);
      return false;
    }
  },
};

module.exports = { upload, fileService };

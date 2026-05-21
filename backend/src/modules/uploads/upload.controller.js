const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { fileService } = require('../../services/file.service');

const uploadServiceImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Image file is required');
  }

  const uploaded = await fileService.uploadServiceImage(req.file, 'admin-upload');
  res.status(201).json(
    new ApiResponse(201, {
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
    }, 'Image uploaded successfully')
  );
});

const uploadCategoryImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Image file is required');
  }

  const uploaded = await fileService.uploadCategoryImage(req.file, 'admin-upload');
  res.status(201).json(
    new ApiResponse(201, {
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
    }, 'Image uploaded successfully')
  );
});

module.exports = {
  uploadServiceImage,
  uploadCategoryImage,
};

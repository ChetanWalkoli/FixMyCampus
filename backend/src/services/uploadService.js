import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

/**
 * Upload an image buffer to Cloudinary and return { url, publicId }.
 */
export const uploadImageBuffer = (
  buffer,
  folder = "fixmycampus/complaints"
) => {
  if (!isCloudinaryConfigured()) {
    const err = new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env"
    );
    err.statusCode = 503;
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          const uploadError = new Error("Failed to upload image to Cloudinary");
          uploadError.statusCode = 502;
          return reject(uploadError);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

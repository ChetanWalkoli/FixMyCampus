import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

export const isCloudinaryConfigured = () => {
  return Boolean(
    env.cloudinaryCloudName &&
      env.cloudinaryApiKey &&
      env.cloudinaryApiSecret &&
      !env.cloudinaryCloudName.startsWith("your_")
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
}

export default cloudinary;

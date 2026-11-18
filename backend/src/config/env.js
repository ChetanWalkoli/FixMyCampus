import dotenv from "dotenv";

dotenv.config();

const normalizeOrigin = (url) => url.trim().replace(/\/+$/, "");

const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = rawFrontendUrl
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: (process.env.NODE_ENV || "development").toLowerCase(),
  isRender: process.env.RENDER === "true",
  mongodbUri: process.env.MONGODB_URI || "",
  frontendUrl: allowedOrigins[0] || "http://localhost:5173",
  allowedOrigins,
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  cookieName: "fmc_token",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  smtpFrom: process.env.SMTP_FROM || "",
  emailDevMode: process.env.EMAIL_DEV_MODE || "",
  invitationExpiresHours: Number(process.env.INVITATION_EXPIRES_HOURS) || 24,
  passwordResetExpiresMinutes:
    Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES) || 30,
};

export default env;

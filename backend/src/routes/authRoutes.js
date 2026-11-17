import { Router } from "express";
import rateLimit from "express-rate-limit";
import env from "../config/env.js";
import {
  activateAccount,
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => env.nodeEnv === "test",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/activate-account", authLimiter, activateAccount);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
router.patch("/change-password", authenticate, changePassword);

export default router;

import { Router } from "express";
import env from "../config/env.js";

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Verify FixMyCampus API availability without exposing sensitive info
 * @access  Public
 */
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "FixMyCampus API is running",
    environment: env.nodeEnv,
  });
});

export default router;

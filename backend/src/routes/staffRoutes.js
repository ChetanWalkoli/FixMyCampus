import { Router } from "express";
import {
  getAssignedComplaints,
  getStaffComplaintById,
  getStaffHistory,
  updateTaskStatus,
  uploadResolutionProof,
} from "../controllers/staffController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadSingleImage } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("staff"));

router.get("/complaints", getAssignedComplaints);
router.get("/complaints/:id", getStaffComplaintById);
router.patch("/complaints/:id/status", updateTaskStatus);
router.post("/complaints/:id/proof", uploadSingleImage, uploadResolutionProof);
router.get("/history", getStaffHistory);

export default router;

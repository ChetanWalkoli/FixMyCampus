import { Router } from "express";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
} from "../controllers/complaintController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadSingleImage } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("student"));

router.post("/", uploadSingleImage, createComplaint);
router.get("/my", getMyComplaints);
router.get("/:id", getComplaintById);

export default router;

import { Router } from "express";
import {
  assignStaff,
  createStaff,
  getAdminComplaintById,
  getAllComplaints,
  getAnalytics,
  getStaffList,
  reviewComplaint,
  updateComplaintPriority,
  updateStaff,
} from "../controllers/adminController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/analytics", getAnalytics);
router.get("/complaints", getAllComplaints);
router.get("/complaints/:id", getAdminComplaintById);
router.patch("/complaints/:id/review", reviewComplaint);
router.patch("/complaints/:id/assign", assignStaff);
router.patch("/complaints/:id/priority", updateComplaintPriority);

router.get("/staff", getStaffList);
router.post("/staff", createStaff);
router.patch("/staff/:id", updateStaff);

export default router;

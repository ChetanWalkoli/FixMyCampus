import { Router } from "express";
import {
  assignStaff,
  createStaff,
  getAdminComplaintById,
  getAllComplaints,
  getAllUsers,
  getAnalytics,
  getInvitations,
  getStaffList,
  inviteUser,
  resendInvitation,
  reviewComplaint,
  revokeInvitation,
  updateComplaintPriority,
  updateStaff,
  updateUser,
  updateUserStatus,
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

router.get("/users", getAllUsers);
router.post("/users/invite", inviteUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);

router.get("/invitations", getInvitations);
router.post("/invitations/:id/resend", resendInvitation);
router.delete("/invitations/:id", revokeInvitation);

export default router;

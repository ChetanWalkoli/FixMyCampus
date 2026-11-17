import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import adminUserRoutes from "./adminUserRoutes.js";
import adminRoutes from "./adminRoutes.js";
import complaintRoutes from "./complaintRoutes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin", adminRoutes);
router.use("/complaints", complaintRoutes);

export default router;

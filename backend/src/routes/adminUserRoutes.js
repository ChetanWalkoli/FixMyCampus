import { Router } from "express";
import { provisionUser } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.post("/", provisionUser);

export default router;

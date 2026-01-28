import { Router } from "express";
import { adminPing } from "../controllers/adminController";
import { authenticate } from "../middleware/authenticate";
import { allowRoles } from "../middleware/roles";

const router = Router();

router.get("/ping", authenticate, allowRoles("ADMIN"), adminPing);

export default router;

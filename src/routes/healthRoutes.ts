import { Router } from "express";
import { testConnections } from "../controllers/healthController";

const router = Router();

router.get("/test", testConnections);

export default router;

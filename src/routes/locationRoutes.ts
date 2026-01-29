import { Router } from "express";
import { listLocations } from "../controllers/runnerController";

const router = Router();

router.get("/", listLocations);

export default router;

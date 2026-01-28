import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate";
import { uploadProfileAvatar } from "../controllers/profileController";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/avatar", authenticate, upload.single("avatar"), uploadProfileAvatar);

export default router;

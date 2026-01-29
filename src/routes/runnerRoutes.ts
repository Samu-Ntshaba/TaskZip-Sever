import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { allowRoles } from "../middleware/roles";
import { validateRequest } from "../middleware/validateRequest";
import {
  acceptRunnerRequest,
  completeRunnerRequest,
  createAvailabilitySlot,
  createRunnerProfile,
  deleteAvailabilitySlot,
  getRunnerProfile,
  getRunnerStats,
  listAvailabilitySlots,
  listRunnerRequests,
  listRunnerReviews,
  readyRunnerRequest,
  rejectRunnerRequest,
  startRunnerRequest,
  updateAvailabilitySlot,
  updateRunnerProfile,
  updateRunnerRequest,
} from "../controllers/runnerController";
import {
  availabilitySlotIdSchema,
  availabilitySlotSchema,
  runnerRequestIdSchema,
  runnerRequestUpdateSchema,
  runnerRequestsQuerySchema,
  updateAvailabilitySlotSchema,
  createRunnerProfileSchema,
  updateRunnerProfileSchema,
} from "../validation/runnerSchemas";

const router = Router();

router.use(authenticate, allowRoles("RUNNER"));

router.post("/profile", validateRequest(createRunnerProfileSchema), createRunnerProfile);
router.get("/profile", getRunnerProfile);
router.patch("/profile", validateRequest(updateRunnerProfileSchema), updateRunnerProfile);

router.post(
  "/availability",
  validateRequest(availabilitySlotSchema),
  createAvailabilitySlot
);
router.get("/availability", listAvailabilitySlots);
router.patch(
  "/availability/:id",
  validateRequest(updateAvailabilitySlotSchema),
  updateAvailabilitySlot
);
router.delete(
  "/availability/:id",
  validateRequest(availabilitySlotIdSchema),
  deleteAvailabilitySlot
);

router.get(
  "/requests",
  validateRequest(runnerRequestsQuerySchema),
  listRunnerRequests
);
router.post(
  "/requests/:id/accept",
  validateRequest(runnerRequestIdSchema),
  acceptRunnerRequest
);
router.post(
  "/requests/:id/reject",
  validateRequest(runnerRequestIdSchema),
  rejectRunnerRequest
);
router.post(
  "/requests/:id/start",
  validateRequest(runnerRequestIdSchema),
  startRunnerRequest
);
router.post(
  "/requests/:id/ready",
  validateRequest(runnerRequestIdSchema),
  readyRunnerRequest
);
router.post(
  "/requests/:id/complete",
  validateRequest(runnerRequestIdSchema),
  completeRunnerRequest
);
router.post(
  "/requests/:id/update",
  validateRequest(runnerRequestUpdateSchema),
  updateRunnerRequest
);

router.get("/reviews", listRunnerReviews);
router.get("/stats", getRunnerStats);

export default router;

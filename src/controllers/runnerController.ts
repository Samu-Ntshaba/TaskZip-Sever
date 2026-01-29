import { Request, Response } from "express";
import { QueueRequestStatus, QueueUpdateType } from "@prisma/client";
import { prisma } from "../db";
import { asyncHandler } from "../middleware/asyncHandler";
import { HttpError } from "../utils/errors";

const ACTIVE_REQUEST_STATUSES: QueueRequestStatus[] = [
  "ACCEPTED",
  "IN_QUEUE",
  "UPDATING",
  "READY",
];

// ✅ single source of truth for auth inside controllers
const requireUserId = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new HttpError("Unauthorized", 401);
  return userId;
};

const getRunnerProfileByUserId = async (userId: string) => {
  const runnerProfile = await prisma.runnerProfile.findUnique({
    where: { userId },
  });

  if (!runnerProfile) {
    throw new HttpError("Runner profile not found", 404);
  }

  return runnerProfile;
};

const buildRunnerProfileResponse = async (userId: string) => {
  const runnerProfile = await prisma.runnerProfile.findUnique({
    where: { userId },
  });

  if (!runnerProfile) {
    throw new HttpError("Runner profile not found", 404);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  return {
    ...runnerProfile,
    phone: profile?.phone ?? null,
    isListable: Boolean(runnerProfile.photoPath),
  };
};

const resolveUpdateType = (payload: {
  updateType?: QueueUpdateType;
  myNumber?: number;
  currentlyServing?: number;
  etaMinutes?: number;
  note?: string;
}) => {
  if (payload.updateType) return payload.updateType;
  if (payload.note) return "NOTE";
  if (payload.etaMinutes !== undefined) return "ETA";
  if (payload.currentlyServing !== undefined) return "CURRENTLY_SERVING";
  if (payload.myNumber !== undefined) return "MY_NUMBER";
  return "NOTE";
};

const isStartBeforeEnd = (start: string, end: string) => start < end;

const ensureAvailabilitySlotOverlap = async (payload: {
  runnerId: string;
  locationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeId?: string;
}) => {
  const overlap = await prisma.runnerAvailabilitySlot.findFirst({
    where: {
      runnerId: payload.runnerId,
      locationId: payload.locationId,
      dayOfWeek: payload.dayOfWeek,
      id: payload.excludeId ? { not: payload.excludeId } : undefined,
      AND: [
        { startTime: { lt: payload.endTime } },
        { endTime: { gt: payload.startTime } },
      ],
    },
  });

  if (overlap) {
    throw new HttpError("Availability slot overlaps with an existing slot", 409);
  }
};

export const createRunnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { photoPath, bio, status, phone } = (req.validated as {
    body: {
      photoPath: string;
      bio?: string;
      status?: "AVAILABLE" | "OFFLINE";
      phone?: string;
    };
  }).body;

  const existing = await prisma.runnerProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new HttpError("Runner profile already exists", 409);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new HttpError("Profile not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.runnerProfile.create({
      data: {
        userId,
        photoPath,
        bio: bio ?? null,
        status: status ?? "AVAILABLE",
      },
    });

    if (phone !== undefined) {
      await tx.profile.update({
        where: { id: profile.id },
        data: { phone },
      });
    }
  });

  const runnerProfile = await buildRunnerProfileResponse(userId);
  res.status(201).json({ runnerProfile });
});

export const getRunnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const runnerProfile = await buildRunnerProfileResponse(userId);
  res.json({ runnerProfile });
});

export const updateRunnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { photoPath, bio, status, phone } = (req.validated as {
    body: {
      photoPath?: string;
      bio?: string;
      status?: "AVAILABLE" | "OFFLINE";
      phone?: string;
    };
  }).body;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  if (status && runnerProfile.status === "BUSY") {
    throw new HttpError("Cannot change status while busy", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.runnerProfile.update({
      where: { id: runnerProfile.id },
      data: {
        photoPath: photoPath ?? undefined,
        bio: bio ?? undefined,
        status: status ?? undefined,
      },
    });

    if (phone !== undefined) {
      await tx.profile.update({
        where: { userId },
        data: { phone },
      });
    }
  });

  const updatedRunnerProfile = await buildRunnerProfileResponse(userId);
  res.json({ runnerProfile: updatedRunnerProfile });
});

export const listLocations = asyncHandler(async (_req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  res.json({ locations });
});

export const createAvailabilitySlot = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { locationId, dayOfWeek, startTime, endTime } = (req.validated as {
    body: {
      locationId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };
  }).body;

  if (!isStartBeforeEnd(startTime, endTime)) {
    throw new HttpError("startTime must be before endTime", 400);
  }

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const location = await prisma.location.findUnique({
    where: { id: locationId },
  });

  if (!location) throw new HttpError("Location not found", 404);

  await ensureAvailabilitySlotOverlap({
    runnerId: runnerProfile.id,
    locationId,
    dayOfWeek,
    startTime,
    endTime,
  });

  const slot = await prisma.runnerAvailabilitySlot.create({
    data: {
      runnerId: runnerProfile.id,
      locationId,
      dayOfWeek,
      startTime,
      endTime,
    },
    include: { location: true },
  });

  res.status(201).json({ slot });
});

export const listAvailabilitySlots = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const slots = await prisma.runnerAvailabilitySlot.findMany({
    where: { runnerId: runnerProfile.id },
    include: { location: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  res.json({ slots });
});

export const updateAvailabilitySlot = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;
  const { locationId, dayOfWeek, startTime, endTime } = (req.validated as {
    body: {
      locationId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
    };
  }).body;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const existingSlot = await prisma.runnerAvailabilitySlot.findUnique({
    where: { id },
  });

  if (!existingSlot || existingSlot.runnerId !== runnerProfile.id) {
    throw new HttpError("Availability slot not found", 404);
  }

  const nextLocationId = locationId ?? existingSlot.locationId;
  const nextDayOfWeek = dayOfWeek ?? existingSlot.dayOfWeek;
  const nextStart = startTime ?? existingSlot.startTime;
  const nextEnd = endTime ?? existingSlot.endTime;

  if (locationId) {
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new HttpError("Location not found", 404);
  }

  if (!isStartBeforeEnd(nextStart, nextEnd)) {
    throw new HttpError("startTime must be before endTime", 400);
  }

  await ensureAvailabilitySlotOverlap({
    runnerId: runnerProfile.id,
    locationId: nextLocationId,
    dayOfWeek: nextDayOfWeek,
    startTime: nextStart,
    endTime: nextEnd,
    excludeId: existingSlot.id,
  });

  const updatedSlot = await prisma.runnerAvailabilitySlot.update({
    where: { id: existingSlot.id },
    data: {
      locationId: nextLocationId,
      dayOfWeek: nextDayOfWeek,
      startTime: nextStart,
      endTime: nextEnd,
    },
    include: { location: true },
  });

  res.json({ slot: updatedSlot });
});

export const deleteAvailabilitySlot = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const existingSlot = await prisma.runnerAvailabilitySlot.findUnique({
    where: { id },
  });

  if (!existingSlot || existingSlot.runnerId !== runnerProfile.id) {
    throw new HttpError("Availability slot not found", 404);
  }

  await prisma.runnerAvailabilitySlot.delete({ where: { id } });
  res.json({ message: "Availability slot deleted" });
});

export const listRunnerRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { status } = (req.validated as { query: { status?: QueueRequestStatus } }).query;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  // ✅ important: keep this typed as QueueRequestStatus[]
  const statuses: QueueRequestStatus[] = status
    ? [status]
    : (["CREATED", ...ACTIVE_REQUEST_STATUSES] as QueueRequestStatus[]);

  const requests = await prisma.queueRequest.findMany({
    where: {
      runnerId: runnerProfile.id,
      status: { in: statuses },
    },
    include: {
      location: true,
      updates: { orderBy: { createdAt: "desc" } },
      customer: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ requests });
});

export const acceptRunnerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  if (runnerProfile.status === "OFFLINE") {
    throw new HttpError("Runner is offline", 400);
  }

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.queueRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError("Queue request not found", 404);

    if (request.runnerId !== runnerProfile.id) throw new HttpError("Forbidden", 403);
    if (request.status !== "CREATED") {
      throw new HttpError("Request is not available for acceptance", 400);
    }

    const activeRequest = await tx.queueRequest.findFirst({
      where: { runnerId: runnerProfile.id, status: { in: ACTIVE_REQUEST_STATUSES } },
    });

    if (activeRequest) throw new HttpError("Runner already has an active job", 400);

    const acceptedRequest = await tx.queueRequest.update({
      where: { id: request.id },
      data: { status: "ACCEPTED" },
    });

    await tx.runnerProfile.update({
      where: { id: runnerProfile.id },
      data: { status: "BUSY" },
    });

    return acceptedRequest;
  });

  res.json({ request: updatedRequest });
});

export const rejectRunnerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.queueRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError("Queue request not found", 404);

    if (request.runnerId !== runnerProfile.id) throw new HttpError("Forbidden", 403);
    if (request.status !== "CREATED") {
      throw new HttpError("Only created requests can be rejected", 400);
    }

    return tx.queueRequest.update({
      where: { id: request.id },
      data: { status: "CANCELLED" },
    });
  });

  res.json({ request: updatedRequest });
});

export const startRunnerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.queueRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError("Queue request not found", 404);

    if (request.runnerId !== runnerProfile.id) throw new HttpError("Forbidden", 403);
    if (request.status !== "ACCEPTED") {
      throw new HttpError("Only accepted requests can be started", 400);
    }

    const updated = await tx.queueRequest.update({
      where: { id: request.id },
      data: { status: "IN_QUEUE" },
    });

    await tx.queueUpdate.create({
      data: {
        requestId: request.id,
        updateType: "JOINED_QUEUE",
        note: "Runner joined the queue",
      },
    });

    return updated;
  });

  res.json({ request: updatedRequest });
});

export const readyRunnerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.queueRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError("Queue request not found", 404);

    if (request.runnerId !== runnerProfile.id) throw new HttpError("Forbidden", 403);

    if (!["IN_QUEUE", "UPDATING"].includes(request.status)) {
      throw new HttpError("Only in-queue requests can be marked ready", 400);
    }

    const updated = await tx.queueRequest.update({
      where: { id: request.id },
      data: { status: "READY" },
    });

    await tx.queueUpdate.create({
      data: {
        requestId: request.id,
        updateType: "STATUS_CHANGE",
        note: "Runner marked the job as ready",
      },
    });

    return updated;
  });

  res.json({ request: updatedRequest });
});

export const completeRunnerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.queueRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError("Queue request not found", 404);

    if (request.runnerId !== runnerProfile.id) throw new HttpError("Forbidden", 403);
    if (request.status !== "READY") {
      throw new HttpError("Only ready requests can be completed", 400);
    }

    const updated = await tx.queueRequest.update({
      where: { id: request.id },
      data: { status: "COMPLETED" },
    });

    await tx.queueUpdate.create({
      data: {
        requestId: request.id,
        updateType: "STATUS_CHANGE",
        note: "Runner completed the job",
      },
    });

    await tx.runnerProfile.update({
      where: { id: runnerProfile.id },
      data: {
        totalJobsCompleted: { increment: 1 },
        status: "AVAILABLE",
      },
    });

    return updated;
  });

  res.json({ request: updatedRequest });
});

export const updateRunnerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const { id } = (req.validated as { params: { id: string } }).params;
  const { myNumber, currentlyServing, etaMinutes, note, updateType } = (req.validated as {
    body: {
      myNumber?: number;
      currentlyServing?: number;
      etaMinutes?: number;
      note?: string;
      updateType?: QueueUpdateType;
    };
  }).body;

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.queueRequest.findUnique({ where: { id } });
    if (!request) throw new HttpError("Queue request not found", 404);

    if (request.runnerId !== runnerProfile.id) throw new HttpError("Forbidden", 403);
    if (["COMPLETED", "CANCELLED"].includes(request.status)) {
      throw new HttpError("Cannot update a completed or cancelled job", 400);
    }

    const derivedUpdateType = resolveUpdateType({
      updateType,
      myNumber,
      currentlyServing,
      etaMinutes,
      note,
    });

    await tx.queueUpdate.create({
      data: {
        requestId: request.id,
        updateType: derivedUpdateType,
        myNumber,
        currentlyServing,
        etaMinutes,
        note,
      },
    });

    const shouldSetUpdating =
      request.status === "ACCEPTED" || request.status === "IN_QUEUE";

    return tx.queueRequest.update({
      where: { id: request.id },
      data: { status: shouldSetUpdating ? "UPDATING" : request.status },
    });
  });

  res.json({ request: updatedRequest });
});

export const listRunnerReviews = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const runnerProfile = await getRunnerProfileByUserId(userId);

  const reviews = await prisma.review.findMany({
    where: { request: { runnerId: runnerProfile.id } },
    include: {
      request: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ reviews });
});

export const getRunnerStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const runnerProfile = await getRunnerProfileByUserId(userId);

  res.json({
    stats: {
      totalJobsCompleted: runnerProfile.totalJobsCompleted,
      avgRating: runnerProfile.avgRating,
      reviewCount: runnerProfile.reviewCount,
      status: runnerProfile.status,
    },
  });
});

import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createRunnerProfileSchema = z.object({
  body: z.object({
    photoPath: z.string().min(1),
    bio: z.string().min(1).optional(),
    status: z.enum(["AVAILABLE", "OFFLINE"]).optional(),
    phone: z.string().min(6).optional(),
  }),
});

export const updateRunnerProfileSchema = z.object({
  body: z.object({
    photoPath: z.string().min(1).optional(),
    bio: z.string().min(1).optional(),
    status: z.enum(["AVAILABLE", "OFFLINE"]).optional(),
    phone: z.string().min(6).optional(),
  }),
});

export const availabilitySlotSchema = z.object({
  body: z.object({
    locationId: z.string().uuid().optional(),
    locationName: z.string().min(1).optional(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, "Invalid start time format"),
    endTime: z.string().regex(timeRegex, "Invalid end time format"),
  })
  .refine(
    (data) =>
      (data.locationId && !data.locationName) ||
      (!data.locationId && data.locationName),
    {
      message: "Provide either locationId or locationName",
      path: ["locationId"],
    }
  ),
});

export const updateAvailabilitySlotSchema = z.object({
  body: z.object({
    locationId: z.string().uuid().optional(),
    locationName: z.string().min(1).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(timeRegex, "Invalid start time format").optional(),
    endTime: z.string().regex(timeRegex, "Invalid end time format").optional(),
  })
  .refine(
    (data) =>
      !(data.locationId && data.locationName),
    {
      message: "Provide either locationId or locationName, not both",
      path: ["locationId"],
    }
  ),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const availabilitySlotIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const runnerRequestIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const runnerRequestsQuerySchema = z.object({
  query: z.object({
    status: z
      .enum([
        "CREATED",
        "ACCEPTED",
        "IN_QUEUE",
        "UPDATING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ])
      .optional(),
  }),
});

export const runnerRequestUpdateSchema = z
  .object({
    body: z.object({
      myNumber: z.number().int().positive().optional(),
      currentlyServing: z.number().int().positive().optional(),
      etaMinutes: z.number().int().positive().optional(),
      note: z.string().min(1).optional(),
      updateType: z
        .enum([
          "JOINED_QUEUE",
          "MY_NUMBER",
          "CURRENTLY_SERVING",
          "ETA",
          "NOTE",
          "STATUS_CHANGE",
        ])
        .optional(),
    }),
    params: z.object({
      id: z.string().uuid(),
    }),
  })
  .refine(
    (data) => {
      const { myNumber, currentlyServing, etaMinutes, note, updateType } = data.body;
      return (
        myNumber !== undefined ||
        currentlyServing !== undefined ||
        etaMinutes !== undefined ||
        note !== undefined ||
        updateType !== undefined
      );
    },
    { message: "Provide at least one update field", path: ["body"] }
  );

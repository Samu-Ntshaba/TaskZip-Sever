import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    phone: z.string().min(6).optional(),

    // ✅ ADD THIS
    role: z.enum(["USER", "RUNNER"]).optional(),
  }),
});


export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
  }),
});

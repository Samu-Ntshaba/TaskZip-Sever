import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { prisma } from "../db";
import { createSupabaseClient } from "../services/supabaseService";
import { env } from "../env";

export const testConnections = asyncHandler(
  async (_req: Request, res: Response) => {
    const database = {
      ok: false,
      latencyMs: null as number | null,
    };

    const supabase = {
      ok: false,
      error: null as string | null,
    };

    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      database.ok = true;
      database.latencyMs = Date.now() - dbStart;
    } catch (error) {
      database.latencyMs = Date.now() - dbStart;
    }

    try {
      const client = createSupabaseClient();
      const { error } = await client.storage.from(env.SUPABASE_BUCKET).list("", {
        limit: 1,
      });
      if (error) {
        supabase.error = error.message;
      } else {
        supabase.ok = true;
      }
    } catch (error) {
      supabase.error = error instanceof Error ? error.message : "Unknown error";
    }

    res.json({
      status: "ok",
      database,
      supabase,
      timestamp: new Date().toISOString(),
    });
  }
);

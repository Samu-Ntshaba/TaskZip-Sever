import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaMiddlewareRegistered?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (!globalForPrisma.prismaMiddlewareRegistered) {
  prisma.$use(async (params, next) => {
    const result = await next(params);

    if (params.model === "Review" && params.action === "create") {
      const review = result as { requestId?: string };
      if (review.requestId) {
        const request = await prisma.queueRequest.findUnique({
          where: { id: review.requestId },
          select: { runnerId: true },
        });

        if (request?.runnerId) {
          const aggregate = await prisma.review.aggregate({
            where: { request: { runnerId: request.runnerId } },
            _avg: { rating: true },
            _count: { _all: true },
          });

          await prisma.runnerProfile.update({
            where: { id: request.runnerId },
            data: {
              avgRating: aggregate._avg.rating ?? 0,
              reviewCount: aggregate._count._all,
            },
          });
        }
      }
    }

    return result;
  });
  globalForPrisma.prismaMiddlewareRegistered = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

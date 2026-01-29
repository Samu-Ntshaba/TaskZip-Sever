import { Prisma, PrismaClient } from "@prisma/client";

const updateRunnerRatings = async (client: PrismaClient, requestId: string) => {
  const request = await client.queueRequest.findUnique({
    where: { id: requestId },
    select: { runnerId: true },
  });

  if (!request?.runnerId) {
    return;
  }

  const aggregate = await client.review.aggregate({
    where: { request: { runnerId: request.runnerId } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await client.runnerProfile.update({
    where: { id: request.runnerId },
    data: {
      avgRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count._all,
    },
  });
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ["error", "warn"],
  });

  return client.$extends({
    query: {
      review: {
        async create({
          args,
          query,
        }: {
          args: Prisma.ReviewCreateArgs;
          query: (args: Prisma.ReviewCreateArgs) => Promise<Prisma.ReviewGetPayload<Prisma.ReviewDefaultArgs>>;
        }) {
          const result = await query(args);
          await updateRunnerRatings(client, result.requestId);
          return result;
        },
      },
    },
  });
};

type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientExtended;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

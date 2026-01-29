-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add RUNNER role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RUNNER';

-- Create enums
CREATE TYPE "RunnerStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
CREATE TYPE "QueueRequestStatus" AS ENUM ('CREATED', 'ACCEPTED', 'IN_QUEUE', 'UPDATING', 'READY', 'COMPLETED', 'CANCELLED');
CREATE TYPE "QueueUpdateType" AS ENUM ('JOINED_QUEUE', 'MY_NUMBER', 'CURRENTLY_SERVING', 'ETA', 'NOTE', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "RunnerProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "photoPath" TEXT NOT NULL,
    "bio" TEXT,
    "status" "RunnerStatus" NOT NULL DEFAULT 'OFFLINE',
    "totalJobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunnerAvailabilitySlot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "runnerId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunnerAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "runnerId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "timeWindowStart" TEXT,
    "timeWindowEnd" TEXT,
    "instructions" TEXT,
    "priceCents" INTEGER,
    "status" "QueueRequestStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueUpdate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" UUID NOT NULL,
    "updateType" "QueueUpdateType" NOT NULL,
    "myNumber" INTEGER,
    "currentlyServing" INTEGER,
    "etaMinutes" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RunnerProfile_userId_key" ON "RunnerProfile"("userId");

-- CreateIndex
CREATE INDEX "RunnerProfile_userId_idx" ON "RunnerProfile"("userId");

-- CreateIndex
CREATE INDEX "RunnerProfile_status_idx" ON "RunnerProfile"("status");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "RunnerAvailabilitySlot_runnerId_dayOfWeek_locationId_idx" ON "RunnerAvailabilitySlot"("runnerId", "dayOfWeek", "locationId");

-- CreateIndex
CREATE INDEX "QueueRequest_runnerId_status_idx" ON "QueueRequest"("runnerId", "status");

-- CreateIndex
CREATE INDEX "QueueRequest_customerId_idx" ON "QueueRequest"("customerId");

-- CreateIndex
CREATE INDEX "QueueUpdate_requestId_idx" ON "QueueUpdate"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_requestId_key" ON "Review"("requestId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- AddForeignKey
ALTER TABLE "RunnerProfile" ADD CONSTRAINT "RunnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunnerAvailabilitySlot" ADD CONSTRAINT "RunnerAvailabilitySlot_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "RunnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunnerAvailabilitySlot" ADD CONSTRAINT "RunnerAvailabilitySlot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueRequest" ADD CONSTRAINT "QueueRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueRequest" ADD CONSTRAINT "QueueRequest_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "RunnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueRequest" ADD CONSTRAINT "QueueRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueUpdate" ADD CONSTRAINT "QueueUpdate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QueueRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QueueRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed locations
INSERT INTO "Location" ("id", "name", "address", "latitude", "longitude", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Downtown Service Center', '123 Main St, City Center', -26.2041, 28.0473, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Uptown Hub', '456 North Ave, Uptown', -26.1705, 28.0341, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Riverside Plaza', '789 River Rd, Riverside', -26.1250, 28.0570, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add missing columns to User table
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "planGenerations" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "projectsCreated" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "maxProjects" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "maxGenerations" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "buildingHeightLimit" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "subscriptionExpiry" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);

-- Update existing users to have reasonable defaults
UPDATE "public"."User" SET 
    "planGenerations" = 0,
    "projectsCreated" = 0,
    "maxProjects" = 5,
    "maxGenerations" = 5,
    "buildingHeightLimit" = 3,
    "emailVerified" = false
WHERE "planGenerations" IS NULL OR "projectsCreated" IS NULL;

-- Create missing tables
CREATE TABLE IF NOT EXISTS "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "floorPlanData" JSONB NOT NULL,
    "analysisData" JSONB,
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."ProjectVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "floorPlanData" JSONB NOT NULL,
    "analysisData" JSONB,
    "changeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."UsageHistory" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UsageHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "public"."Project"("userId");
CREATE INDEX IF NOT EXISTS "UsageHistory_userId_idx" ON "public"."UsageHistory"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectVersion_projectId_version_key" ON "public"."ProjectVersion"("projectId", "version");

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_userId_fkey') THEN
        ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectVersion_projectId_fkey') THEN
        ALTER TABLE "public"."ProjectVersion" ADD CONSTRAINT "ProjectVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsageHistory_userId_fkey') THEN
        ALTER TABLE "public"."UsageHistory" ADD CONSTRAINT "UsageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

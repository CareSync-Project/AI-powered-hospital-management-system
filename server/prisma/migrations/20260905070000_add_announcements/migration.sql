-- Add the notification type used when an announcement is delivered to users.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ANNOUNCEMENT';

-- Create the persisted broadcast audience used by administrators.
DO $$ BEGIN
  CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'PATIENTS', 'DOCTORS', 'NURSES', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" UUID NOT NULL,
  "hospitalId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "audience" "AnnouncementAudience" NOT NULL,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Announcement_hospitalId_createdAt_idx"
  ON "Announcement"("hospitalId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Announcement"
    ADD CONSTRAINT "Announcement_hospitalId_fkey"
    FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Announcement"
    ADD CONSTRAINT "Announcement_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

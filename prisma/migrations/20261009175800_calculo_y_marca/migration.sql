-- AlterTable
ALTER TABLE "study" ADD COLUMN "calculation" TEXT;
ALTER TABLE "study" ADD COLUMN "proposedOffer" TEXT;
ALTER TABLE "study" ADD COLUMN "selectedOfferId" TEXT;
ALTER TABLE "study" ADD COLUMN "yearSavingsCents" INTEGER;

-- CreateTable
CREATE TABLE "advisor_brand" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoFileId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "advisor_brand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "advisor_brand_logoFileId_fkey" FOREIGN KEY ("logoFileId") REFERENCES "stored_file" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

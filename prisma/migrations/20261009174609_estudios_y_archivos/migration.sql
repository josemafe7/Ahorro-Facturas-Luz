-- CreateTable
CREATE TABLE "stored_file" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stored_file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customerName" TEXT,
    "fileId" TEXT,
    "readingStatus" TEXT,
    "draft" TEXT NOT NULL DEFAULT '{}',
    "doubts" TEXT NOT NULL DEFAULT '{}',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "study_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "study_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_file" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_reading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_reading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_file_storageKey_key" ON "stored_file"("storageKey");

-- CreateIndex
CREATE INDEX "stored_file_userId_idx" ON "stored_file"("userId");

-- CreateIndex
CREATE INDEX "study_userId_sector_createdAt_idx" ON "study"("userId", "sector", "createdAt");

-- CreateIndex
CREATE INDEX "ai_reading_userId_createdAt_idx" ON "ai_reading"("userId", "createdAt");

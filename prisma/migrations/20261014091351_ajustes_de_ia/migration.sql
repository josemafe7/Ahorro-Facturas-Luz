-- CreateTable
CREATE TABLE "ai_settings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "encryptedApiKey" TEXT,
    "model" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

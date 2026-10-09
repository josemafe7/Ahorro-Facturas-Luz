-- CreateTable
CREATE TABLE "sector_settings" (
    "userId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "sector"),
    CONSTRAINT "sector_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

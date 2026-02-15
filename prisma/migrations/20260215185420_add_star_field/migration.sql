-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contestant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "star" BOOLEAN NOT NULL DEFAULT false,
    "draftedByPlayerId" TEXT,
    "draftedPrice" INTEGER,
    "draftOrder" INTEGER,
    CONSTRAINT "Contestant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contestant_draftedByPlayerId_fkey" FOREIGN KEY ("draftedByPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contestant" ("bio", "draftOrder", "draftedByPlayerId", "draftedPrice", "id", "imageUrl", "name", "roomId", "status") SELECT "bio", "draftOrder", "draftedByPlayerId", "draftedPrice", "id", "imageUrl", "name", "roomId", "status" FROM "Contestant";
DROP TABLE "Contestant";
ALTER TABLE "new_Contestant" RENAME TO "Contestant";
CREATE INDEX "Contestant_roomId_idx" ON "Contestant"("roomId");
CREATE INDEX "Contestant_draftedByPlayerId_idx" ON "Contestant"("draftedByPlayerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

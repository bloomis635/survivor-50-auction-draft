-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostAdminKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phase" TEXT NOT NULL DEFAULT 'LOBBY',
    "startingBudget" INTEGER NOT NULL DEFAULT 100,
    "minIncrement" INTEGER NOT NULL DEFAULT 1,
    "timerSeconds" INTEGER NOT NULL DEFAULT 30,
    "currentContestantId" TEXT,
    "auctionStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "currentBid" INTEGER NOT NULL DEFAULT 0,
    "currentBidderPlayerId" TEXT,
    "auctionEndTime" DATETIME
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetRemaining" INTEGER NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contestant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "draftedByPlayerId" TEXT,
    "draftedPrice" INTEGER,
    "draftOrder" INTEGER,
    CONSTRAINT "Contestant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contestant_draftedByPlayerId_fkey" FOREIGN KEY ("draftedByPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Player_roomId_idx" ON "Player"("roomId");

-- CreateIndex
CREATE INDEX "Contestant_roomId_idx" ON "Contestant"("roomId");

-- CreateIndex
CREATE INDEX "Contestant_draftedByPlayerId_idx" ON "Contestant"("draftedByPlayerId");

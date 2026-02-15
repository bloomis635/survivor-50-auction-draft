import { nanoid } from "nanoid";
import { prisma } from "./prisma";
import type { RoomState, Player, Contestant, RoomSettings, CurrentAuction } from "./types";

// In-memory cache of room states for fast access
const roomCache = new Map<string, RoomState>();

// Generate a short room code
export function generateRoomCode(): string {
  return nanoid(6).toUpperCase();
}

// Generate admin key
export function generateAdminKey(): string {
  return nanoid(32);
}

// Load room from database into cache
export async function loadRoom(roomId: string): Promise<RoomState | null> {
  // Check cache first
  if (roomCache.has(roomId)) {
    return roomCache.get(roomId)!;
  }

  // Load from database
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: true,
      contestants: true,
    },
  });

  if (!room) return null;

  // Convert to RoomState format
  const players: Record<string, Player> = {};
  for (const p of room.players) {
    const roster = room.contestants
      .filter((c) => c.draftedByPlayerId === p.id)
      .map((c) => c.id);

    players[p.id] = {
      id: p.id,
      name: p.name,
      budgetRemaining: p.budgetRemaining,
      connected: p.connected,
      roster,
    };
  }

  const contestants: Record<string, Contestant> = {};
  for (const c of room.contestants) {
    contestants[c.id] = {
      id: c.id,
      name: c.name,
      bio: c.bio,
      imageUrl: c.imageUrl || undefined,
      star: c.star || false,
      status: c.status as any,
      draftedByPlayerId: c.draftedByPlayerId || undefined,
      draftedPrice: c.draftedPrice || undefined,
      draftOrder: c.draftOrder || undefined,
    };
  }

  const state: RoomState = {
    id: room.id,
    phase: room.phase as any,
    settings: {
      startingBudget: room.startingBudget,
      minIncrement: room.minIncrement,
      timerSeconds: room.timerSeconds,
    },
    players,
    contestants,
    currentAuction: {
      contestantId: room.currentContestantId || undefined,
      status: room.auctionStatus as any,
      currentBid: room.currentBid,
      currentBidderPlayerId: room.currentBidderPlayerId || undefined,
      endTime: room.auctionEndTime?.getTime(),
    },
    nominatorPlayerId: room.nominatorPlayerId || undefined,
  };

  roomCache.set(roomId, state);
  return state;
}

// Save room state to database
export async function saveRoom(state: RoomState): Promise<void> {
  roomCache.set(state.id, state);

  // Update room
  await prisma.room.update({
    where: { id: state.id },
    data: {
      phase: state.phase,
      startingBudget: state.settings.startingBudget,
      minIncrement: state.settings.minIncrement,
      timerSeconds: state.settings.timerSeconds,
      currentContestantId: state.currentAuction.contestantId || null,
      auctionStatus: state.currentAuction.status,
      currentBid: state.currentAuction.currentBid,
      currentBidderPlayerId: state.currentAuction.currentBidderPlayerId || null,
      auctionEndTime: state.currentAuction.endTime
        ? new Date(state.currentAuction.endTime)
        : null,
      nominatorPlayerId: state.nominatorPlayerId || null,
    },
  });

  // Update players
  for (const player of Object.values(state.players)) {
    await prisma.player.upsert({
      where: { id: player.id },
      create: {
        id: player.id,
        roomId: state.id,
        name: player.name,
        budgetRemaining: player.budgetRemaining,
        connected: player.connected,
      },
      update: {
        name: player.name,
        budgetRemaining: player.budgetRemaining,
        connected: player.connected,
      },
    });
  }

  // Update contestants
  for (const contestant of Object.values(state.contestants)) {
    await prisma.contestant.upsert({
      where: { id: contestant.id },
      create: {
        id: contestant.id,
        roomId: state.id,
        name: contestant.name,
        bio: contestant.bio,
        imageUrl: contestant.imageUrl,
        star: contestant.star || false,
        status: contestant.status,
        draftedByPlayerId: contestant.draftedByPlayerId,
        draftedPrice: contestant.draftedPrice,
        draftOrder: contestant.draftOrder,
      },
      update: {
        name: contestant.name,
        bio: contestant.bio,
        imageUrl: contestant.imageUrl,
        star: contestant.star || false,
        status: contestant.status,
        draftedByPlayerId: contestant.draftedByPlayerId,
        draftedPrice: contestant.draftedPrice,
        draftOrder: contestant.draftOrder,
      },
    });
  }
}

// Create a new room
export async function createRoom(): Promise<{ roomId: string; hostAdminKey: string }> {
  const roomId = generateRoomCode();
  const hostAdminKey = generateAdminKey();

  await prisma.room.create({
    data: {
      id: roomId,
      hostAdminKey,
    },
  });

  // Load Survivor 50 cast from JSON file
  const { readFileSync } = await import("fs");
  const { join } = await import("path");

  let contestants: Record<string, Contestant> = {};

  try {
    const castPath = join(process.cwd(), "survivor50_cast.json");
    const castData = JSON.parse(readFileSync(castPath, "utf-8"));

    // Create contestants from the cast data
    for (const contestantData of castData.contestants) {
      const id = nanoid();
      contestants[id] = {
        id,
        name: contestantData.name,
        bio: contestantData.bio,
        imageUrl: contestantData.imageUrl,
        star: contestantData.star || false,
        status: "AVAILABLE",
      };

      // Also save to database
      await prisma.contestant.create({
        data: {
          id,
          roomId,
          name: contestantData.name,
          bio: contestantData.bio,
          imageUrl: contestantData.imageUrl,
          star: contestantData.star || false,
          status: "AVAILABLE",
        },
      });
    }
  } catch (error) {
    console.error("Failed to load Survivor 50 cast:", error);
    // Continue with empty contestants if file not found
  }

  const state: RoomState = {
    id: roomId,
    phase: "LOBBY",
    settings: {
      startingBudget: 100,
      minIncrement: 1,
      timerSeconds: 30,
    },
    players: {},
    contestants,
    currentAuction: {
      status: "IDLE",
      currentBid: 0,
    },
  };

  roomCache.set(roomId, state);
  return { roomId, hostAdminKey };
}

// Verify admin key
export async function verifyAdminKey(roomId: string, adminKey: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { hostAdminKey: true },
  });

  return room?.hostAdminKey === adminKey;
}

// Add a player to the room
export async function addPlayer(
  roomId: string,
  playerName: string,
  playerId?: string
): Promise<Player> {
  const state = await loadRoom(roomId);
  if (!state) throw new Error("Room not found");

  // If playerId provided and exists, reconnect that player
  if (playerId && state.players[playerId]) {
    state.players[playerId].connected = true;
    state.players[playerId].name = playerName; // Allow name update
    await saveRoom(state);
    return state.players[playerId];
  }

  // Create new player
  const id = nanoid();
  const player: Player = {
    id,
    name: playerName,
    budgetRemaining: state.settings.startingBudget,
    connected: true,
    roster: [],
  };

  state.players[id] = player;
  await saveRoom(state);
  return player;
}

// Update player connection status
export async function updatePlayerConnection(
  roomId: string,
  playerId: string,
  connected: boolean
): Promise<void> {
  const state = await loadRoom(roomId);
  if (!state || !state.players[playerId]) return;

  state.players[playerId].connected = connected;
  await saveRoom(state);
}

// Clear room cache (useful for testing or after updates)
export function clearRoomCache(roomId?: string): void {
  if (roomId) {
    roomCache.delete(roomId);
  } else {
    roomCache.clear();
  }
}

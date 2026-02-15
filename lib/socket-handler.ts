import { Server as SocketIOServer, Socket } from "socket.io";
import { nanoid } from "nanoid";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomState,
  Contestant,
} from "./types";
import {
  loadRoom,
  saveRoom,
  verifyAdminKey,
  addPlayer,
  updatePlayerConnection,
} from "./room-manager";

type IOServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track which room each socket is in
const socketRooms = new Map<string, { roomId: string; playerId: string }>();

// Active auction timers
const auctionTimers = new Map<string, NodeJS.Timeout>();

export function handleSocketConnection(io: IOServer, socket: IOSocket) {
  console.log("Client connected:", socket.id);

  // Join room
  socket.on("room:join", async ({ roomId, playerName, playerId }) => {
    try {
      const state = await loadRoom(roomId);
      if (!state) {
        socket.emit("error", "Room not found");
        return;
      }

      // Add or reconnect player
      const player = await addPlayer(roomId, playerName, playerId);

      // Join socket room
      socket.join(roomId);
      socketRooms.set(socket.id, { roomId, playerId: player.id });

      // Send current state
      const updatedState = await loadRoom(roomId);
      if (updatedState) {
        socket.emit("room:state", updatedState);
        // Notify others about player join/reconnect
        socket.to(roomId).emit("room:state", updatedState);
      }

      console.log(`Player ${player.name} joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", "Failed to join room");
    }
  });

  // Update player name
  socket.on("player:update", async ({ name }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const state = await loadRoom(info.roomId);
      if (!state || !state.players[info.playerId]) return;

      state.players[info.playerId].name = name;
      await saveRoom(state);

      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error updating player:", error);
      socket.emit("error", "Failed to update player");
    }
  });

  // Add contestant (host only)
  socket.on("contestant:add", async ({ adminKey, contestant }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const isAdmin = await verifyAdminKey(info.roomId, adminKey);
      if (!isAdmin) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const state = await loadRoom(info.roomId);
      if (!state) return;

      const id = nanoid();
      state.contestants[id] = {
        id,
        ...contestant,
        status: "AVAILABLE",
      };

      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error adding contestant:", error);
      socket.emit("error", "Failed to add contestant");
    }
  });

  // Edit contestant (host only)
  socket.on("contestant:edit", async ({ adminKey, contestantId, updates }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const isAdmin = await verifyAdminKey(info.roomId, adminKey);
      if (!isAdmin) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const state = await loadRoom(info.roomId);
      if (!state || !state.contestants[contestantId]) return;

      Object.assign(state.contestants[contestantId], updates);
      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error editing contestant:", error);
      socket.emit("error", "Failed to edit contestant");
    }
  });

  // Delete contestant (host only)
  socket.on("contestant:delete", async ({ adminKey, contestantId }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const isAdmin = await verifyAdminKey(info.roomId, adminKey);
      if (!isAdmin) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const state = await loadRoom(info.roomId);
      if (!state) return;

      delete state.contestants[contestantId];
      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error deleting contestant:", error);
      socket.emit("error", "Failed to delete contestant");
    }
  });

  // Update settings (host only)
  socket.on("settings:update", async ({ adminKey, settings }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const isAdmin = await verifyAdminKey(info.roomId, adminKey);
      if (!isAdmin) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const state = await loadRoom(info.roomId);
      if (!state) return;

      // If starting budget changed, update all players' budgets accordingly
      if (settings.startingBudget !== undefined && settings.startingBudget !== state.settings.startingBudget) {
        const oldBudget = state.settings.startingBudget;
        const newBudget = settings.startingBudget;
        for (const player of Object.values(state.players)) {
          const spent = oldBudget - player.budgetRemaining;
          player.budgetRemaining = newBudget - spent;
        }
      }

      Object.assign(state.settings, settings);
      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error updating settings:", error);
      socket.emit("error", "Failed to update settings");
    }
  });

  // Start draft (host only)
  socket.on("draft:start", async ({ adminKey }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const isAdmin = await verifyAdminKey(info.roomId, adminKey);
      if (!isAdmin) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const state = await loadRoom(info.roomId);
      if (!state) return;

      state.phase = "AUCTION";
      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error starting draft:", error);
      socket.emit("error", "Failed to start draft");
    }
  });

  // Nominate contestant (host or current nominator)
  socket.on("auction:nominate", async ({ adminKey, contestantId }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const state = await loadRoom(info.roomId);
      if (!state) return;

      // Allow nomination by host OR the designated nominator
      const isAdmin = adminKey ? await verifyAdminKey(info.roomId, adminKey) : false;
      const isNominator = state.nominatorPlayerId === info.playerId;
      if (!isAdmin && !isNominator) {
        socket.emit("error", "It's not your turn to nominate");
        return;
      }

      if (!state.contestants[contestantId]) return;

      if (state.contestants[contestantId].status !== "AVAILABLE") {
        socket.emit("error", "Contestant is not available");
        return;
      }

      // Set contestant as nominated
      state.contestants[contestantId].status = "NOMINATED";
      state.currentAuction = {
        contestantId,
        status: "IDLE",
        currentBid: 0,
      };

      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error nominating contestant:", error);
      socket.emit("error", "Failed to nominate contestant");
    }
  });

  // Start auction (host only)
  socket.on("auction:start", async ({ adminKey }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const isAdmin = await verifyAdminKey(info.roomId, adminKey);
      if (!isAdmin) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const state = await loadRoom(info.roomId);
      if (!state || !state.currentAuction.contestantId) {
        socket.emit("error", "No contestant nominated");
        return;
      }

      if (state.currentAuction.status === "RUNNING") {
        socket.emit("error", "Auction already running");
        return;
      }

      // Start timer
      const endTime = Date.now() + state.settings.timerSeconds * 1000;
      state.currentAuction.status = "RUNNING";
      state.currentAuction.endTime = endTime;
      state.currentAuction.currentBid = 0;
      state.currentAuction.currentBidderPlayerId = undefined;

      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);

      // Start server timer
      startAuctionTimer(io, info.roomId, state.settings.timerSeconds);
    } catch (error) {
      console.error("Error starting auction:", error);
      socket.emit("error", "Failed to start auction");
    }
  });

  // Place bid
  socket.on("auction:bid", async ({ amount }) => {
    const info = socketRooms.get(socket.id);
    if (!info) return;

    try {
      const state = await loadRoom(info.roomId);
      if (!state) return;

      const player = state.players[info.playerId];
      if (!player) return;

      if (state.currentAuction.status !== "RUNNING") {
        socket.emit("error", "No active auction");
        return;
      }

      // Validate bid
      const minBid = state.currentAuction.currentBid + state.settings.minIncrement;
      if (amount < minBid) {
        socket.emit("error", `Bid must be at least ${minBid}`);
        return;
      }

      if (amount > player.budgetRemaining) {
        socket.emit("error", "Insufficient budget");
        return;
      }

      // Check if auction has ended (race condition protection)
      if (state.currentAuction.endTime && Date.now() >= state.currentAuction.endTime) {
        socket.emit("error", "Auction has ended");
        return;
      }

      // Accept bid
      state.currentAuction.currentBid = amount;
      state.currentAuction.currentBidderPlayerId = info.playerId;

      // Extend timer by 5 seconds if less than 10 seconds remain
      if (state.currentAuction.endTime) {
        const timeLeft = Math.ceil((state.currentAuction.endTime - Date.now()) / 1000);
        if (timeLeft < 10) {
          state.currentAuction.endTime += 5000;
          // Restart the server-side timer with the new remaining time
          const newRemaining = Math.ceil((state.currentAuction.endTime - Date.now()) / 1000);
          startAuctionTimer(io, info.roomId, newRemaining);
        }
      }

      await saveRoom(state);
      io.to(info.roomId).emit("room:state", state);
    } catch (error) {
      console.error("Error placing bid:", error);
      socket.emit("error", "Failed to place bid");
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    const info = socketRooms.get(socket.id);

    if (info) {
      try {
        await updatePlayerConnection(info.roomId, info.playerId, false);
        const state = await loadRoom(info.roomId);
        if (state) {
          io.to(info.roomId).emit("room:state", state);
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
      socketRooms.delete(socket.id);
    }
  });
}

function startAuctionTimer(io: IOServer, roomId: string, durationSeconds: number) {
  // Clear existing timer
  const existingTimer = auctionTimers.get(roomId);
  if (existingTimer) {
    clearInterval(existingTimer);
  }

  let remaining = durationSeconds;

  const timer = setInterval(async () => {
    remaining--;

    // Broadcast tick
    io.to(roomId).emit("auction:tick", remaining);

    if (remaining <= 0) {
      clearInterval(timer);
      auctionTimers.delete(roomId);

      // End auction
      try {
        const state = await loadRoom(roomId);
        if (!state) return;

        state.currentAuction.status = "ENDED";

        // Assign contestant to winner
        if (
          state.currentAuction.currentBidderPlayerId &&
          state.currentAuction.contestantId
        ) {
          const winnerId = state.currentAuction.currentBidderPlayerId;
          const contestantId = state.currentAuction.contestantId;
          const winningBid = state.currentAuction.currentBid;

          // Deduct budget
          state.players[winnerId].budgetRemaining -= winningBid;

          // Assign contestant
          state.players[winnerId].roster.push(contestantId);
          state.contestants[contestantId].status = "DRAFTED";
          state.contestants[contestantId].draftedByPlayerId = winnerId;
          state.contestants[contestantId].draftedPrice = winningBid;

          // Calculate draft order
          const draftedCount = Object.values(state.contestants).filter(
            (c) => c.status === "DRAFTED"
          ).length;
          state.contestants[contestantId].draftOrder = draftedCount;

          // Winner gets to nominate next
          state.nominatorPlayerId = winnerId;
        } else {
          // No bids - return to available
          if (state.currentAuction.contestantId) {
            state.contestants[state.currentAuction.contestantId].status = "AVAILABLE";
          }
        }

        // Reset auction
        state.currentAuction = {
          status: "IDLE",
          currentBid: 0,
        };

        // Check if draft is complete
        const availableContestants = Object.values(state.contestants).filter(
          (c) => c.status === "AVAILABLE"
        );
        if (availableContestants.length === 0) {
          state.phase = "COMPLETE";
        }

        await saveRoom(state);
        io.to(roomId).emit("room:state", state);
      } catch (error) {
        console.error("Error ending auction:", error);
      }
    }
  }, 1000);

  auctionTimers.set(roomId, timer);
}

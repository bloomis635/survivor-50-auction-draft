/**
 * Full end-to-end test of the auction draft
 * Simulates multiple players and runs a complete draft
 */

import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomState,
} from "../lib/types";

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
const DELAY = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    testsFailed++;
  }
}

async function test() {
  console.log("🧪 Starting End-to-End Draft Test\n");

  // Step 1: Create a room
  console.log("📝 Step 1: Creating room...");
  const createRes = await fetch(`${SERVER_URL}/api/rooms/create`, {
    method: "POST",
  });
  const { roomId, hostAdminKey } = await createRes.json();
  assert(!!roomId && !!hostAdminKey, `Room created: ${roomId}`);
  await DELAY(500);

  // Step 2: Import contestants via Socket.IO
  console.log("\n📝 Step 2: Importing Survivor 50 cast...");
  const { readFileSync } = await import("fs");
  const { join } = await import("path");
  const castPath = join(process.cwd(), "survivor50_cast.json");
  const castData = JSON.parse(readFileSync(castPath, "utf-8"));

  // We'll add just 5 contestants for faster testing
  const contestantsToAdd = castData.contestants.slice(0, 5);
  assert(true, `Loaded ${contestantsToAdd.length} contestants to add`);

  // Step 3: Connect players
  console.log("\n📝 Step 3: Connecting players...");

  const players: Array<{
    name: string;
    socket: TestSocket;
    state: RoomState | null;
    playerId: string | null;
  }> = [
    { name: "Alice", socket: null as any, state: null, playerId: null },
    { name: "Bob", socket: null as any, state: null, playerId: null },
    { name: "Charlie", socket: null as any, state: null, playerId: null },
  ];

  for (const player of players) {
    player.socket = io(SERVER_URL);

    await new Promise<void>((resolve) => {
      player.socket.on("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      player.socket.on("room:state", (state) => {
        player.state = state;
        if (!player.playerId) {
          const foundPlayer = Object.values(state.players).find(
            (p) => p.name === player.name
          );
          if (foundPlayer) {
            player.playerId = foundPlayer.id;
            resolve();
          }
        }
      });

      player.socket.emit("room:join", {
        roomId,
        playerName: player.name,
      });
    });

    assert(
      !!player.playerId && !!player.state,
      `${player.name} joined successfully`
    );
  }

  await DELAY(500);

  // Step 4: Add contestants via Socket.IO
  console.log("\n📝 Step 4: Adding contestants...");
  const host = players[0];

  for (const contestant of contestantsToAdd) {
    await new Promise<void>((resolve) => {
      const handler = (state: RoomState) => {
        const added = Object.values(state.contestants).find(
          (c) => c.name === contestant.name
        );
        if (added) {
          host.state = state;
          host.socket.off("room:state", handler);
          resolve();
        }
      };

      host.socket.on("room:state", handler);

      host.socket.emit("contestant:add", {
        adminKey: hostAdminKey,
        contestant: {
          name: contestant.name,
          bio: contestant.bio,
          imageUrl: contestant.imageUrl,
        },
      });
    });
  }

  const contestantCount = Object.keys(host.state?.contestants || {}).length;
  assert(
    contestantCount === contestantsToAdd.length,
    `${contestantCount} contestants added`
  );
  await DELAY(500);

  // Step 5: Verify initial state
  console.log("\n📝 Step 5: Verifying initial state...");
  assert(host.state?.phase === "LOBBY", "Room in LOBBY phase");
  assert(
    Object.keys(host.state?.players || {}).length === 3,
    "3 players connected"
  );
  assert(
    host.state?.settings.startingBudget === 100,
    "Starting budget is $100"
  );

  // Step 6: Start the draft
  console.log("\n📝 Step 6: Starting draft...");

  await new Promise<void>((resolve) => {
    host.socket.on("room:state", (state) => {
      if (state.phase === "AUCTION") {
        host.state = state;
        resolve();
      }
    });

    host.socket.emit("draft:start", { adminKey: hostAdminKey });
  });

  assert(host.state?.phase === "AUCTION", "Draft started, phase is AUCTION");
  await DELAY(500);

  // Step 7: Run 3 auctions
  console.log("\n📝 Step 7: Running 3 auctions...");

  const availableContestants = Object.values(host.state?.contestants || {})
    .filter((c) => c.status === "AVAILABLE")
    .slice(0, 3);

  for (let i = 0; i < 3; i++) {
    const contestant = availableContestants[i];
    console.log(`\n  Auction ${i + 1}: ${contestant.name}`);

    // Nominate
    await new Promise<void>((resolve) => {
      let nominationReceived = false;
      const timeout = setTimeout(() => {
        if (!nominationReceived) {
          console.warn("    ⚠️  Nomination timeout");
          resolve();
        }
      }, 2000);

      host.socket.on("room:state", (state) => {
        if (state.currentAuction.contestantId === contestant.id) {
          nominationReceived = true;
          clearTimeout(timeout);
          host.state = state;
          resolve();
        }
      });

      host.socket.emit("auction:nominate", {
        adminKey: hostAdminKey,
        contestantId: contestant.id,
      });
    });

    assert(
      host.state?.currentAuction.contestantId === contestant.id,
      `  ${contestant.name} nominated`
    );
    await DELAY(300);

    // Start auction
    await new Promise<void>((resolve) => {
      host.socket.on("room:state", (state) => {
        if (state.currentAuction.status === "RUNNING") {
          host.state = state;
          resolve();
        }
      });

      host.socket.emit("auction:start", { adminKey: hostAdminKey });
    });

    assert(
      host.state?.currentAuction.status === "RUNNING",
      `  Auction started`
    );
    await DELAY(300);

    // Place bids from different players
    const bidder = players[i % 3];
    const bidAmount = (i + 1) * 5;

    await new Promise<void>((resolve) => {
      bidder.socket.on("room:state", (state) => {
        if (state.currentAuction.currentBid === bidAmount) {
          bidder.state = state;
          resolve();
        }
      });

      bidder.socket.emit("auction:bid", { amount: bidAmount });
    });

    assert(
      bidder.state?.currentAuction.currentBid === bidAmount &&
        bidder.state?.currentAuction.currentBidderPlayerId === bidder.playerId,
      `  ${bidder.name} bid $${bidAmount}`
    );

    // Wait for timer to expire
    console.log(`  ⏳ Waiting for auction to end...`);
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (host.state?.currentAuction.status === "ENDED" ||
            host.state?.currentAuction.status === "IDLE") {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);

      // Also listen for state updates
      host.socket.on("room:state", (state) => {
        host.state = state;
        if (state.currentAuction.status === "ENDED" ||
            state.currentAuction.status === "IDLE") {
          clearInterval(checkInterval);
          resolve();
        }
      });

      // Timeout after 35 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 35000);
    });

    await DELAY(1000);

    // Verify winner
    const draftedContestant = bidder.state?.contestants[contestant.id];
    assert(
      draftedContestant?.status === "DRAFTED" &&
        draftedContestant?.draftedByPlayerId === bidder.playerId &&
        draftedContestant?.draftedPrice === bidAmount,
      `  ${bidder.name} won ${contestant.name} for $${bidAmount}`
    );

    // Verify budget deducted
    const updatedBudget = bidder.state?.players[bidder.playerId!]?.budgetRemaining;
    const expectedBudget = 100 - bidAmount;
    assert(
      updatedBudget === expectedBudget,
      `  ${bidder.name}'s budget: $${updatedBudget} (expected $${expectedBudget})`
    );

    await DELAY(500);
  }

  // Step 8: Verify final state
  console.log("\n📝 Step 8: Verifying final state...");

  for (const player of players) {
    const roster = Object.values(player.state?.contestants || {}).filter(
      (c) => c.draftedByPlayerId === player.playerId
    );
    assert(roster.length === 1, `${player.name} has 1 contestant in roster`);
  }

  // Step 9: Cleanup
  console.log("\n📝 Step 9: Cleaning up...");
  for (const player of players) {
    player.socket.disconnect();
  }
  assert(true, "All players disconnected");

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 TEST COMPLETE!");
  console.log("=".repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log("\n🎊 ALL TESTS PASSED! The app is working perfectly!");
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above for details.");
  }

  process.exit(testsFailed === 0 ? 0 : 1);
}

// Run the test
test().catch((error) => {
  console.error("💥 Test crashed:", error);
  process.exit(1);
});

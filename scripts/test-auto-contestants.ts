/**
 * Quick test to verify contestants are auto-loaded
 */

import { io } from "socket.io-client";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";

async function test() {
  console.log("🧪 Testing Auto-Load of Survivor 50 Cast\n");

  // Create room
  console.log("1. Creating room...");
  const res = await fetch(`${SERVER_URL}/api/rooms/create`, { method: "POST" });
  const { roomId } = await res.json();
  console.log(`   ✅ Room created: ${roomId}`);

  // Connect and join
  console.log("\n2. Connecting player...");
  const socket = io(SERVER_URL);

  await new Promise((resolve) => socket.on("connect", resolve));

  const state = await new Promise((resolve) => {
    socket.on("room:state", resolve);
    socket.emit("room:join", { roomId, playerName: "Test Player" });
  });

  // Check contestants
  const contestantCount = Object.keys((state as any).contestants).length;
  console.log(`   ✅ Connected to room`);
  console.log(`\n3. Checking contestants...`);
  console.log(`   📊 Found ${contestantCount} contestants`);

  if (contestantCount === 24) {
    const names = Object.values((state as any).contestants)
      .slice(0, 5)
      .map((c: any) => c.name);
    console.log(`   ✅ First 5: ${names.join(", ")}`);
    console.log(`\n✅ SUCCESS! All 24 Survivor contestants auto-loaded!`);
  } else {
    console.log(`   ❌ FAILED: Expected 24, got ${contestantCount}`);
  }

  socket.disconnect();
  process.exit(contestantCount === 24 ? 0 : 1);
}

test();

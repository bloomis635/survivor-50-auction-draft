/**
 * Utility script to import Survivor 50 cast into a draft room
 *
 * Usage:
 * npx tsx scripts/import-cast.ts <roomId> <hostAdminKey>
 *
 * Example:
 * npx tsx scripts/import-cast.ts ABC123 your-admin-key-here
 */

import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/prisma";
import { loadRoom, saveRoom, clearRoomCache } from "../lib/room-manager";

async function importCast(roomId: string, adminKey: string) {
  // Verify admin key
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { hostAdminKey: true },
  });

  if (!room) {
    console.error(`❌ Room ${roomId} not found`);
    process.exit(1);
  }

  if (room.hostAdminKey !== adminKey) {
    console.error("❌ Invalid admin key");
    process.exit(1);
  }

  // Load cast data
  const castPath = join(process.cwd(), "survivor50_cast.json");
  const castData = JSON.parse(readFileSync(castPath, "utf-8"));

  console.log(`📂 Loaded ${castData.contestants.length} contestants from cast file`);

  // Clear cache and load room state
  clearRoomCache(roomId);
  const state = await loadRoom(roomId);

  if (!state) {
    console.error("❌ Failed to load room state");
    process.exit(1);
  }

  // Import contestants
  let imported = 0;
  for (const contestant of castData.contestants) {
    const id = `cast_${contestant.name.toLowerCase().replace(/\s+/g, "_")}`;

    state.contestants[id] = {
      id,
      name: contestant.name,
      bio: contestant.bio,
      imageUrl: contestant.imageUrl,
      status: "AVAILABLE",
    };

    imported++;
  }

  // Save to database
  await saveRoom(state);

  console.log(`✅ Imported ${imported} contestants to room ${roomId}`);
  console.log("🎯 You can now start the draft!");
}

// Run script
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage: npx tsx scripts/import-cast.ts <roomId> <hostAdminKey>");
  console.log("\nTo get your admin key:");
  console.log("1. Create a draft room in the UI");
  console.log("2. Check localStorage in your browser:");
  console.log("   localStorage.getItem('host_<roomId>')");
  process.exit(1);
}

const [roomId, adminKey] = args;

importCast(roomId, adminKey)
  .then(() => {
    console.log("\n✨ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });

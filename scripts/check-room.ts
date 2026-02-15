import { prisma } from "../lib/prisma";

const roomId = process.argv[2];

if (!roomId) {
  console.log("Usage: npx tsx scripts/check-room.ts <roomId>");
  process.exit(1);
}

async function checkRoom() {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { contestants: true, players: true },
  });

  if (!room) {
    console.log(`Room ${roomId} not found`);
    process.exit(1);
  }

  console.log(`\n📊 Room ${roomId}:`);
  console.log(`   Players: ${room.players.length}`);
  console.log(`   Contestants: ${room.contestants.length}`);

  if (room.contestants.length > 0) {
    console.log(`\n✅ First 5 contestants:`);
    room.contestants.slice(0, 5).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name}`);
    });
  }

  process.exit(0);
}

checkRoom();

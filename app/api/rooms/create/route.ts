import { NextResponse } from "next/server";
import { createRoom } from "@/lib/room-manager";

export async function POST() {
  try {
    const { roomId, hostAdminKey } = await createRoom();
    return NextResponse.json({ roomId, hostAdminKey });
  } catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

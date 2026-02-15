"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms/create", { method: "POST" });
      const data = await res.json();

      if (data.roomId && data.hostAdminKey) {
        sessionStorage.setItem(`host_${data.roomId}`, data.hostAdminKey);
        router.push(`/room/${data.roomId}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (joinCode.trim()) {
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Dark overlay for readability - increased opacity for better text contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-65"></div>

      {/* Glass morphism card with frosted glass effect */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-lg shadow-2xl shadow-black/50 p-8 max-w-md w-full relative z-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-white drop-shadow-lg leading-tight">
          Loomis Frenduto Brown Mooney<br />Survivor 50 Auction
        </h1>

        <div className="space-y-4">
          {/* Primary button with glow effect */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 hover:scale-105 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-amber-700/50"
          >
            {loading ? "Creating..." : "Create New Draft Room"}
          </button>

          {/* OR divider with glass effect */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white drop-shadow-md">OR</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Glass effect input field */}
            <input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:shadow-lg focus:shadow-amber-700/30 text-center text-lg font-mono uppercase text-white placeholder-white/60 transition-all duration-200"
              maxLength={6}
            />
            {/* Secondary button with glass effect */}
            <button
              onClick={handleJoinRoom}
              disabled={!joinCode.trim()}
              className="w-full bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 border border-white/20 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Footer with enhanced visibility */}
        <div className="mt-8 text-center text-sm text-white/80 drop-shadow-md">
          <p>Host creates a room and shares the code.</p>
          <p>Players join and bid on Survivor contestants!</p>
        </div>
      </div>
    </div>
  );
}

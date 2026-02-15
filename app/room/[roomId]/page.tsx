"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import type {
  RoomState,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/types";
import Lobby from "@/components/Lobby";
import Auction from "@/components/Auction";
import Results from "@/components/Results";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [state, setState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const autoRejoining = useRef(false);

  const isHost = typeof window !== "undefined" &&
    sessionStorage.getItem(`host_${roomId}`) !== null;

  const getAdminKey = () => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`host_${roomId}`);
  };

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io({
        path: "/socket.io",
      });

      socket.on("room:state", (newState) => {
        setState(newState);
      });

      socket.on("error", (message) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
      });

      socket.on("auction:tick", (remaining) => {
        setTimeRemaining(remaining);
      });
    }

    // Try to auto-rejoin if we have a saved player ID and name
    const savedPlayerId = sessionStorage.getItem(`player_${roomId}`);
    const savedPlayerName = sessionStorage.getItem(`playerName_${roomId}`);
    if (savedPlayerId && savedPlayerName) {
      setPlayerId(savedPlayerId);
      setPlayerName(savedPlayerName);
      autoRejoining.current = true;

      // Auto-rejoin the room
      socket.emit("room:join", {
        roomId,
        playerName: savedPlayerName,
        playerId: savedPlayerId,
      });

      // Listen for state to confirm rejoin
      socket.once("room:state", (newState) => {
        const ourPlayer = Object.values(newState.players).find(
          (p) => p.id === savedPlayerId
        );
        if (ourPlayer) {
          setPlayerId(ourPlayer.id);
          setJoined(true);
        }
        autoRejoining.current = false;
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [roomId]);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    socket?.emit("room:join", {
      roomId,
      playerName: playerName.trim(),
      playerId: playerId || undefined,
    });

    // Listen for state update to confirm join
    const handleStateUpdate = (newState: RoomState) => {
      // Find our player in the state
      const ourPlayer = Object.values(newState.players).find(
        (p) => p.name === playerName.trim()
      );
      if (ourPlayer) {
        setPlayerId(ourPlayer.id);
        sessionStorage.setItem(`player_${roomId}`, ourPlayer.id);
        sessionStorage.setItem(`playerName_${roomId}`, playerName.trim());
        setJoined(true);
      }
    };

    socket?.once("room:state", handleStateUpdate);
  };

  if (!joined && !autoRejoining.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            Join Room
          </h1>
          <p className="text-center text-gray-600 mb-6">Room: {roomId}</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={30}
            />
            <button
              onClick={handleJoin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Reconnecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md">
          {error}
        </div>
      )}

      {state.phase === "LOBBY" && (
        <Lobby
          state={state}
          roomId={roomId}
          playerId={playerId!}
          isHost={isHost}
          adminKey={getAdminKey()}
          socket={socket!}
        />
      )}

      {state.phase === "AUCTION" && (
        <Auction
          state={state}
          roomId={roomId}
          playerId={playerId!}
          isHost={isHost}
          adminKey={getAdminKey()}
          socket={socket!}
          timeRemaining={timeRemaining}
        />
      )}

      {state.phase === "COMPLETE" && (
        <Results state={state} roomId={roomId} />
      )}
    </div>
  );
}

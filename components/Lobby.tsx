import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";
import type {
  RoomState,
  ServerToClientEvents,
  ClientToServerEvents,
  Contestant,
} from "@/lib/types";

interface LobbyProps {
  state: RoomState;
  roomId: string;
  playerId: string;
  isHost: boolean;
  adminKey: string | null;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

export default function Lobby({
  state,
  roomId,
  playerId,
  isHost,
  adminKey,
  socket,
}: LobbyProps) {
  const [showAddContestant, setShowAddContestant] = useState(false);
  const [newContestant, setNewContestant] = useState({
    name: "",
    bio: "",
    imageUrl: "",
  });

  const [settings, setSettings] = useState(state.settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Sync local settings when server state changes (e.g. after update confirmed)
  useEffect(() => {
    setSettings(state.settings);
  }, [state.settings.startingBudget, state.settings.minIncrement, state.settings.timerSeconds]);

  const handleAddContestant = () => {
    if (!adminKey || !newContestant.name.trim()) return;

    socket.emit("contestant:add", {
      adminKey,
      contestant: {
        name: newContestant.name.trim(),
        bio: newContestant.bio.trim(),
        imageUrl: newContestant.imageUrl.trim() || undefined,
      },
    });

    setNewContestant({ name: "", bio: "", imageUrl: "" });
    setShowAddContestant(false);
  };

  const handleDeleteContestant = (contestantId: string) => {
    if (!adminKey) return;
    if (!confirm("Delete this contestant?")) return;

    socket.emit("contestant:delete", { adminKey, contestantId });
  };

  const handleUpdateSettings = () => {
    if (!adminKey) return;
    socket.emit("settings:update", { adminKey, settings });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleStartDraft = () => {
    if (!adminKey) return;
    if (Object.keys(state.contestants).length === 0) {
      alert("Add at least one contestant before starting");
      return;
    }
    if (Object.keys(state.players).length === 0) {
      alert("Wait for at least one player to join");
      return;
    }
    if (confirm("Start the draft? Settings will be locked.")) {
      socket.emit("draft:start", { adminKey });
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const contestants = Object.values(state.contestants);
  const players = Object.values(state.players);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Draft Lobby
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">Room Code:</span>
                <span className="ml-2 text-xl font-mono font-bold">{roomId}</span>
              </div>
              {isHost && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  HOST
                </span>
              )}
            </div>
          </div>

          {/* Main action button at the top */}
          {isHost && (
            <button
              onClick={handleStartDraft}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition shadow-lg whitespace-nowrap"
            >
              Start Draft
            </button>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600">Share this link:</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Players */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            Players ({players.length})
          </h2>
          <div className="space-y-2">
            {players.length === 0 ? (
              <p className="text-gray-500 italic">Waiting for players...</p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    player.id === playerId ? "bg-orange-100 border border-orange-300" : "bg-gray-50"
                  }`}
                >
                  <span className="font-medium">
                    {player.name}
                    {player.id === playerId && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold">(You)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      ${player.budgetRemaining}
                    </span>
                    {player.connected ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Draft Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Budget ($)
              </label>
              <input
                type="number"
                value={settings.startingBudget}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    startingBudget: parseInt(e.target.value) || 0,
                  })
                }
                disabled={!isHost}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Bid Increment ($)
              </label>
              <input
                type="number"
                value={settings.minIncrement}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minIncrement: parseInt(e.target.value) || 1,
                  })
                }
                disabled={!isHost}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auction Timer (seconds)
              </label>
              <input
                type="number"
                value={settings.timerSeconds}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timerSeconds: parseInt(e.target.value) || 10,
                  })
                }
                disabled={!isHost}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
            </div>
            {isHost && (
              <button
                onClick={handleUpdateSettings}
                className={`w-full font-semibold py-2 px-4 rounded-lg transition ${
                  settingsSaved
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {settingsSaved ? "Settings Saved!" : "Update Settings"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contestants */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Contestants ({contestants.length})
          </h2>
          {isHost && (
            <button
              onClick={() => setShowAddContestant(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              + Add Contestant
            </button>
          )}
        </div>

        {showAddContestant && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-green-500">
            <h3 className="font-semibold mb-2">New Contestant</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={newContestant.name}
                onChange={(e) =>
                  setNewContestant({ ...newContestant, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Bio"
                value={newContestant.bio}
                onChange={(e) =>
                  setNewContestant({ ...newContestant, bio: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={newContestant.imageUrl}
                onChange={(e) =>
                  setNewContestant({ ...newContestant, imageUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddContestant}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddContestant(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {contestants.length === 0 ? (
          <p className="text-gray-500 italic">
            {isHost
              ? "Add contestants to start the draft"
              : "Waiting for host to add contestants..."}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contestants.map((contestant) => (
              <div
                key={contestant.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                {contestant.imageUrl && (
                  <img
                    src={contestant.imageUrl}
                    alt={contestant.name}
                    className="w-full h-48 object-contain rounded-lg mb-2 bg-gray-50"
                  />
                )}
                <h3 className="font-bold text-lg">
                  {contestant.name}
                  {contestant.star && (
                    <span className="ml-1 text-yellow-500" title="Fan Favorite">&#9733;</span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {contestant.bio}
                </p>
                {isHost && (
                  <button
                    onClick={() => handleDeleteContestant(contestant.id)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

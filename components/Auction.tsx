import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";
import type {
  RoomState,
  ServerToClientEvents,
  ClientToServerEvents,
  Contestant,
} from "@/lib/types";

interface AuctionProps {
  state: RoomState;
  roomId: string;
  playerId: string;
  isHost: boolean;
  adminKey: string | null;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  timeRemaining: number | null;
}

export default function Auction({
  state,
  playerId,
  isHost,
  adminKey,
  socket,
  timeRemaining,
}: AuctionProps) {
  const [customBid, setCustomBid] = useState("");
  const [selectedContestantId, setSelectedContestantId] = useState<string | null>(
    null
  );

  const currentPlayer = state.players[playerId];
  const contestants = Object.values(state.contestants);
  const availableContestants = contestants.filter((c) => c.status === "AVAILABLE");
  const nominatedContestant = state.currentAuction.contestantId
    ? state.contestants[state.currentAuction.contestantId]
    : null;

  const currentBidder = state.currentAuction.currentBidderPlayerId
    ? state.players[state.currentAuction.currentBidderPlayerId]
    : null;

  const minNextBid =
    state.currentAuction.currentBid + state.settings.minIncrement;

  const isNominator = state.nominatorPlayerId === playerId;
  const canNominate = isHost || isNominator;

  const handleNominate = () => {
    if (!selectedContestantId) return;
    if (!canNominate) return;
    socket.emit("auction:nominate", {
      adminKey: adminKey || undefined,
      contestantId: selectedContestantId,
    });
    setSelectedContestantId(null);
  };

  const handleStartAuction = () => {
    if (!adminKey) return;
    socket.emit("auction:start", { adminKey });
  };

  const handleBid = (amount: number) => {
    if (amount < minNextBid) {
      alert(`Minimum bid is $${minNextBid}`);
      return;
    }
    if (amount > currentPlayer.budgetRemaining) {
      alert("Insufficient budget");
      return;
    }
    socket.emit("auction:bid", { amount });
    setCustomBid("");
  };

  const handleCustomBid = () => {
    const amount = parseInt(customBid);
    if (isNaN(amount)) return;
    handleBid(amount);
  };

  const quickBidAmounts = [10, 20, 30];

  // Calculate progress bar percentage
  const timerProgress = timeRemaining !== null && state.settings.timerSeconds > 0
    ? (timeRemaining / state.settings.timerSeconds) * 100
    : 0;

  const players = Object.values(state.players);
  const draftedContestants = contestants.filter((c) => c.status === "DRAFTED");

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-800">Live Draft</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Your Budget</div>
              <div className="text-xl font-bold text-green-600">
                ${currentPlayer.budgetRemaining}
              </div>
            </div>
            {isHost && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                HOST
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Auction Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Auction */}
          {nominatedContestant ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Current Auction</h2>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Contestant Card */}
                <div className="flex-shrink-0">
                  {nominatedContestant.imageUrl ? (
                    <img
                      src={nominatedContestant.imageUrl}
                      alt={nominatedContestant.name}
                      className="w-full md:w-64 h-64 object-contain rounded-lg bg-gray-50"
                    />
                  ) : (
                    <div className="w-full md:w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    {nominatedContestant.name}
                    {nominatedContestant.star && (
                      <span className="ml-2 text-yellow-500" title="Fan Favorite">&#9733;</span>
                    )}
                  </h3>
                  <p className="text-gray-600 mb-4">{nominatedContestant.bio}</p>

                  {/* Timer */}
                  {state.currentAuction.status === "RUNNING" && timeRemaining !== null && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Time Remaining</span>
                        <span
                          className={`text-2xl font-bold ${
                            timeRemaining <= 5 ? "text-red-600" : "text-gray-800"
                          }`}
                        >
                          {timeRemaining}s
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            timeRemaining <= 5 ? "bg-red-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${timerProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Current Bid */}
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-600 mb-1">Current Bid</div>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold text-orange-600">
                        ${state.currentAuction.currentBid}
                      </div>
                      {currentBidder && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">High Bidder</div>
                          <div className="font-bold">{currentBidder.name}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bidding Actions */}
                  {state.currentAuction.status === "RUNNING" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {quickBidAmounts.map((amount) => (
                          <button
                            key={amount}
                            onClick={() =>
                              handleBid(state.currentAuction.currentBid + amount)
                            }
                            disabled={
                              state.currentAuction.currentBid + amount >
                              currentPlayer.budgetRemaining
                            }
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +${amount}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={`Min: $${minNextBid}`}
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleCustomBid()}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={handleCustomBid}
                          className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition"
                        >
                          Bid
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Host Controls */}
                  {isHost && (
                    <div className="mt-4 flex gap-2">
                      {state.currentAuction.status === "IDLE" && (
                        <button
                          onClick={handleStartAuction}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition"
                        >
                          Start Auction
                        </button>
                      )}
                      {state.currentAuction.status === "ENDED" && (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
                          Auction Ended - Nominate Next
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            canNominate ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">
                  {isNominator ? "Your Turn to Nominate!" : "Nominate a Contestant"}
                </h2>
                <p className="text-gray-600 mb-4">
                  Select a contestant to put up for auction
                </p>
              </div>
            ) : state.nominatorPlayerId ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Waiting for Nomination</h2>
                <p className="text-gray-600">
                  {state.players[state.nominatorPlayerId]?.name || "A player"} is choosing who to nominate...
                </p>
              </div>
            ) : null
          )}

          {/* Available Contestants (nominator or host) */}
          {canNominate && availableContestants.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                Available Contestants ({availableContestants.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {availableContestants.map((contestant) => (
                  <div
                    key={contestant.id}
                    onClick={() => setSelectedContestantId(contestant.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedContestantId === contestant.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {contestant.imageUrl && (
                      <img
                        src={contestant.imageUrl}
                        alt={contestant.name}
                        className="w-full h-32 object-contain rounded-lg mb-2 bg-gray-50"
                      />
                    )}
                    <h3 className="font-bold">
                      {contestant.name}
                      {contestant.star && (
                        <span className="ml-1 text-yellow-500" title="Fan Favorite">&#9733;</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {contestant.bio}
                    </p>
                  </div>
                ))}
              </div>
              {selectedContestantId && (
                <button
                  onClick={handleNominate}
                  className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  Nominate Selected Contestant
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Players */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Players</h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg ${
                    player.id === playerId ? "bg-orange-100" : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{player.name}</span>
                    {player.connected ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Budget: ${player.budgetRemaining}
                  </div>
                  <div className="text-sm text-gray-600">
                    Roster: {player.roster.length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drafted */}
          {draftedContestants.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                Drafted ({draftedContestants.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {draftedContestants
                  .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
                  .map((contestant) => {
                    const owner = contestant.draftedByPlayerId
                      ? state.players[contestant.draftedByPlayerId]
                      : null;
                    return (
                      <div
                        key={contestant.id}
                        className="p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="font-medium">
                          {contestant.name}
                          {contestant.star && (
                            <span className="ml-1 text-yellow-500" title="Fan Favorite">&#9733;</span>
                          )}
                        </div>
                        <div className="text-gray-600">
                          {owner?.name} - ${contestant.draftedPrice}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

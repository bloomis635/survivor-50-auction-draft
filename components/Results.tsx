import type { RoomState } from "@/lib/types";

interface ResultsProps {
  state: RoomState;
  roomId: string;
}

export default function Results({ state, roomId }: ResultsProps) {
  const players = Object.values(state.players);
  const contestants = Object.values(state.contestants);

  const exportResults = () => {
    let text = `Survivor 50 Draft Results - Room ${roomId}\n\n`;

    players.forEach((player) => {
      text += `${player.name} - Budget Remaining: $${player.budgetRemaining}\n`;
      const roster = contestants.filter((c) => c.draftedByPlayerId === player.id);
      roster.forEach((c) => {
        text += `  - ${c.name}${c.star ? " \u2605" : ""} ($${c.draftedPrice})\n`;
      });
      text += "\n";
    });

    text += "\nDraft Order:\n";
    contestants
      .filter((c) => c.status === "DRAFTED")
      .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
      .forEach((c) => {
        const owner = c.draftedByPlayerId
          ? state.players[c.draftedByPlayerId]
          : null;
        text += `${c.draftOrder}. ${c.name}${c.star ? " \u2605" : ""} - ${owner?.name} - $${c.draftedPrice}\n`;
      });

    navigator.clipboard.writeText(text);
    alert("Results copied to clipboard!");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Draft Complete!
        </h1>
        <p className="text-gray-600">
          Here are the final results for room {roomId}
        </p>
        <button
          onClick={exportResults}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          Copy Results
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {players.map((player) => {
          const roster = contestants.filter(
            (c) => c.draftedByPlayerId === player.id
          );
          const totalSpent =
            state.settings.startingBudget - player.budgetRemaining;

          return (
            <div key={player.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{player.name}</h2>
                  <p className="text-sm text-gray-600">
                    {roster.length} contestants
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Spent</div>
                  <div className="text-xl font-bold text-red-600">
                    ${totalSpent}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Remaining</div>
                  <div className="text-lg font-bold text-green-600">
                    ${player.budgetRemaining}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {roster.length === 0 ? (
                  <p className="text-gray-500 italic">No contestants drafted</p>
                ) : (
                  roster
                    .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
                    .map((contestant) => (
                      <div
                        key={contestant.id}
                        className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-bold">
                            {contestant.name}
                            {contestant.star && (
                              <span className="ml-1 text-yellow-500" title="Fan Favorite">&#9733;</span>
                            )}
                          </div>
                          {contestant.bio && (
                            <div className="text-sm text-gray-600 line-clamp-1">
                              {contestant.bio}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-bold text-orange-600">
                            ${contestant.draftedPrice}
                          </div>
                          <div className="text-xs text-gray-500">
                            Pick #{contestant.draftOrder}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Draft Order</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {contestants
            .filter((c) => c.status === "DRAFTED")
            .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
            .map((contestant) => {
              const owner = contestant.draftedByPlayerId
                ? state.players[contestant.draftedByPlayerId]
                : null;
              return (
                <div
                  key={contestant.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-bold text-gray-500 mr-2">
                      #{contestant.draftOrder}
                    </span>
                    <span className="font-medium">
                      {contestant.name}
                      {contestant.star && (
                        <span className="ml-1 text-yellow-500" title="Fan Favorite">&#9733;</span>
                      )}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-gray-600">{owner?.name}</div>
                    <div className="font-bold text-orange-600">
                      ${contestant.draftedPrice}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

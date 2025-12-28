'use client';

import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  currentDrawer: string | null;
  currentPlayerId: string | null;
}

export default function Scoreboard({ players, currentDrawer, currentPlayerId }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Scoreboard</h2>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              player.id === currentPlayerId
                ? 'bg-primary-100 border-2 border-primary-500'
                : 'bg-gray-50'
            } ${player.id === currentDrawer ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-500 w-6">#{index + 1}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{player.name}</span>
                  {player.isHost && (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                      Host
                    </span>
                  )}
                  {player.id === currentDrawer && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                      Drawing
                    </span>
                  )}
                  {player.id === currentPlayerId && (
                    <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full font-medium">
                      You
                    </span>
                  )}
                </div>
                {!player.connected && (
                  <span className="text-xs text-red-500">Disconnected</span>
                )}
              </div>
            </div>
            <div className="text-xl font-bold text-primary-600">{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

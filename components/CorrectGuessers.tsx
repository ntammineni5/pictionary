'use client';

import React from 'react';
import { Player } from '../types';

interface CorrectGuessersProps {
  correctGuessers: Array<{ playerId: string; playerName: string }>;
  allPlayers: Player[];
  onStopTimer: (selectedIds: string[]) => void;
  manualMode?: boolean;  // If true, show all players instead of just correct guessers
  currentDrawerId?: string;  // Exclude drawer from selection
}

export default function CorrectGuessers({
  correctGuessers,
  allPlayers,
  onStopTimer,
  manualMode = false,
  currentDrawerId,
}: CorrectGuessersProps) {
  // In manual mode, show all players except the drawer; otherwise show only correct guessers
  const playersToShow = manualMode
    ? allPlayers
        .filter((p) => p.id !== currentDrawerId)
        .map((p) => ({ playerId: p.id, playerName: p.name }))
    : correctGuessers;

  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(correctGuessers.map((g) => g.playerId))
  );

  const toggleSelection = (playerId: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onStopTimer(Array.from(selected));
  };

  if (playersToShow.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          {manualMode ? 'Stop Round & Award Points' : 'Players Guessed Correctly!'}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {manualMode
            ? 'Select which players guessed correctly, then award points.'
            : 'Select which players guessed correctly and then stop the timer.'}
        </p>

        <div className="space-y-2 mb-6">
          {playersToShow.map((guesser) => (
            <button
              key={guesser.playerId}
              onClick={() => toggleSelection(guesser.playerId)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selected.has(guesser.playerId)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{guesser.playerName}</span>
                {selected.has(guesser.playerId) && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
        >
          Stop Timer & Award Points
        </button>
      </div>
    </div>
  );
}

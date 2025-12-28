'use client';

import { Word } from '../types';

interface WordSelectionProps {
  words: Word[];
  onSelect: (word: Word) => void;
}

const difficultyColors = {
  easy: 'bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200',
  medium: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500 text-yellow-800 dark:text-yellow-200',
  hard: 'bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200',
};

export default function WordSelection({ words, onSelect }: WordSelectionProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-2xl w-full p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
          Choose a Word to Draw
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Select a word based on difficulty - harder words earn more points!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {words.map((word) => (
            <button
              key={word.text}
              onClick={() => onSelect(word)}
              className={`p-6 rounded-xl border-4 ${difficultyColors[word.difficulty]} hover:scale-105 transition-transform`}
            >
              <div className="text-sm font-semibold uppercase mb-2">
                {word.difficulty}
              </div>
              <div className="text-2xl font-bold mb-2">{word.text}</div>
              <div className="text-lg font-semibold">{word.points} points</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

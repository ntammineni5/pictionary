'use client';

import { useState } from 'react';

interface GuessInputProps {
  onGuess: (guess: string) => void;
  disabled: boolean;
}

interface GuessMessage {
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

export default function GuessInput({ onGuess, disabled }: GuessInputProps) {
  const [guess, setGuess] = useState('');
  const [messages, setMessages] = useState<GuessMessage[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || disabled) return;

    onGuess(guess.trim());
    setGuess('');
  };

  const addMessage = (text: string, isCorrect: boolean) => {
    setMessages((prev) => [...prev, { text, isCorrect, timestamp: Date.now() }]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Guesses</h2>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-[200px]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${
              msg.isCorrect
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Wait for your turn..." : "Type your guess..."}
          className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={disabled || !guess.trim()}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Guess
        </button>
      </form>
    </div>
  );
}

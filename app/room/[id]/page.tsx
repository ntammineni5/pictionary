'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/store';
import Canvas from '@/components/Canvas';
import Scoreboard from '@/components/Scoreboard';
import GuessInput from '@/components/GuessInput';
import WordSelection from '@/components/WordSelection';
import Timer from '@/components/Timer';
import CorrectGuessers from '@/components/CorrectGuessers';
import { Word, DrawingStroke, GuessResult } from '@/types';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const { room, playerId, playerName, setRoom, setPlayerName, reset } = useGameStore();

  const [wordChoices, setWordChoices] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [timer, setTimer] = useState(60);
  const [correctGuessers, setCorrectGuessers] = useState<Array<{ playerId: string; playerName: string }>>([]);
  const [showCorrectGuessers, setShowCorrectGuessers] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [roundEndData, setRoundEndData] = useState<{ word: string; scores: Record<string, number> } | null>(null);
  const [gameEndData, setGameEndData] = useState<{ finalScores: Record<string, number>; winner: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [manualStopMode, setManualStopMode] = useState(false);

  const socketRef = useRef(getSocket());

  const isDrawer = room?.currentDrawer === playerId;
  const canGuess = !isDrawer && room?.gameState === 'drawing';

  useEffect(() => {
    const socket = socketRef.current;

    // Show name prompt if accessing room directly without playerName
    if (!playerName && !room) {
      setShowNamePrompt(true);
      // Don't return early! We still need to set up socket listeners below
    } else if (playerId && playerName && !room) {
      // Rejoin room if we have the state (but already have playerName)
      socket.emit('room:join', { roomId, playerName });
    }

    socket.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('room:joined', ({ room: joinedRoom }) => {
      setRoom(joinedRoom);
    });

    socket.on('game:started', (startedRoom) => {
      setRoom(startedRoom);
      setRoundEndData(null);
      setGameEndData(null);
    });

    socket.on('game:word-selection', ({ wordChoices: choices }) => {
      setWordChoices(choices);
    });

    socket.on('game:round-start', ({ word, timer: timerValue }) => {
      if (word) {
        setCurrentWord(word);
      } else {
        setCurrentWord('');
      }
      setTimer(timerValue);
      setCorrectGuessers([]);
      setShowCorrectGuessers(false);
      setRoundEndData(null);
    });

    socket.on('game:timer-update', (seconds) => {
      setTimer(seconds);
    });

    socket.on('game:timer-stopped', () => {
      setShowCorrectGuessers(false);
    });

    socket.on('drawing:stroke', (stroke) => {
      if (room) {
        const updatedRoom = {
          ...room,
          canvas: [...room.canvas, stroke]  // Create new array to trigger re-render
        };
        setRoom(updatedRoom);
      }
    });

    socket.on('drawing:clear', () => {
      if (room) {
        const updatedRoom = { ...room };
        updatedRoom.canvas = [];
        setRoom(updatedRoom);
      }
    });

    socket.on('guess:result', (result) => {
      setGuessResult(result);
      setTimeout(() => setGuessResult(null), 3000);
    });

    socket.on('guess:correct', ({ playerId: guesserId, playerName: guesserName }) => {
      setCorrectGuessers((prev) => {
        if (prev.find((g) => g.playerId === guesserId)) return prev;
        return [...prev, { playerId: guesserId, playerName: guesserName }];
      });
      setShowCorrectGuessers(true);
    });

    socket.on('game:round-end', (data) => {
      setRoundEndData(data);
      setCurrentWord('');
      setWordChoices([]);
    });

    socket.on('game:end', (data) => {
      setGameEndData(data);
    });

    socket.on('error', (message) => {
      alert(message);
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('room:updated');
      socket.off('room:joined');
      socket.off('game:started');
      socket.off('game:word-selection');
      socket.off('game:round-start');
      socket.off('game:timer-update');
      socket.off('game:timer-stopped');
      socket.off('drawing:stroke');
      socket.off('drawing:clear');
      socket.off('guess:result');
      socket.off('guess:correct');
      socket.off('game:round-end');
      socket.off('game:end');
      socket.off('error');
    };
  }, [roomId, playerId, playerName, room, setRoom]);

  const handleStartGame = () => {
    socketRef.current.emit('game:start');
  };

  const handleSelectWord = (word: Word) => {
    socketRef.current.emit('game:select-word', word);
    setWordChoices([]);
  };

  const handleStroke = (stroke: DrawingStroke) => {
    socketRef.current.emit('drawing:stroke', stroke);
  };

  const handleClear = () => {
    socketRef.current.emit('drawing:clear');
  };

  const handleGuess = (guess: string) => {
    socketRef.current.emit('guess:submit', guess);
  };

  const handleStopTimer = (selectedIds: string[]) => {
    socketRef.current.emit('game:stop-timer', selectedIds);
    setShowCorrectGuessers(false);
    setManualStopMode(false);
  };

  const handleManualStopRound = () => {
    setManualStopMode(true);
    setShowCorrectGuessers(true);
  };

  const handleLeaveRoom = () => {
    socketRef.current.emit('room:leave');
    reset();
    disconnectSocket();
    router.push('/');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const trimmedName = nameInput.trim();
    setPlayerName(trimmedName);
    setShowNamePrompt(false);
    socketRef.current.emit('room:join', { roomId, playerName: trimmedName });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  // Show name prompt modal if needed (before loading check)
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-md w-full p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
            Welcome to the Room!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Please enter your name to join the game.
          </p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none text-center text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{room.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Room ID: {roomId} · {room.type === 'private' ? 'Private' : 'Public'} Room
              </p>
            </div>
            <div className="flex items-center gap-2">
              {room.type === 'private' && (
                <button
                  onClick={copyRoomLink}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Copy Invite Link
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>

        {/* Waiting Lobby */}
        {room.gameState === 'waiting' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Waiting for players...</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {room.players.length} player{room.players.length !== 1 ? 's' : ''} in room
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full font-medium"
                >
                  {player.name} {player.isHost && '(Host)'}
                </div>
              ))}
            </div>
            {room.hostId === playerId && room.players.length >= 2 && (
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
              >
                Start Game
              </button>
            )}
            {room.players.length < 2 && (
              <p className="text-gray-500 dark:text-gray-400">Need at least 2 players to start</p>
            )}
          </div>
        )}

        {/* Game in Progress */}
        {room.gameState !== 'waiting' && room.gameState !== 'game-end' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Sidebar */}
            <div className="space-y-4">
              <Scoreboard
                players={room.players}
                currentDrawer={room.currentDrawer}
                currentPlayerId={playerId}
              />
            </div>

            {/* Main Canvas Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Game Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {isDrawer && room.gameState === 'drawing' && currentWord && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Your word:</span>
                        <span className="ml-2 text-2xl font-bold text-primary-500 dark:text-primary-400">{currentWord}</span>
                      </div>
                    )}
                    {!isDrawer && room.gameState === 'drawing' && (
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        {room.players.find((p) => p.id === room.currentDrawer)?.name} is drawing...
                      </div>
                    )}
                    {room.gameState === 'word-selection' && (
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        {isDrawer ? 'Choose your word...' : 'Waiting for drawer to choose a word...'}
                      </div>
                    )}
                    {room.gameState === 'round-end' && roundEndData && (
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        The word was: <span className="text-primary-500 dark:text-primary-400">{roundEndData.word}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {room.gameState === 'drawing' && <Timer seconds={timer} isActive={true} />}
                    {isDrawer && room.gameState === 'drawing' && (
                      <button
                        onClick={handleManualStopRound}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold whitespace-nowrap"
                      >
                        Stop Round
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <Canvas
                strokes={room.canvas}
                canDraw={isDrawer && room.gameState === 'drawing'}
                onStroke={handleStroke}
                onClear={handleClear}
              />

              {/* Guess Input */}
              {!isDrawer && (
                <div className="relative">
                  <GuessInput onGuess={handleGuess} disabled={!canGuess} />
                  {guessResult && (
                    <div
                      className={`absolute top-0 right-0 m-4 px-4 py-2 rounded-lg font-semibold ${
                        guessResult.correct
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {guessResult.correct ? 'Correct!' : 'Wrong guess'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game End */}
        {gameEndData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-2xl w-full p-8">
              <h2 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">Game Over!</h2>

              <div className="mb-8">
                <div className="text-center mb-4">
                  <span className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Winner:</span>
                  <span className="ml-2 text-3xl font-bold text-primary-500 dark:text-primary-400">
                    {room.players.find((p) => p.id === gameEndData.winner)?.name || 'Unknown'}
                  </span>
                </div>

                <div className="space-y-2">
                  {room.players
                    .sort((a, b) => (gameEndData.finalScores[b.id] || 0) - (gameEndData.finalScores[a.id] || 0))
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          player.id === gameEndData.winner
                            ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">#{index + 1}</span>
                          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">{player.name}</span>
                        </div>
                        <span className="text-2xl font-bold text-primary-500 dark:text-primary-400">
                          {gameEndData.finalScores[player.id] || 0}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleLeaveRoom}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Leave Room
                </button>
                {room.hostId === playerId && (
                  <button
                    onClick={handleStartGame}
                    className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                  >
                    Play Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {wordChoices.length > 0 && isDrawer && (
          <WordSelection words={wordChoices} onSelect={handleSelectWord} />
        )}

        {showCorrectGuessers && isDrawer && (
          <CorrectGuessers
            correctGuessers={correctGuessers}
            allPlayers={room.players}
            onStopTimer={handleStopTimer}
            manualMode={manualStopMode}
            currentDrawerId={room.currentDrawer || undefined}
          />
        )}
      </div>
    </div>
  );
}

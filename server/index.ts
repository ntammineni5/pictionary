import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from '../types';
import { RoomManager } from './RoomManager';

const PORT = process.env.PORT || 3001;

const httpServer = createServer();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || 'http://localhost:3000'
      : '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
const timerIntervals = new Map<string, NodeJS.Timeout>();

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log('Client connected:', socket.id);

  // Create room
  socket.on('room:create', ({ roomName, roomType, playerName }) => {
    try {
      const room = roomManager.createRoom(roomName, roomType, socket.id, playerName);
      socket.join(room.id);
      socket.emit('room:created', { roomId: room.id, room });

      if (roomType === 'public') {
        io.emit('rooms:list', roomManager.getPublicRooms());
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to create room');
    }
  });

  // Join room
  socket.on('room:join', ({ roomId, playerName }) => {
    try {
      const result = roomManager.joinRoom(roomId, socket.id, playerName);
      if (!result) {
        socket.emit('error', 'Room not found');
        return;
      }

      socket.join(roomId);
      socket.emit('room:joined', { room: result.room, playerId: socket.id });
      io.to(roomId).emit('room:player-joined', result.player);
      io.to(roomId).emit('room:updated', result.room);

      if (result.room.type === 'public') {
        io.emit('rooms:list', roomManager.getPublicRooms());
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to join room');
    }
  });

  // Leave room
  socket.on('room:leave', () => {
    handlePlayerDisconnect(socket.id);
  });

  // Fetch public rooms
  socket.on('rooms:fetch', () => {
    socket.emit('rooms:list', roomManager.getPublicRooms());
  });

  // Start game
  socket.on('game:start', () => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) {
      socket.emit('error', 'Only host can start the game');
      return;
    }

    if (room.players.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }

    const updatedRoom = roomManager.startGame(room.id);
    if (updatedRoom) {
      io.to(room.id).emit('game:started', updatedRoom);

      // Send word choices to current drawer
      const drawer = io.sockets.sockets.get(updatedRoom.currentDrawer!);
      if (drawer) {
        drawer.emit('game:word-selection', { wordChoices: updatedRoom.wordChoices });
      }
    }
  });

  // Select word
  socket.on('game:select-word', (word) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.currentDrawer !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const updatedRoom = roomManager.selectWord(room.id, word);
    if (updatedRoom) {
      // Notify drawer with the word
      socket.emit('game:round-start', {
        drawer: socket.id,
        word: word.text,
        timer: updatedRoom.roundDuration
      });

      // Notify other players without the word
      socket.to(room.id).emit('game:round-start', {
        drawer: socket.id,
        timer: updatedRoom.roundDuration
      });

      io.to(room.id).emit('room:updated', updatedRoom);

      // Start timer
      startRoundTimer(room.id, updatedRoom.roundDuration);
    }
  });

  // Drawing stroke
  socket.on('drawing:stroke', (stroke) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.currentDrawer !== socket.id) return;

    roomManager.addStroke(room.id, stroke);
    socket.to(room.id).emit('drawing:stroke', stroke);
  });

  // Clear canvas
  socket.on('drawing:clear', () => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.currentDrawer !== socket.id) return;

    roomManager.clearCanvas(room.id);
    io.to(room.id).emit('drawing:clear');
  });

  // Submit guess
  socket.on('guess:submit', (guess) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.currentDrawer === socket.id) return;

    const isCorrect = roomManager.submitGuess(room.id, socket.id, guess);

    const player = room.players.find(p => p.id === socket.id);
    socket.emit('guess:result', {
      correct: isCorrect,
      playerId: socket.id,
      playerName: player?.name || 'Unknown'
    });

    if (isCorrect) {
      // Notify the drawer
      const drawer = io.sockets.sockets.get(room.currentDrawer!);
      if (drawer && player) {
        drawer.emit('guess:correct', {
          playerId: socket.id,
          playerName: player.name
        });
      }
    }
  });

  // Stop timer
  socket.on('game:stop-timer', (correctGuessers) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.currentDrawer !== socket.id) return;

    stopRoundTimer(room.id);

    const updatedRoom = roomManager.endRound(room.id, correctGuessers);
    if (updatedRoom) {
      io.to(room.id).emit('game:timer-stopped');
      io.to(room.id).emit('game:round-end', {
        word: updatedRoom.currentWord?.text || '',
        scores: updatedRoom.scores
      });
      io.to(room.id).emit('room:updated', updatedRoom);

      // Auto advance to next round after 5 seconds
      setTimeout(() => {
        const nextRoom = roomManager.nextRound(room.id);
        if (nextRoom) {
          if (nextRoom.gameState === 'game-end') {
            const winner = roomManager.getWinner(room.id);
            io.to(room.id).emit('game:end', {
              finalScores: nextRoom.scores,
              winner: winner || ''
            });
          } else {
            io.to(room.id).emit('room:updated', nextRoom);
            const drawer = io.sockets.sockets.get(nextRoom.currentDrawer!);
            if (drawer) {
              drawer.emit('game:word-selection', { wordChoices: nextRoom.wordChoices });
            }
          }
        }
      }, 5000);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    handlePlayerDisconnect(socket.id);
  });
});

function startRoundTimer(roomId: string, duration: number) {
  stopRoundTimer(roomId);

  let timeLeft = duration;
  const interval = setInterval(() => {
    timeLeft--;
    io.to(roomId).emit('game:timer-update', timeLeft);

    if (timeLeft <= 0) {
      stopRoundTimer(roomId);
      const room = roomManager.getRoom(roomId);

      if (room) {
        const updatedRoom = roomManager.endRound(roomId, room.correctGuessers);
        if (updatedRoom) {
          io.to(roomId).emit('game:round-end', {
            word: updatedRoom.currentWord?.text || '',
            scores: updatedRoom.scores
          });
          io.to(roomId).emit('room:updated', updatedRoom);

          // Auto advance to next round
          setTimeout(() => {
            const nextRoom = roomManager.nextRound(roomId);
            if (nextRoom) {
              if (nextRoom.gameState === 'game-end') {
                const winner = roomManager.getWinner(roomId);
                io.to(roomId).emit('game:end', {
                  finalScores: nextRoom.scores,
                  winner: winner || ''
                });
              } else {
                io.to(roomId).emit('room:updated', nextRoom);
                const drawer = io.sockets.sockets.get(nextRoom.currentDrawer!);
                if (drawer) {
                  drawer.emit('game:word-selection', { wordChoices: nextRoom.wordChoices });
                }
              }
            }
          }, 5000);
        }
      }
    }
  }, 1000);

  timerIntervals.set(roomId, interval);
}

function stopRoundTimer(roomId: string) {
  const interval = timerIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    timerIntervals.delete(roomId);
  }
}

function handlePlayerDisconnect(playerId: string) {
  const result = roomManager.leaveRoom(playerId);
  if (result) {
    const { roomId, room } = result;

    if (room) {
      io.to(roomId).emit('room:player-left', playerId);
      io.to(roomId).emit('room:updated', room);

      if (room.type === 'public') {
        io.emit('rooms:list', roomManager.getPublicRooms());
      }
    } else {
      // Room was deleted
      stopRoundTimer(roomId);
    }
  }
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

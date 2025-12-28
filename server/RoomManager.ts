import { Room, Player, RoomType, Word, DrawingStroke } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getRandomWords } from './words';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  createRoom(roomName: string, roomType: RoomType, hostId: string, hostName: string): Room {
    const roomId = uuidv4();

    const host: Player = {
      id: hostId,
      name: hostName,
      score: 0,
      isHost: true,
      connected: true
    };

    const room: Room = {
      id: roomId,
      name: roomName,
      type: roomType,
      players: [host],
      gameState: 'waiting',
      currentDrawer: null,
      currentWord: null,
      selectedWord: null,
      wordChoices: [],
      turnOrder: [],
      currentTurnIndex: 0,
      scores: { [hostId]: 0 },
      roundTimer: 60,
      roundStartTime: null,
      correctGuessers: [],
      canvas: [],
      hostId: hostId,
      maxPlayers: 15,
      roundDuration: 60
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostId, roomId);

    return room;
  }

  joinRoom(roomId: string, playerId: string, playerName: string): { room: Room; player: Player } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: false,
      connected: true
    };

    room.players.push(player);
    room.scores[playerId] = 0;
    this.playerToRoom.set(playerId, roomId);

    return { room, player };
  }

  leaveRoom(playerId: string): { roomId: string; room: Room | null } | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== playerId);
    delete room.scores[playerId];
    this.playerToRoom.delete(playerId);

    // Reassign host if host left
    if (room.hostId === playerId && room.players.length > 0) {
      const newHost = room.players[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
    }

    // Delete room if empty
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { roomId, room: null };
    }

    return { roomId, room };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getPublicRooms(): Array<{ id: string; name: string; playerCount: number; gameState: string }> {
    return Array.from(this.rooms.values())
      .filter(room => room.type === 'public')
      .map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.length,
        gameState: room.gameState
      }));
  }

  startGame(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length < 2) return null;

    // Initialize turn order - shuffle players
    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
    room.turnOrder = shuffledPlayers.map(p => p.id);
    room.currentTurnIndex = 0;
    room.gameState = 'word-selection';
    room.currentDrawer = room.turnOrder[0];
    room.wordChoices = getRandomWords();
    room.canvas = [];

    return room;
  }

  selectWord(roomId: string, word: Word): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.selectedWord = word;
    room.currentWord = word;
    room.gameState = 'drawing';
    room.roundStartTime = Date.now();
    room.correctGuessers = [];

    return room;
  }

  addStroke(roomId: string, stroke: DrawingStroke): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.canvas.push(stroke);
    }
  }

  clearCanvas(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.canvas = [];
    }
  }

  submitGuess(roomId: string, playerId: string, guess: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentWord) return false;

    const isCorrect = guess.trim().toLowerCase() === room.currentWord.text.toLowerCase();

    if (isCorrect && !room.correctGuessers.includes(playerId)) {
      room.correctGuessers.push(playerId);
    }

    return isCorrect;
  }

  endRound(roomId: string, selectedGuessers: string[]): Room | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentWord) return null;

    // Award points to drawer if anyone guessed correctly
    if (selectedGuessers.length > 0 && room.currentDrawer) {
      room.scores[room.currentDrawer] = (room.scores[room.currentDrawer] || 0) + room.currentWord.points;
    }

    // Award points to correct guessers
    selectedGuessers.forEach(playerId => {
      if (room.currentWord) {
        room.scores[playerId] = (room.scores[playerId] || 0) + room.currentWord.points;
      }
    });

    // Update player scores
    room.players.forEach(player => {
      player.score = room.scores[player.id] || 0;
    });

    room.gameState = 'round-end';
    room.roundStartTime = null;

    return room;
  }

  nextRound(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.currentTurnIndex++;

    // Check if game should end (all players have drawn)
    if (room.currentTurnIndex >= room.turnOrder.length) {
      room.gameState = 'game-end';
      return room;
    }

    // Start next round
    room.currentDrawer = room.turnOrder[room.currentTurnIndex];
    room.gameState = 'word-selection';
    room.wordChoices = getRandomWords();
    room.currentWord = null;
    room.selectedWord = null;
    room.canvas = [];
    room.correctGuessers = [];

    return room;
  }

  getWinner(roomId: string): string | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
    return sortedPlayers[0]?.id || null;
  }
}

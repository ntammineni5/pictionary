import { RoomManager } from '../../server/RoomManager';
import { RoomType } from '../../types';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a new room with correct properties', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host Name');

      expect(room).toBeDefined();
      expect(room.name).toBe('Test Room');
      expect(room.type).toBe('public');
      expect(room.hostId).toBe('host-id');
      expect(room.players).toHaveLength(1);
      expect(room.players[0].name).toBe('Host Name');
      expect(room.players[0].isHost).toBe(true);
      expect(room.gameState).toBe('waiting');
    });

    it('should create unique room IDs for different rooms', () => {
      const room1 = roomManager.createRoom('Room 1', 'public', 'host-1', 'Host 1');
      const room2 = roomManager.createRoom('Room 2', 'public', 'host-2', 'Host 2');

      expect(room1.id).not.toBe(room2.id);
    });
  });

  describe('joinRoom', () => {
    it('should allow a player to join an existing room', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      const result = roomManager.joinRoom(room.id, 'player-id', 'Player Name');

      expect(result).toBeDefined();
      expect(result?.room.players).toHaveLength(2);
      expect(result?.player.name).toBe('Player Name');
      expect(result?.player.isHost).toBe(false);
    });

    it('should return null for non-existent room', () => {
      const result = roomManager.joinRoom('invalid-room-id', 'player-id', 'Player');

      expect(result).toBeNull();
    });

    it('should throw error when room is full', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');

      // Fill the room to max capacity
      for (let i = 0; i < 14; i++) {
        roomManager.joinRoom(room.id, `player-${i}`, `Player ${i}`);
      }

      // Try to join when full (max 15 players)
      expect(() => {
        roomManager.joinRoom(room.id, 'extra-player', 'Extra Player');
      }).toThrow('Room is full');
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');

      const result = roomManager.leaveRoom('player-id');

      expect(result).toBeDefined();
      expect(result?.room?.players).toHaveLength(1);
    });

    it('should reassign host when host leaves', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');

      const result = roomManager.leaveRoom('host-id');

      expect(result?.room?.hostId).toBe('player-id');
      expect(result?.room?.players[0].isHost).toBe(true);
    });

    it('should delete room when last player leaves', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');

      const result = roomManager.leaveRoom('host-id');

      expect(result?.room).toBeNull();
      expect(roomManager.getRoom(room.id)).toBeUndefined();
    });
  });

  describe('startGame', () => {
    it('should initialize game state correctly', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');

      const updatedRoom = roomManager.startGame(room.id);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.gameState).toBe('word-selection');
      expect(updatedRoom?.turnOrder).toHaveLength(2);
      expect(updatedRoom?.currentDrawer).toBeDefined();
      expect(updatedRoom?.wordChoices).toHaveLength(3);
    });

    it('should return null when less than 2 players', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');

      const updatedRoom = roomManager.startGame(room.id);

      expect(updatedRoom).toBeNull();
    });
  });

  describe('submitGuess', () => {
    it('should return true for correct guess', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');
      roomManager.startGame(room.id);

      const word = { text: 'cat', difficulty: 'easy' as const, points: 10 };
      roomManager.selectWord(room.id, word);

      const isCorrect = roomManager.submitGuess(room.id, 'player-id', 'cat');

      expect(isCorrect).toBe(true);
    });

    it('should be case insensitive', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');
      roomManager.startGame(room.id);

      const word = { text: 'cat', difficulty: 'easy' as const, points: 10 };
      roomManager.selectWord(room.id, word);

      const isCorrect = roomManager.submitGuess(room.id, 'player-id', 'CAT');

      expect(isCorrect).toBe(true);
    });

    it('should return false for incorrect guess', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');
      roomManager.startGame(room.id);

      const word = { text: 'cat', difficulty: 'easy' as const, points: 10 };
      roomManager.selectWord(room.id, word);

      const isCorrect = roomManager.submitGuess(room.id, 'player-id', 'dog');

      expect(isCorrect).toBe(false);
    });
  });

  describe('endRound', () => {
    it('should award points to drawer and correct guessers', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');
      roomManager.startGame(room.id);

      const word = { text: 'cat', difficulty: 'medium' as const, points: 50 };
      roomManager.selectWord(room.id, word);

      const updatedRoom = roomManager.endRound(room.id, ['player-id']);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.scores['host-id']).toBe(50); // Drawer gets points
      expect(updatedRoom?.scores['player-id']).toBe(50); // Guesser gets points
    });

    it('should not award points to drawer if no one guessed', () => {
      const room = roomManager.createRoom('Test Room', 'public', 'host-id', 'Host');
      roomManager.joinRoom(room.id, 'player-id', 'Player');
      roomManager.startGame(room.id);

      const word = { text: 'cat', difficulty: 'medium' as const, points: 50 };
      roomManager.selectWord(room.id, word);

      const updatedRoom = roomManager.endRound(room.id, []);

      expect(updatedRoom?.scores['host-id']).toBe(0);
    });
  });

  describe('getPublicRooms', () => {
    it('should only return public rooms', () => {
      roomManager.createRoom('Public Room', 'public', 'host-1', 'Host 1');
      roomManager.createRoom('Private Room', 'private', 'host-2', 'Host 2');

      const publicRooms = roomManager.getPublicRooms();

      expect(publicRooms).toHaveLength(1);
      expect(publicRooms[0].name).toBe('Public Room');
    });
  });
});

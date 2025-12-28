export type RoomType = 'public' | 'private';

export type GameState = 'waiting' | 'word-selection' | 'drawing' | 'round-end' | 'game-end';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Word {
  text: string;
  difficulty: Difficulty;
  points: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  connected: boolean;
}

export interface DrawingStroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  players: Player[];
  gameState: GameState;
  currentDrawer: string | null;
  currentWord: Word | null;
  selectedWord: Word | null;
  wordChoices: Word[];
  turnOrder: string[];
  currentTurnIndex: number;
  scores: Record<string, number>;
  roundTimer: number;
  roundStartTime: number | null;
  correctGuessers: string[];
  canvas: DrawingStroke[];
  hostId: string;
  maxPlayers: number;
  roundDuration: number;
}

export interface GuessResult {
  correct: boolean;
  playerId: string;
  playerName: string;
}

// Socket Events
export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; room: Room }) => void;
  'room:joined': (data: { room: Room; playerId: string }) => void;
  'room:updated': (room: Room) => void;
  'room:player-joined': (player: Player) => void;
  'room:player-left': (playerId: string) => void;
  'game:started': (room: Room) => void;
  'game:word-selection': (data: { wordChoices: Word[] }) => void;
  'game:word-selected': (data: { hasWord: boolean }) => void;
  'game:round-start': (data: { drawer: string; word?: string; timer: number }) => void;
  'game:timer-update': (seconds: number) => void;
  'game:timer-stopped': () => void;
  'drawing:stroke': (stroke: DrawingStroke) => void;
  'drawing:clear': () => void;
  'guess:result': (result: GuessResult) => void;
  'guess:correct': (data: { playerId: string; playerName: string }) => void;
  'game:round-end': (data: { word: string; scores: Record<string, number> }) => void;
  'game:end': (data: { finalScores: Record<string, number>; winner: string }) => void;
  'error': (message: string) => void;
  'rooms:list': (rooms: Array<{ id: string; name: string; playerCount: number; gameState: GameState }>) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { roomName: string; roomType: RoomType; playerName: string }) => void;
  'room:join': (data: { roomId: string; playerName: string }) => void;
  'room:leave': () => void;
  'rooms:fetch': () => void;
  'game:start': () => void;
  'game:select-word': (word: Word) => void;
  'game:stop-timer': (correctGuessers: string[]) => void;
  'drawing:stroke': (stroke: DrawingStroke) => void;
  'drawing:clear': () => void;
  'guess:submit': (guess: string) => void;
}

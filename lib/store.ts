import { create } from 'zustand';
import { Room, Player } from '../types';

interface GameStore {
  room: Room | null;
  playerId: string | null;
  playerName: string | null;
  setRoom: (room: Room) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  playerId: null,
  playerName: null,
  setRoom: (room) => set({ room }),
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  reset: () => set({ room: null, playerId: null, playerName: null }),
}));

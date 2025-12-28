import { create } from 'zustand';
import { Room, Player } from '../types';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

// Helper functions for theme management
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
};

const getSystemTheme = (): EffectiveTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getEffectiveTheme = (theme: Theme): EffectiveTheme => {
  return theme === 'system' ? getSystemTheme() : theme;
};

interface GameStore {
  room: Room | null;
  playerId: string | null;
  playerName: string | null;
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setRoom: (room: Room) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setTheme: (theme: Theme) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  playerId: null,
  playerName: null,
  theme: getStoredTheme(),
  effectiveTheme: getEffectiveTheme(getStoredTheme()),
  setRoom: (room) => set({ room }),
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    set({
      theme,
      effectiveTheme: getEffectiveTheme(theme)
    });
  },
  reset: () => set({ room: null, playerId: null, playerName: null }),
}));

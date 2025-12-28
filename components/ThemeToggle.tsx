'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';

export default function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useGameStore();
  const [mounted, setMounted] = useState(false);

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
      useGameStore.setState({ effectiveTheme: newSystemTheme });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  // Don't render until mounted on client to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={cycleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-lg"
      aria-label="Toggle theme"
      title={`Current: ${theme} (${effectiveTheme})`}
    >
      <span className="flex items-center gap-1">
        {effectiveTheme === 'dark' ? '🌙' : '☀️'}
        {theme === 'system' && <span className="text-xs">⚙️</span>}
      </span>
    </button>
  );
}

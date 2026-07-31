'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'medifind-theme';

export default function ThemeToggle({ className = '' }) {
  // Starts null so the very first client render matches the server render
  // (no theme-dependent icon) - the actual class was already applied
  // synchronously by the inline script in layout.js, this just syncs the
  // toggle's own displayed state to it.
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private browsing, disabled cookies) -
      // the toggle still works for this session, it just won't persist.
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex items-center justify-center h-9 w-9 rounded-full border border-pine-soft text-ink-soft hover:text-pine hover:bg-ivory-dim transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme && (
          <motion.span
            key={theme}
            initial={{ rotate: -80, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 80, opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4" aria-hidden="true" />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

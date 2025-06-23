import React, { useState, useEffect, useCallback } from 'react';

export const ThemeToggleButton: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Initialize state based on localStorage or system preference.
    // This should align with what the inline script in index.html's head does.
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark for SSR or if window is undefined initially
  });

  // Effect to apply/remove 'dark' class on <html> based on isDarkMode state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prevMode => {
      const newModeIsDark = !prevMode;
      // Update localStorage when theme is explicitly toggled
      if (newModeIsDark) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
      return newModeIsDark;
    });
  }, []);

  // Add keydown listener for accessibility (Enter/Space to toggle)
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTheme();
    }
  }, [toggleTheme]);

  return (
    <div
      id="theme-toggle-button-container"
      className={!isDarkMode ? 'light-theme-active' : ''} // This class styles the bulb itself
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDarkMode ? 'Activate light mode' : 'Activate dark mode'}
      role="button"
      tabIndex={0}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
    >
      <div className="bulb" aria-hidden="true">
        <span></span>
        <span></span>
      </div>
    </div>
  );
};
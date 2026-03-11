import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <span className={`theme-toggle-text ${!isDark ? 'active' : ''}`}>LIGHT</span>
      <span className="theme-toggle-switch" aria-hidden="true">
        <span className="theme-toggle-thumb">
          <span className="theme-toggle-glyph">{isDark ? '◐' : '☼'}</span>
        </span>
      </span>
      <span className={`theme-toggle-text ${isDark ? 'active' : ''}`}>DARK</span>
    </button>
  );
};

export default ThemeToggle;

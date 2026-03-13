import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isDark ? 'is-dark' : 'is-light'} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <span className="theme-toggle-label">THEME</span>
      <span className="theme-toggle-switch" aria-hidden="true">
        <span className="theme-toggle-glyph theme-toggle-glyph-light">☼</span>
        <span className="theme-toggle-thumb">
          <span className="theme-toggle-thumb-mark">{isDark ? '◐' : '☼'}</span>
        </span>
        <span className="theme-toggle-glyph theme-toggle-glyph-dark">◐</span>
      </span>
    </button>
  );
};

export default ThemeToggle;

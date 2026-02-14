import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="rounded-lg p-2 text-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

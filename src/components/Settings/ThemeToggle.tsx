import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center text-2xl hover:bg-bg-secondary hover:border-accent transition-colors border border-transparent"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

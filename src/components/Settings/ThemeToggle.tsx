import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-secondary text-base text-text-secondary transition-all hover:border-accent hover:text-accent cursor-pointer"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

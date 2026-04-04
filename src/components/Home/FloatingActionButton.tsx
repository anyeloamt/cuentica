interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
}

export function FloatingActionButton({
  onClick,
  label,
}: FloatingActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="fixed bottom-6 right-6 h-12 bg-accent text-white rounded-full shadow-lg shadow-accent/20 flex items-center gap-2 px-5 hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/50 active:scale-95 transition-all z-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

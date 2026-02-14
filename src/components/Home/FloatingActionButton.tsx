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
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 transition-transform z-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}

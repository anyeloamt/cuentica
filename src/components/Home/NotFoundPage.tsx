import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  const [seconds, setSeconds] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Page not found — Cuentica';
    return () => {
      document.title = 'Cuentica';
    };
  }, []);

  useEffect(() => {
    if (seconds === 0) {
      navigate('/', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
      <svg
        className="h-16 w-16 text-text-muted mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
      <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-text-secondary mb-4">
        Hmm, this page doesn&apos;t exist. Redirecting you home...
      </p>
      <p className="text-text-muted text-sm mb-8">Redirecting in {seconds}...</p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm"
      >
        Go home
      </Link>
    </div>
  );
}

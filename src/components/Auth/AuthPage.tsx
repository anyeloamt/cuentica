import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import { GoogleIcon } from './GoogleIcon';

export function AuthPage(): JSX.Element {
  const { user, loading, isConfigured, signInWithGoogle, signInWithEmail, signOut } =
    useAuth();
  const [email, setEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (loading) return <div className="p-4 text-center text-text-primary">Loading...</div>;

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h2 className="text-xl font-medium mb-4 text-text-primary">Auth not available</h2>
        <p className="text-text-secondary mb-6">
          Sign-in is not configured. The app works fully offline.
        </p>
        <Link to="/" className="text-accent hover:underline">
          ← Back to app
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h2 className="text-xl font-medium mb-4 text-text-primary">
          You&apos;re signed in
        </h2>
        <p className="text-text-secondary mb-6">
          Signed in as <span className="text-text-primary font-medium">{user.email}</span>
        </p>
        <button
          onClick={() => signOut()}
          className="bg-bg-secondary border border-border px-4 py-2 rounded-lg mb-8 hover:bg-opacity-80 transition-colors cursor-pointer"
        >
          Sign out
        </button>
        <Link to="/" className="text-accent hover:underline">
          ← Back to app
        </Link>
      </div>
    );
  }

  const handleGoogleSignIn = async (): Promise<void> => {
    const { ok, error } = await signInWithGoogle();
    if (!ok) {
      setMessage({ type: 'error', text: error ?? 'Failed to sign in with Google' });
    }
  };

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setMagicLinkLoading(true);
    setMessage(null);

    const { ok, error } = await signInWithEmail(email);

    if (ok) {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
      setEmail('');
    } else {
      setMessage({ type: 'error', text: error || 'Failed to send magic link' });
    }

    setMagicLinkLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 pt-12">
      <Link
        to="/"
        className="text-text-secondary text-sm hover:text-text-primary mb-8 block"
      >
        ← Back to app
      </Link>

      <h1 className="text-2xl font-bold mb-2">Sign in to Cuentica</h1>
      <p className="text-text-secondary mb-8">
        Sync your wallets and budget data across all your devices.
      </p>

      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-bg-secondary text-text-primary border border-border rounded-lg p-3 font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-bg-primary text-text-secondary">or</span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-bg-secondary border border-border rounded-lg p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={magicLinkLoading}
          className="w-full bg-accent text-white rounded-lg p-3 font-medium hover:bg-opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {magicLinkLoading ? 'Sending...' : 'Send magic link'}
        </button>
      </form>

      {message && (
        <div
          className={`mt-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

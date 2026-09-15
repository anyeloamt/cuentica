import { act, render, screen, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

const authMocks = vi.hoisted(() => {
  const ownerResolvers = new Map<string, () => void>();
  let authStateHandler: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;

  return {
    ownerResolvers,
    prepareLocalUser: vi.fn(
      (userId: string): Promise<{ userId: string; generation: number }> =>
        new Promise((resolve) => {
          ownerResolvers.set(userId, () => resolve({ userId, generation: 1 }));
        })
    ),
    getSession: vi.fn<[], Promise<{ data: { session: Session | null } }>>(),
    getAuthStateHandler: () => authStateHandler,
    setAuthStateHandler: (
      handler: (event: AuthChangeEvent, session: Session | null) => void
    ): void => {
      authStateHandler = handler;
    },
  };
});

vi.mock('../lib/db', () => ({
  prepareLocalUser: authMocks.prepareLocalUser,
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: (
        handler: (event: AuthChangeEvent, session: Session | null) => void
      ) => {
        authMocks.setAuthStateHandler(handler);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  },
}));

const createSession = (userId: string): Session =>
  ({ user: { id: userId } }) as Session;

const createDeferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

function AuthProbe(): JSX.Element {
  const { user, loading } = useAuth();
  return <span>{loading ? 'loading' : (user?.id ?? 'guest')}</span>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    authMocks.ownerResolvers.clear();
    authMocks.prepareLocalUser.mockClear();
    authMocks.getSession.mockReset().mockResolvedValue({ data: { session: null } });
  });

  it('serializes ownership preparation and ignores a superseded session', async () => {
    const renderedUsers: string[] = [];

    function RecordingProbe(): JSX.Element {
      const { user, loading } = useAuth();
      renderedUsers.push(loading ? 'loading' : (user?.id ?? 'guest'));
      return <AuthProbe />;
    }

    render(
      <AuthProvider>
        <RecordingProbe />
      </AuthProvider>
    );

    await screen.findByText('guest');
    const handler = authMocks.getAuthStateHandler();
    expect(handler).not.toBeNull();

    act(() => {
      handler?.('SIGNED_IN', createSession('user-a'));
    });
    await waitFor(() => expect(authMocks.prepareLocalUser).toHaveBeenCalledWith('user-a'));

    act(() => {
      handler?.('SIGNED_IN', createSession('user-b'));
    });
    expect(authMocks.prepareLocalUser).not.toHaveBeenCalledWith('user-b');

    act(() => {
      authMocks.ownerResolvers.get('user-a')?.();
    });
    await waitFor(() => expect(authMocks.prepareLocalUser).toHaveBeenCalledWith('user-b'));

    act(() => {
      authMocks.ownerResolvers.get('user-b')?.();
    });
    await screen.findByText('user-b');

    expect(renderedUsers).not.toContain('user-a');
  });

  it('ignores a stale initial session response after a newer auth event', async () => {
    const initialSession = createDeferred<{ data: { session: Session | null } }>();
    authMocks.getSession.mockReturnValue(initialSession.promise);
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    await waitFor(() => expect(authMocks.getAuthStateHandler()).not.toBeNull());

    act(() => {
      authMocks.getAuthStateHandler()?.('SIGNED_IN', createSession('user-b'));
    });
    await waitFor(() => expect(authMocks.prepareLocalUser).toHaveBeenCalledWith('user-b'));
    act(() => {
      authMocks.ownerResolvers.get('user-b')?.();
    });
    await screen.findByText('user-b');

    await act(async () => {
      initialSession.resolve({ data: { session: createSession('user-a') } });
      await initialSession.promise;
      await Promise.resolve();
    });
    expect(authMocks.prepareLocalUser).not.toHaveBeenCalledWith('user-a');
    expect(screen.getByText('user-b')).toBeInTheDocument();
  });
});

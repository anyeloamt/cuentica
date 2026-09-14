import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { prepareLocalUser } from '../lib/db';

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithEmail: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const applySession = async (session: Session | null): Promise<void> => {
      const nextUser = session?.user ?? null;

      if (nextUser) {
        setUser(null);
        await prepareLocalUser(nextUser.id);
      }

      if (isMounted) {
        setUser(nextUser);
        setLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        void applySession(session);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signInWithEmail = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured(),
        signInWithGoogle,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

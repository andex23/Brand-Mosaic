import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, ProfileRecord } from '../lib/supabase';

interface SignUpInput {
  email: string;
  password: string;
  fullName?: string;
}

interface SignInInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: ProfileRecord | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const upsertProfile = async (user: User): Promise<ProfileRecord | null> => {
  if (!supabase) return null;

  const payload = {
    id: user.id,
    email: user.email || '',
    full_name:
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
        ? user.user_metadata.full_name.trim()
        : null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to sync profile:', error);
    return null;
  }

  return data as ProfileRecord;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    const synced = await upsertProfile(user);
    setProfile(synced);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let activeUserId: string | null = null;

    const finishLoading = () => {
      if (isMounted) {
        setLoading(false);
      }
    };

    const syncProfileForUser = async (nextUser: User | null) => {
      if (!nextUser) {
        if (isMounted) {
          setProfile(null);
        }
        return;
      }

      try {
        const synced = await upsertProfile(nextUser);
        if (isMounted && activeUserId === nextUser.id) {
          setProfile(synced);
        }
      } catch (error) {
        console.error('Failed to refresh profile:', error);
        if (isMounted && activeUserId === nextUser.id) {
          setProfile(null);
        }
      }
    };

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;

      activeUserId = nextSession?.user?.id ?? null;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
      } else {
        void syncProfileForUser(nextSession.user);
      }

      finishLoading();
    };

    const bootstrapTimeout = window.setTimeout(() => {
      console.error('Auth bootstrap timed out. Falling back to the signed-out shell.');
      applySession(null);
    }, 5000);

    const bootstrapAuth = async () => {
      try {
        const {
          data: { session: activeSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        applySession(activeSession);
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        applySession(null);
      } finally {
        window.clearTimeout(bootstrapTimeout);
      }
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(bootstrapTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, fullName }: SignUpInput) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signIn = async ({ email, password }: SignInInput) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: Boolean(supabase),
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};

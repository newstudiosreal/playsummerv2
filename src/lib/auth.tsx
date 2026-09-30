import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
// Niente email obbligatoria: lo username diventa un'email tecnica interna.
const toEmail = (u: string) => `${u.trim().toLowerCase()}@users.playsummer.app`;

interface AuthCtx {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Ritornano null se ok, altrimenti il messaggio d'errore da mostrare. */
  signIn: (u: string, p: string) => Promise<string | null>;
  signUp: (u: string, p: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('id,username,avatar,bio').eq('id', uid).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      // setTimeout: Supabase sconsiglia di fare query direttamente dentro questa callback
      if (s) setTimeout(() => void loadProfile(s.user.id), 0);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    loading, session, profile,
    signIn: async (u, p) => {
      const { error } = await supabase.auth.signInWithPassword({ email: toEmail(u), password: p });
      return error ? 'Username o password sbagliati.' : null;
    },
    signUp: async (u, p) => {
      if (!USERNAME_RE.test(u)) return 'Username: da 3 a 20 caratteri, solo lettere, numeri e _';
      if (p.length < 8) return 'La password deve avere almeno 8 caratteri.';
      const { data, error } = await supabase.auth.signUp({
        email: toEmail(u), password: p, options: { data: { username: u } },
      });
      if (error) return /registered|Database error/i.test(error.message)
        ? 'Questo username è già preso.' : 'Registrazione non riuscita. Riprova tra poco.';
      if (!data.session) return 'Account creato, ma su Supabase devi disattivare "Confirm email" (vedi README).';
      return null;
    },
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile: async () => { if (session) await loadProfile(session.user.id); },
  }), [loading, session, profile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fuori da AuthProvider');
  return c;
}

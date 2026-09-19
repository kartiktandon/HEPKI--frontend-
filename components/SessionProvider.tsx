'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ErrorNotice } from './ApiState';
import { api, errorMessage } from '@/lib/api/client';
import { record, unwrap, type RecordData } from '@/lib/api/models';
type Session = { loading: boolean; user: RecordData | null; provider: boolean; error: string; reload: () => Promise<void>; logout: () => Promise<void> };
const Context = createContext<Session>({ loading: true, user: null, provider: false, error: '', reload: async () => {}, logout: async () => {} });
export const useSession = () => useContext(Context);
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RecordData | null>(null);
  const [provider, setProvider] = useState(false);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to check your session.');
      const session = await response.json();
      setProvider(session.provider === true);
      if (session.user) {
        const payload = record(unwrap(await api('/api/v1/user/profile', { role: 'user' })));
        setUser(record(payload.user ?? payload));
      } else setUser(null);
    } catch (e) { setUser(null); setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); const changed = () => { void reload(); }; window.addEventListener('session-changed', changed); return () => window.removeEventListener('session-changed', changed); }, [reload]);
  const logout = async () => {
    try { await api('/auth/user/logout', { method: 'POST', body: {} }); }
    finally { await reload(); }
  };
  return <Context.Provider value={{ loading, user, provider, error, reload, logout }}>{error && <div className="container"><ErrorNotice message={error} retry={reload}/></div>}{children}</Context.Provider>;
}

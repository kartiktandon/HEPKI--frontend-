'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from './client';
export function useResource(path: string | null, role?: 'user' | 'provider', pollMs = 0) {
  const [data, setData] = useState<unknown>(null); const [loading, setLoading] = useState(!!path); const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    if (!path) { setData(null); setLoading(false); setError(''); return; }
    let active = true; let running = false; const controller = new AbortController();
    setLoading(true); setData(null); setError('');
    async function load() {
      if (running || !active) return; running = true;
      try { const value = await api(path!, { role, signal: controller.signal }); if (active) { setData(value); setError(''); } }
      catch (e) { if (active) setError(errorMessage(e)); }
      finally { running = false; if (active) setLoading(false); }
    }
    void load();
    const timer = pollMs ? setInterval(() => { if (document.visibilityState === 'visible') void load(); }, pollMs) : undefined;
    const focus = () => { void load(); };
    if (pollMs) window.addEventListener('focus', focus);
    return () => { active = false; controller.abort(); clearInterval(timer); if (pollMs) window.removeEventListener('focus', focus); };
  }, [path, role, version, pollMs]);
  return { data, loading, error, reload };
}

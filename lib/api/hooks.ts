'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './client';
export type InitialResource = { path: string; data: unknown };

export function useResource(path: string | null, role?: 'user' | 'provider', pollMs = 0, initial?: InitialResource) {
  const seed = useRef(initial);
  const seeded = initial !== undefined && initial.path === path;
  const [data, setData] = useState<unknown>(seeded ? initial.data : null);
  const [loading, setLoading] = useState(!!path && !seeded);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    if (path !== seed.current?.path || version > 0) seed.current = undefined;
    if (!path) { setData(null); setLoading(false); setError(''); return; }
    let active = true;
    let running = false;
    const controller = new AbortController();
    async function load() {
      if (running || !active) return;
      running = true;
      try {
        const value = await api(path!, { role, signal: controller.signal });
        if (active) { setData(value); setError(''); }
      } catch (e) { if (active) setError(errorMessage(e)); }
      finally { running = false; if (active) setLoading(false); }
    }
    if (!seed.current) { setLoading(true); setData(null); setError(''); void load(); }
    const timer = pollMs ? setInterval(() => { if (document.visibilityState === 'visible') void load(); }, pollMs) : undefined;
    const focus = () => { void load(); };
    if (pollMs) window.addEventListener('focus', focus);
    return () => { active = false; controller.abort(); clearInterval(timer); if (pollMs) window.removeEventListener('focus', focus); };
  }, [path, role, version, pollMs]);
  return { data, loading, error, reload };
}

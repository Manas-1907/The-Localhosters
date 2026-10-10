import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';
import { db } from '../lib/db';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const cache = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => (v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k)),
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyProfile = useCallback((d) => {
    setProfile(d.profile);
    setProgress(d.progress);
    cache.set('mama_profile', d);
  }, []);

  const loadProfile = useCallback(async () => applyProfile(await api('/profile')), [applyProfile]);

  // Restore the session. If the network is down, fall back to the cached copy so the app still opens offline.
  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { user: u } = await api('/auth/me');
          setUser(u);
          cache.set('mama_user', u);
          if (u.role === 'mother') await loadProfile();
        } catch (e) {
          if (e.offline) {
            setUser(cache.get('mama_user'));
            const p = cache.get('mama_profile');
            if (p) { setProfile(p.profile); setProgress(p.progress); }
          } else {
            setToken(null);
            cache.set('mama_user', null);
            cache.set('mama_profile', null);
          }
        }
      }
      setLoading(false);
    })();
  }, [loadProfile]);

  const authenticate = async (path, body) => {
    const d = await api(path, { method: 'POST', body });
    setToken(d.token);
    setUser(d.user);
    cache.set('mama_user', d.user);
    if (d.user.role === 'mother') await loadProfile();
    return d.user;
  };

  const saveProfile = async (body) => applyProfile(await api('/profile', { method: 'PUT', body }));

  const logout = () => {
    db.logs.clear(); // do not leave health data on a shared device
    setToken(null);
    cache.set('mama_user', null);
    cache.set('mama_profile', null);
    setUser(null);
    setProfile(null);
    setProgress(null);
  };

  return (
    <Ctx.Provider value={{ user, profile, progress, loading, authenticate, saveProfile, logout }}>{children}</Ctx.Provider>
  );
}

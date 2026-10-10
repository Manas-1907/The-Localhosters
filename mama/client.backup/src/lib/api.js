export const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const getToken = () => localStorage.getItem('mama_token');
export const setToken = (t) => (t ? localStorage.setItem('mama_token', t) : localStorage.removeItem('mama_token'));

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const e = new Error('offline');
    e.offline = true;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error || 'Request failed');
    e.status = res.status;
    e.details = data.details;
    throw e;
  }
  return data;
}

import { api, getToken } from './api';
import { db } from './db';
import { transcribe } from './voice';

let running = false;

// Pushes unsynced logs, then pulls the server copy. Safe to call any time; it quietly does nothing offline.
export async function syncLogs() {
  if (running || !navigator.onLine || !getToken()) return;
  running = true;
  try {
    for (let i = 0; i < 10; i++) {
      let pending = await db.logs.where('synced').equals(0).limit(25).toArray();
      if (!pending.length) break;
      // Voice notes recorded offline: convert to text first. If that fails they stay queued for the next sync.
      for (const l of pending.filter((x) => x.pendingAudio)) {
        try {
          const text = await transcribe(l.pendingAudio);
          await db.logs.update(l.clientId, { note: [l.note, text].filter(Boolean).join('\n') || undefined, pendingAudio: undefined });
          l.note = [l.note, text].filter(Boolean).join('\n') || undefined;
          l.pendingAudio = undefined;
        } catch (err) {
          if (err.offline) return;
        }
      }
      pending = pending.filter((x) => !x.pendingAudio);
      if (!pending.length) break;
      const entries = pending.map(({ clientId, loggedAt, symptoms, mood, vitals, note, source }) => ({ clientId, loggedAt, symptoms, mood, vitals, note, source }));
      const { results } = await api('/logs/sync', { method: 'POST', body: { entries } });
      let progressed = false;
      for (const r of results) {
        if (r.ok) {
          await db.logs.update(r.clientId, { synced: 1, symptoms: r.symptoms, flags: r.flags, summary: r.summary });
          progressed = true;
        } else if (r.clientId) {
          await db.logs.update(r.clientId, { synced: 2, syncError: r.error }); // rejected by the server; stop retrying
        }
      }
      if (!progressed) break;
    }
    const { logs } = await api('/logs');
    await db.logs.bulkPut(logs.map((l) => ({ ...l, synced: 1 })));
  } catch (err) {
    if (!err.offline) console.warn('Sync failed:', err.message);
  } finally {
    running = false;
  }
}

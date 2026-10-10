import Dexie from 'dexie';

// Offline-first store. `synced` is 0/1 (IndexedDB cannot index booleans).
export const db = new Dexie('mama');
db.version(1).stores({ logs: '&clientId, loggedAt, synced' });

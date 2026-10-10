import { BASE, getToken } from './api';

// Sends recorded audio to the server for speech-to-text. Resolves with the transcript.
export async function transcribe(blob) {
  let res;
  try {
    res = await fetch(`${BASE}/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm', Authorization: `Bearer ${getToken()}` },
      body: blob,
    });
  } catch {
    const e = new Error('offline');
    e.offline = true;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Voice failed');
  return data.text || '';
}

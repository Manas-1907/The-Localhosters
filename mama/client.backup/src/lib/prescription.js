import { BASE, getToken } from './api';

// Shrinks the photo on the device first: faster upload on weak networks, and nothing larger than needed leaves the phone.
export async function compressImage(file, max = 1600, quality = 0.82) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function scanPrescription(blob) {
  let res;
  try {
    res = await fetch(`${BASE}/prescriptions/scan`, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg', Authorization: `Bearer ${getToken()}` }, body: blob });
  } catch {
    const e = new Error('offline');
    e.offline = true;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Scan failed');
  return data;
}

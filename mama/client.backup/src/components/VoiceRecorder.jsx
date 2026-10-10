import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { transcribe } from '../lib/voice';

const MAX_SECONDS = 60;
const pickMime = () => ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m));

// onText(text): transcript ready (the mother can edit it). onQueued(blob): no connection, keep audio for later.
export default function VoiceRecorder({ onText, onQueued }) {
  const { t } = useTranslation();
  const [state, setState] = useState('idle'); // idle | recording | busy
  const [secs, setSecs] = useState(0);
  const [msg, setMsg] = useState('');
  const recorder = useRef(null);
  const tick = useRef(null);
  const limit = useRef(null);

  const supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  useEffect(() => () => { clearInterval(tick.current); clearTimeout(limit.current); recorder.current?.stream?.getTracks().forEach((x) => x.stop()); }, []);
  if (!supported) return <p className="text-sm text-soft">{t('voiceUnsupported')}</p>;

  const handle = async (blob) => {
    if (!navigator.onLine) { onQueued(blob); setMsg(t('voiceQueued')); setState('idle'); return; }
    setState('busy');
    try {
      const text = await transcribe(blob);
      if (text) onText(text); else setMsg(t('voiceEmpty'));
    } catch (err) {
      if (err.offline) { onQueued(blob); setMsg(t('voiceQueued')); } else setMsg(t('voiceFailed'));
    }
    setState('idle');
  };

  const start = async () => {
    setMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMime();
      const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((x) => x.stop());
        clearInterval(tick.current); clearTimeout(limit.current);
        handle(new Blob(chunks, { type: r.mimeType || mimeType || 'audio/webm' }));
      };
      r.start();
      recorder.current = r;
      setSecs(0);
      setState('recording');
      tick.current = setInterval(() => setSecs((s) => s + 1), 1000);
      limit.current = setTimeout(() => r.state === 'recording' && r.stop(), MAX_SECONDS * 1000);
    } catch {
      setMsg(t('micDenied'));
    }
  };

  const stop = () => recorder.current?.state === 'recording' && recorder.current.stop();

  return (
    <div>
      <div className="flex items-center gap-3">
        {state === 'recording' ? (
          <button type="button" className="btn bg-ink hover:bg-ink/90" onClick={stop}>{t('recStop')} · {secs}s</button>
        ) : (
          <button type="button" className="btn-quiet py-3" onClick={start} disabled={state === 'busy'}>{t('rec')}</button>
        )}
        {state === 'recording' && <span className="flex items-center gap-2 text-sm font-semibold text-petal-dark"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-petal" />{t('recording')}</span>}
        {state === 'busy' && <span className="text-sm text-soft" role="status">{t('transcribing')}</span>}
      </div>
      {msg && <p role="status" className="mt-2 text-sm font-semibold text-petal-dark">{msg}</p>}
      <p className="mt-2 text-xs text-soft">{t('voicePrivacy')}</p>
    </div>
  );
}

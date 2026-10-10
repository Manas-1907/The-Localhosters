import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { enablePush, pushState, sendTestPush } from '../lib/push';

export default function PushCard() {
  const { t } = useTranslation();
  const [state, setState] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [daily, setDaily] = useState(true);

  useEffect(() => { pushState().then(setState); }, []);
  useEffect(() => { if (state === 'enabled') api('/push/prefs').then((d) => setDaily(d.dailyReminder)).catch(() => {}); }, [state]);
  const toggleDaily = async (e) => { const v = e.target.checked; setDaily(v); api('/push/prefs', { method: 'PATCH', body: { dailyReminder: v } }).catch(() => setDaily(!v)); };
  if (!state) return null;

  const turnOn = async () => {
    setBusy(true); setMsg('');
    try { setState(await enablePush()); } catch (e) { setMsg(e.offline ? t('offline') : t('pushFailed')); }
    setBusy(false);
  };
  const test = async () => {
    setBusy(true);
    try { const { sent } = await sendTestPush(); setMsg(sent ? t('pushSent') : t('pushNone')); } catch { setMsg(t('pushFailed')); }
    setBusy(false);
  };

  return (
    <section className="mt-5 rounded-2xl border border-line bg-white p-4">
      <h2 className="font-bold">{t('pushTitle')}</h2>
      {state === 'unsupported' && <p className="mt-1 text-sm text-soft">{t('pushUnsupported')}</p>}
      {state === 'denied' && <p className="mt-1 text-sm text-soft">{t('pushDenied')}</p>}
      {state === 'off' && <button className="btn mt-3 w-full" onClick={turnOn} disabled={busy}>{t('pushOn')}</button>}
      {state === 'enabled' && (
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-leaf">{t('pushEnabled')}</p>
          <button className="btn-quiet" onClick={test} disabled={busy}>{t('pushTest')}</button>
        </div>
      )}
      {state === 'enabled' && (
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-leaf" checked={daily} onChange={toggleDaily} />{t('dailyRemind')}</label>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-soft">{msg}</p>}
    </section>
  );
}

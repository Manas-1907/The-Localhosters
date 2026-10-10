import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import SummaryView from '../components/SummaryView';
import { api } from '../lib/api';

const OPTIONS = [['vitals', 'inclVitals'], ['medicines', 'inclMeds'], ['symptoms', 'inclSymptoms'], ['mood', 'inclMood'], ['notes', 'inclNotes']];

export default function Share() {
  const { t, i18n } = useTranslation();
  const [include, setInclude] = useState({ vitals: true, medicines: true, symptoms: true, mood: false, notes: false });
  const [days, setDays] = useState(3);
  const [preview, setPreview] = useState(null);
  const [created, setCreated] = useState(null);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadLinks = useCallback(() => api('/handoff').then((d) => setLinks(d.links)).catch(() => {}), []);
  useEffect(() => { loadLinks(); }, [loadLinks]);

  const fail = (e) => setError(e.offline ? t('offline') : e.details?.join(', ') || e.message);
  const toggle = (k) => { setInclude({ ...include, [k]: !include[k] }); setPreview(null); setCreated(null); };
  const none = !Object.values(include).some(Boolean);

  const doPreview = async () => { setBusy(true); setError(''); try { setPreview((await api('/handoff/preview', { method: 'POST', body: { include } })).summary); } catch (e) { fail(e); } setBusy(false); };
  const create = async () => { setBusy(true); setError(''); try { setCreated((await api('/handoff', { method: 'POST', body: { include, days } })).link); setCopied(false); loadLinks(); } catch (e) { fail(e); } setBusy(false); };
  const revoke = async (id) => { await api(`/handoff/${id}`, { method: 'DELETE' }).catch(() => {}); if (created?.id === id) setCreated(null); loadLinks(); };
  const locale = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
  const fmt = (d) => new Date(d).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const copy = async (url) => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { window.prompt(t('copyLink'), url); } };
  const wa = (l) => `https://wa.me/?text=${encodeURIComponent(t('shareMsg', { date: fmt(l.expiresAt), link: l.url }))}`;

  return (
    <Layout>
      <h1 className="mt-2 text-2xl font-bold">{t('shareTitle')}</h1>
      <p className="mt-2 text-sm text-soft">{t('shareLead')}</p>

      <fieldset className="mt-5 space-y-2">
        <legend className="label">{t('shareWhat')}</legend>
        {OPTIONS.map(([k, label]) => (
          <label key={k} className="flex items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-leaf" checked={include[k]} onChange={() => toggle(k)} />{t(label)}
          </label>
        ))}
      </fieldset>

      <div className="mt-4">
        <label className="label" htmlFor="valid">{t('validFor')}</label>
        <select id="valid" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={1}>{t('days1')}</option><option value={3}>{t('days3')}</option><option value={7}>{t('days7')}</option>
        </select>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
      <div className="mt-5 flex gap-3">
        <button className="btn-quiet flex-1 py-3" onClick={doPreview} disabled={busy || none}>{t('previewBtn')}</button>
        <button className="btn flex-1" onClick={create} disabled={busy || none}>{t('createLink')}</button>
      </div>

      {created && (
        <section className="mt-5 rounded-2xl border border-leaf bg-leaf/10 p-4" role="status">
          <h2 className="font-bold">{t('linkReady')}</h2>
          <p className="mt-1 break-all text-sm">{created.url}</p>
          <p className="mt-2 text-sm font-semibold">{t('linkWarn')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-quiet" onClick={() => copy(created.url)}>{copied ? t('copied') : t('copyLink')}</button>
            <a className="btn-quiet" href={wa(created)} target="_blank" rel="noreferrer">{t('shareWhatsApp')}</a>
            <a className="btn-quiet" href={created.url} target="_blank" rel="noreferrer">{t('openLink')}</a>
          </div>
        </section>
      )}

      {preview && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-soft">{t('previewTitle')}</h2>
          <div className="rounded-2xl border border-line bg-white p-4"><SummaryView summary={preview} /></div>
        </section>
      )}

      {links.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-soft">{t('yourLinks')}</h2>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">{l.active ? `${t('expires')} ${fmt(l.expiresAt)}` : l.revoked ? t('cancelled') : t('expired')}</p>
                  <p className="text-soft">{t('openedTimes', { n: l.openedCount })}{l.lastOpenedAt ? ` · ${fmt(l.lastOpenedAt)}` : ''}</p>
                </div>
                {l.active && <button className="font-semibold text-petal-dark underline" onClick={() => revoke(l.id)}>{t('cancelLink')}</button>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}

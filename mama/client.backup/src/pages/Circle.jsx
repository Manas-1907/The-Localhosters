import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const empty = { name: '', relation: '', email: '', phone: '', language: 'en', consent: false };

export default function Circle() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(empty);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    try { setData(await api('/circle')); } catch (e) { setError(e.offline ? t('offline') : e.message); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    try {
      const { emailStatus } = await api('/circle', { method: 'POST', body: { ...f, email: f.email || undefined, phone: f.phone || undefined, relation: f.relation || undefined } });
      setInfo(emailStatus === 'sent' ? t('emailSent') : emailStatus === 'no_email' ? '' : t('emailNotSent'));
      setF(empty); setAdding(false); load();
    } catch (err) { setError(err.offline ? t('offline') : err.details?.join(', ') || err.message); }
    setBusy(false);
  };
  const remove = async (id) => { if (window.confirm(t('confirmDelete'))) { await api(`/circle/${id}`, { method: 'DELETE' }).catch(() => {}); load(); } };
  const copy = async (link) => { try { await navigator.clipboard.writeText(link); setCopied(link); } catch { window.prompt(t('copyLink'), link); } };
  const wa = (m) => `https://wa.me/?text=${encodeURIComponent(t('inviteMsg', { name: m.name, link: m.inviteLink }))}`;
  const fmt = (d) => new Date(d).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Layout>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('circleTitle')}</h1>
        {!adding && <button className="btn-quiet" onClick={() => setAdding(true)}>{t('addPerson')}</button>}
      </div>
      <p className="mt-2 text-sm text-soft">{t('circleLead')}</p>
      {info && <p role="status" className="mt-3 text-sm font-semibold text-leaf">{info}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}

      {adding && (
        <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-line bg-white p-4">
          <div><label className="label" htmlFor="pn">{t('personName')}</label><input id="pn" className="input" value={f.name} onChange={set('name')} required maxLength={60} /></div>
          <div><label className="label" htmlFor="pr">{t('relation')}</label><input id="pr" className="input" value={f.relation} onChange={set('relation')} maxLength={40} /></div>
          <div><label className="label" htmlFor="pe">{t('personEmail')}</label><input id="pe" type="email" className="input" value={f.email} onChange={set('email')} /></div>
          <div><label className="label" htmlFor="pp">{t('personPhone')}</label><input id="pp" type="tel" className="input" value={f.phone} onChange={set('phone')} maxLength={20} /></div>
          <div><label className="label" htmlFor="pl">{t('personLang')}</label>
            <select id="pl" className="input" value={f.language} onChange={set('language')}><option value="en">English</option><option value="hi">हिन्दी</option></select></div>
          <label className="flex items-start gap-2 text-sm font-semibold">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-leaf" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} required />{t('consentText')}
          </label>
          <div className="flex gap-3"><button className="btn flex-1" disabled={busy || !f.consent}>{t('save')}</button><button type="button" className="btn-quiet flex-1 py-3" onClick={() => setAdding(false)}>{t('cancel')}</button></div>
        </form>
      )}

      <ul className="mt-5 space-y-3">
        {data?.members.map((m) => (
          <li key={m.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{m.name}{m.relation && <span className="font-normal text-soft"> · {m.relation}</span>}</p>
                <p className={`text-sm font-semibold ${m.status === 'active' ? 'text-leaf' : 'text-soft'}`}>{t(`status_${m.status}`)}</p>
              </div>
              <button className="text-sm font-semibold text-petal-dark underline" onClick={() => remove(m.id)}>{t('remove')}</button>
            </div>
            {m.inviteLink && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-quiet" onClick={() => copy(m.inviteLink)}>{copied === m.inviteLink ? t('copied') : t('copyLink')}</button>
                <a className="btn-quiet" href={wa(m)} target="_blank" rel="noreferrer">{t('shareWhatsApp')}</a>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-soft">{t('nudgesTitle')}</h2>
      {data && !data.nudges.length && <p className="text-sm text-soft">{t('noNudges')}</p>}
      <ul className="space-y-2">
        {data?.nudges.map((n, i) => (
          <li key={i} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm"><span>{n.memberName} · {fmt(n.at)}</span><span className={n.status === 'sent' ? 'font-semibold text-leaf' : 'text-petal-dark'}>{n.status === 'sent' ? t('nudgeSent') : t('nudgeFailed')}</span></li>
        ))}
      </ul>
    </Layout>
  );
}

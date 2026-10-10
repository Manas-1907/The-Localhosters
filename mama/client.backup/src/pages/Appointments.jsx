import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', at: '', doctorName: '', location: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setItems((await api('/appointments')).appointments); setError(''); } catch (e) { setError(e.offline ? t('offline') : e.message); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/appointments', { method: 'POST', body: { title: f.title, at: new Date(f.at).toISOString(), doctorName: f.doctorName || undefined, location: f.location || undefined } });
      setF({ title: '', at: '', doctorName: '', location: '' });
      setAdding(false);
      load();
    } catch (err) { setError(err.offline ? t('offline') : err.details?.join(', ') || err.message); }
    setBusy(false);
  };
  const remove = async (id) => { if (window.confirm(t('confirmDelete'))) { await api(`/appointments/${id}`, { method: 'DELETE' }).catch(() => {}); load(); } };
  const fmt = (d) => new Date(d).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const now = Date.now();
  const upcoming = items?.filter((a) => new Date(a.at) >= now) || [];
  const past = items?.filter((a) => new Date(a.at) < now).reverse() || [];

  const Row = ({ a, dim }) => (
    <li className={`rounded-2xl border border-line bg-white p-4 ${dim ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{a.title}</p>
          <time className="text-sm text-soft" dateTime={a.at}>{fmt(a.at)}</time>
          {(a.doctorName || a.location) && <p className="mt-1 text-sm">{[a.doctorName, a.location].filter(Boolean).join(' · ')}</p>}
        </div>
        <button className="text-sm font-semibold text-petal-dark underline" onClick={() => remove(a._id)}>{t('remove')}</button>
      </div>
    </li>
  );

  return (
    <Layout>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('apptTitle')}</h1>
        {!adding && <button className="btn-quiet" onClick={() => setAdding(true)}>{t('addAppt')}</button>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
      {adding && (
        <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-line bg-white p-4">
          <div><label className="label" htmlFor="at1">{t('apptName')}</label><input id="at1" className="input" value={f.title} onChange={set('title')} required maxLength={100} /></div>
          <div><label className="label" htmlFor="at2">{t('apptWhen')}</label><input id="at2" type="datetime-local" className="input" value={f.at} onChange={set('at')} required /></div>
          <div><label className="label" htmlFor="at3">{t('doctor')}</label><input id="at3" className="input" value={f.doctorName} onChange={set('doctorName')} maxLength={80} /></div>
          <div><label className="label" htmlFor="at4">{t('apptPlace')}</label><input id="at4" className="input" value={f.location} onChange={set('location')} maxLength={120} /></div>
          <div className="flex gap-3"><button className="btn flex-1" disabled={busy}>{t('save')}</button><button type="button" className="btn-quiet flex-1 py-3" onClick={() => setAdding(false)}>{t('cancel')}</button></div>
        </form>
      )}
      {items && !items.length && !adding && <p className="mt-6 text-soft">{t('noAppts')}</p>}
      <ul className="mt-5 space-y-3">{upcoming.map((a) => <Row key={a._id} a={a} />)}</ul>
      {past.length > 0 && <><h2 className="mb-2 mt-8 text-sm font-semibold text-soft">{t('pastAppts')}</h2><ul className="space-y-3">{past.map((a) => <Row key={a._id} a={a} dim />)}</ul></>}
    </Layout>
  );
}

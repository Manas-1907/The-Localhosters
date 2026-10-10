import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const localToday = () => new Date().toLocaleDateString('en-CA');

function AddForm({ onDone }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ name: '', dosage: '', startDate: localToday(), endDate: '' });
  const [times, setTimes] = useState(['08:00']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/medicines', { method: 'POST', body: { ...f, dosage: f.dosage || undefined, endDate: f.endDate || undefined, times: times.filter(Boolean) } });
      onDone();
    } catch (err) {
      setError(err.offline ? t('offline') : err.details?.join(', ') || err.message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-line bg-white p-4">
      <div><label className="label" htmlFor="mname">{t('medName')}</label><input id="mname" className="input" value={f.name} onChange={set('name')} required maxLength={80} /></div>
      <div><label className="label" htmlFor="mdose">{t('dosage')}</label><input id="mdose" className="input" value={f.dosage} onChange={set('dosage')} maxLength={80} placeholder="1 tablet" /></div>
      <fieldset>
        <legend className="label">{t('doseTimes')}</legend>
        <div className="space-y-2">
          {times.map((tm, i) => (
            <div key={i} className="flex gap-2">
              <input type="time" aria-label={t('doseTimes')} className="input" value={tm} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} required />
              {times.length > 1 && <button type="button" className="btn-quiet" onClick={() => setTimes(times.filter((_, j) => j !== i))}>{t('remove')}</button>}
            </div>
          ))}
        </div>
        {times.length < 6 && <button type="button" className="btn-quiet mt-2" onClick={() => setTimes([...times, '20:00'])}>{t('addTime')}</button>}
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="ms">{t('startDate')}</label><input id="ms" type="date" className="input" value={f.startDate} onChange={set('startDate')} required /></div>
        <div><label className="label" htmlFor="me">{t('endDate')}</label><input id="me" type="date" className="input" value={f.endDate} onChange={set('endDate')} min={f.startDate} /></div>
      </div>
      {error && <p role="alert" className="rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
      <div className="flex gap-3"><button className="btn flex-1" disabled={busy}>{t('save')}</button><button type="button" className="btn-quiet flex-1 py-3" onClick={() => onDone(false)}>{t('cancel')}</button></div>
    </form>
  );
}

export default function Medicines() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setData(await api('/medicines')); setError(''); } catch (e) { setError(e.offline ? t('offline') : e.message); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const statusOf = (id, time) => data?.doses.find((d) => d.medicine === id && d.time === time)?.status;
  const mark = async (id, time, status) => { try { await api(`/medicines/${id}/doses`, { method: 'POST', body: { time, status } }); load(); } catch (e) { setError(e.offline ? t('offline') : e.message); } };
  const remove = async (id) => { if (window.confirm(t('confirmDelete'))) { await api(`/medicines/${id}`, { method: 'DELETE' }).catch(() => {}); load(); } };

  return (
    <Layout>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('medsTitle')}</h1>
        {!adding && <div className="flex gap-2"><Link to="/scan" className="btn-quiet">{t('scanBtn')}</Link><button className="btn-quiet" onClick={() => setAdding(true)}>{t('addMedicine')}</button></div>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
      {adding && <AddForm onDone={(reload = true) => { setAdding(false); if (reload) load(); }} />}
      {data && !data.medicines.length && !adding && <p className="mt-6 text-soft">{t('noMeds')}</p>}
      <ul className="mt-5 space-y-4">
        {data?.medicines.map((m) => (
          <li key={m._id} className={`rounded-2xl border border-line bg-white p-4 ${m.active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-bold">{m.name}</p>{m.dosage && <p className="text-sm text-soft">{m.dosage}</p>}</div>
              <button className="text-sm font-semibold text-petal-dark underline" onClick={() => remove(m._id)}>{t('remove')}</button>
            </div>
            <ul className="mt-3 space-y-2">
              {m.times.map((tm) => {
                const st = statusOf(m._id, tm);
                return (
                  <li key={tm} className="flex items-center justify-between rounded-xl bg-mist px-3 py-2">
                    <span className="font-semibold">{tm}</span>
                    {st ? <span className={`text-sm font-semibold ${st === 'taken' ? 'text-leaf' : 'text-soft'}`}>{t(st === 'taken' ? 'taken' : 'skipped')}</span> : (
                      <span className="flex gap-2">
                        <button className="btn-quiet" onClick={() => mark(m._id, tm, 'skipped')}>{t('skip')}</button>
                        <button className="rounded-xl bg-leaf px-3 py-2 text-sm font-semibold text-white" onClick={() => mark(m._id, tm, 'taken')}>{t('markTaken')}</button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </Layout>
  );
}

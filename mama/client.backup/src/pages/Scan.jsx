import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { compressImage, scanPrescription } from '../lib/prescription';

export default function Scan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState('pick'); // pick | reading | review | saving
  const [items, setItems] = useState([]);
  const [followUp, setFollowUp] = useState({ date: null, doctor: null, add: true });
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setStep('reading');
    try {
      const out = await scanPrescription(await compressImage(file));
      if (!out.medicines.length) { setError(t('scanNone')); setStep('pick'); return; }
      setItems(out.medicines.map((m) => ({ ...m, include: true })));
      setFollowUp({ date: out.followUpDate, doctor: out.doctorName, add: true });
      setStep('review');
    } catch (err) {
      setError(err.offline ? t('offline') : t('scanFailed'));
      setStep('pick');
    }
    e.target.value = '';
  };

  const edit = (i, patch) => setItems((cur) => cur.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const editTime = (i, k, v) => edit(i, { times: items[i].times.map((x, j) => (j === k ? v : x)) });

  const confirm = async () => {
    setStep('saving'); setError('');
    const failed = [];
    for (const m of items.filter((x) => x.include)) {
      try {
        await api('/medicines', { method: 'POST', body: { name: m.name, dosage: m.dosage || undefined, times: m.times.filter(Boolean), startDate: m.startDate, endDate: m.endDate || undefined, notes: m.notes || undefined, source: 'ocr' } });
      } catch { failed.push(m.name); }
    }
    if (followUp.date && followUp.add) {
      await api('/appointments', { method: 'POST', body: { title: t('followUpVisit'), at: new Date(`${followUp.date}T10:00:00`).toISOString(), doctorName: followUp.doctor || undefined } }).catch(() => {});
    }
    if (failed.length) { setError(`${t('saveFailedFor')} ${failed.join(', ')}`); setStep('review'); setItems((cur) => cur.filter((m) => failed.includes(m.name))); return; }
    navigate('/medicines', { replace: true });
  };

  return (
    <Layout>
      <h1 className="mt-2 text-2xl font-bold">{t('scanTitle')}</h1>
      {step === 'pick' && (
        <>
          <p className="mt-2 text-soft">{t('scanLead')}</p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} aria-label={t('takePhoto')} />
          <button className="btn mt-5 w-full" onClick={() => fileRef.current?.click()}>{t('takePhoto')}</button>
        </>
      )}
      {step === 'reading' && <p role="status" className="mt-8 text-center text-soft">{t('reading')}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}

      {(step === 'review' || step === 'saving') && (
        <>
          <p className="mt-3 rounded-xl border border-sun bg-sun/25 px-4 py-3 text-sm font-semibold">{t('scanWarn')}</p>
          <ul className="mt-4 space-y-4">
            {items.map((m, i) => (
              <li key={i} className={`rounded-2xl border bg-white p-4 ${m.include ? 'border-line' : 'border-line opacity-50'}`}>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" className="h-4 w-4 accent-leaf" checked={m.include} onChange={(e) => edit(i, { include: e.target.checked })} />{t('include')}
                  {m.confidence === 'low' && <span className="ml-auto rounded-full bg-sun/40 px-2 py-0.5 text-xs">{t('lowConf')}</span>}
                </label>
                <div className="mt-3 space-y-3">
                  <div><label className="label" htmlFor={`n${i}`}>{t('medName')}</label><input id={`n${i}`} className="input" value={m.name} onChange={(e) => edit(i, { name: e.target.value })} /></div>
                  <div><label className="label" htmlFor={`d${i}`}>{t('dosage')}</label><input id={`d${i}`} className="input" value={m.dosage} onChange={(e) => edit(i, { dosage: e.target.value })} /></div>
                  <fieldset>
                    <legend className="label">{t('doseTimes')}</legend>
                    <div className="flex flex-wrap gap-2">
                      {m.times.map((tm, k) => (
                        <span key={k} className="flex items-center gap-1">
                          <input type="time" aria-label={t('doseTimes')} className="input w-auto" value={tm} onChange={(e) => editTime(i, k, e.target.value)} />
                          {m.times.length > 1 && <button type="button" aria-label={t('remove')} className="btn-quiet px-2" onClick={() => edit(i, { times: m.times.filter((_, j) => j !== k) })}>×</button>}
                        </span>
                      ))}
                    </div>
                  </fieldset>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label" htmlFor={`s${i}`}>{t('startDate')}</label><input id={`s${i}`} type="date" className="input" value={m.startDate} onChange={(e) => edit(i, { startDate: e.target.value })} /></div>
                    <div><label className="label" htmlFor={`e${i}`}>{t('endDate')}</label><input id={`e${i}`} type="date" className="input" value={m.endDate} min={m.startDate} onChange={(e) => edit(i, { endDate: e.target.value })} /></div>
                  </div>
                  <div><label className="label" htmlFor={`o${i}`}>{t('instructions')}</label><input id={`o${i}`} className="input" value={m.notes} onChange={(e) => edit(i, { notes: e.target.value })} /></div>
                </div>
              </li>
            ))}
          </ul>
          {followUp.date && (
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-leaf" checked={followUp.add} onChange={(e) => setFollowUp({ ...followUp, add: e.target.checked })} />
              {t('addFollowUp', { date: followUp.date })}
            </label>
          )}
          <button className="btn mt-5 w-full" onClick={confirm} disabled={step === 'saving' || !items.some((m) => m.include)}>{t('confirmAdd')}</button>
        </>
      )}
    </Layout>
  );
}

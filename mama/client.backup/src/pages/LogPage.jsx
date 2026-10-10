import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import FlagList from '../components/FlagList';
import VoiceRecorder from '../components/VoiceRecorder';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { syncLogs } from '../lib/sync';
import { CHIP_SYMPTOMS, evaluate } from '../lib/redFlags';

const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

export default function LogPage() {
  const { t } = useTranslation();
  const { progress } = useAuth();
  const pregnant = progress?.stage === 'pregnant';
  const [mood, setMood] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [v, setV] = useState({ systolic: '', diastolic: '', weightKg: '', temp: '', kicks: '' });
  const [unit, setUnit] = useState('C');
  const [note, setNote] = useState('');
  const [audio, setAudio] = useState(null); // recorded offline, converted to text later
  const [usedVoice, setUsedVoice] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const toggle = (s) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const setVal = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const reset = () => { setMood(null); setSymptoms([]); setV({ systolic: '', diastolic: '', weightKg: '', temp: '', kicks: '' }); setNote(''); setAudio(null); setUsedVoice(false); setError(''); setResult(null); };

  const save = async (e) => {
    e.preventDefault();
    const temp = num(v.temp);
    const vitals = {
      systolic: num(v.systolic), diastolic: num(v.diastolic), weightKg: num(v.weightKg), kicks: num(v.kicks),
      tempC: temp == null ? undefined : unit === 'F' ? Math.round(((temp - 32) * 5) / 9 * 10) / 10 : temp,
    };
    Object.keys(vitals).forEach((k) => vitals[k] === undefined && delete vitals[k]);

    if (!mood && !symptoms.length && !Object.keys(vitals).length && !note.trim() && !audio) return setError(t('logEmpty'));
    if ((vitals.systolic == null) !== (vitals.diastolic == null)) return setError(t('bpBoth'));

    // Warnings are computed on the device first so they appear even with no connection.
    const flags = evaluate({ stage: progress?.stage, week: progress?.gestationalWeek, vitals, symptoms, mood });
    await db.logs.add({
      clientId: crypto.randomUUID(), loggedAt: new Date().toISOString(), source: usedVoice || audio ? 'voice' : 'text', pendingAudio: audio || undefined,
      symptoms, mood: mood ?? undefined, vitals, note: note.trim() || undefined, flags, synced: 0,
    });
    setResult(flags);
    syncLogs();
  };

  if (result) {
    return (
      <Layout>
        <h1 className="mt-2 text-2xl font-bold">{t('savedLog')}</h1>
        <div className="mt-4"><FlagList flags={result} /></div>
        <div className="mt-6 flex gap-3">
          <button className="btn flex-1" onClick={reset}>{t('logAnother')}</button>
          <Link className="btn-quiet flex-1 py-3" to="/history">{t('seeHistory')}</Link>
        </div>
      </Layout>
    );
  }

  const field = (id, label, extra) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} inputMode="decimal" className="input" value={v[id]} onChange={setVal(id)} {...extra} />
    </div>
  );

  return (
    <Layout>
      <h1 className="mt-2 text-2xl font-bold">{t('logTitle')}</h1>
      <form onSubmit={save} className="mt-5 space-y-7">
        <fieldset>
          <legend className="label">{t('moodQ')}</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} aria-pressed={mood === n} onClick={() => setMood(mood === n ? null : n)}
                className={`rounded-xl border px-1 py-3 text-xs font-semibold ${mood === n ? 'border-leaf bg-leaf text-white' : 'border-line bg-white'}`}>
                {t(`mood${n}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">{t('symptomsQ')}</legend>
          <div className="flex flex-wrap gap-2">
            {CHIP_SYMPTOMS.filter((s) => pregnant || s !== 'reduced_movement').map((s) => (
              <button type="button" key={s} aria-pressed={symptoms.includes(s)} onClick={() => toggle(s)}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${symptoms.includes(s) ? 'border-petal bg-petal text-white' : 'border-line bg-white'}`}>
                {t(`sym.${s}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">{t('vitalsQ')}</legend>
          <p className="mb-2 text-sm font-semibold text-soft">{t('bp')}</p>
          <div className="grid grid-cols-2 gap-3">
            {field('systolic', t('systolic'), { placeholder: '120' })}
            {field('diastolic', t('diastolic'), { placeholder: '80' })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {field('weightKg', t('weight'))}
            <div>
              <label className="label" htmlFor="temp">{t('temp')}</label>
              <div className="flex gap-2">
                <input id="temp" inputMode="decimal" className="input" value={v.temp} onChange={setVal('temp')} />
                <select aria-label={t('temp')} className="rounded-xl border border-line bg-white px-2" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="C">°C</option><option value="F">°F</option>
                </select>
              </div>
            </div>
          </div>
          {pregnant && <div className="mt-3">{field('kicks', t('kicks'), { inputMode: 'numeric' })}</div>}
        </fieldset>

        <div>
          <label className="label" htmlFor="note">{t('noteQ')}</label>
          <textarea id="note" rows={4} maxLength={2000} className="input" placeholder={t('notePh')} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="mt-3">
            <VoiceRecorder
              onText={(txt) => { setNote((n) => (n ? `${n}\n${txt}` : txt).slice(0, 2000)); setUsedVoice(true); }}
              onQueued={setAudio}
            />
            {audio && <p className="mt-2 text-sm font-semibold text-leaf">{t('voicePending')}</p>}
          </div>
        </div>

        {error && <p role="alert" className="rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
        <button className="btn w-full">{t('saveLog')}</button>
      </form>
    </Layout>
  );
}

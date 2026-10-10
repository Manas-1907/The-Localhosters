import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import CrisisCard from '../components/CrisisCard';
import { api } from '../lib/api';
import { EPDS } from '../epds';

export default function Mood() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const [step, setStep] = useState(-1); // -1 intro, 0..9 questions, 10 result
  const [picked, setPicked] = useState(Array(10).fill(null)); // option index per question
  const [result, setResult] = useState(null);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!result?.crisis) return;
    api('/circle').then((d) => setContact(d.members.find((m) => m.status === 'active' && m.phone) || null)).catch(() => {});
  }, [result]);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const answers = picked.map((p, i) => EPDS[i].scores[p]);
      setResult(await api('/mood/epds', { method: 'POST', body: { answers } }));
      setStep(10);
    } catch (e) { setError(e.offline ? t('offline') : e.message); }
    setBusy(false);
  };

  if (step === -1) {
    return (
      <Layout>
        <h1 className="mt-2 text-2xl font-bold">{t('moodTitle')}</h1>
        <p className="mt-2 text-soft">{t('moodIntro')}</p>
        <button className="btn mt-6 w-full" onClick={() => setStep(0)}>{t('start')}</button>
      </Layout>
    );
  }

  if (step === 10 && result) {
    return (
      <Layout>
        <h1 className="mt-2 text-2xl font-bold">{t('moodTitle')}</h1>
        <div className="mt-4 space-y-4">
          {result.crisis && <CrisisCard contact={contact} />}
          <p className="rounded-2xl border border-line bg-white p-4">{t(`mood_${result.level}`)}</p>
          {result.nudgeSent && <p className="text-sm font-semibold text-leaf">{t('nudgeSentInfo')}</p>}
          <Link to="/circle" className="btn-quiet w-full py-3">{t('toCircle')}</Link>
          <p className="text-xs text-soft">{t('moodDisclaimer')} {t('epdsCite')}</p>
        </div>
      </Layout>
    );
  }

  const item = EPDS[step];
  const last = step === 9;
  return (
    <Layout>
      <p className="mt-2 text-sm font-semibold text-soft">{t('qOf', { n: step + 1 })}</p>
      <div className="mt-1 h-1.5 rounded-full bg-line" aria-hidden="true"><div className="h-1.5 rounded-full bg-leaf" style={{ width: `${((step + 1) / 10) * 100}%` }} /></div>
      <fieldset className="mt-5">
        <legend className="text-xl font-bold leading-snug">{item.q[lang]}</legend>
        <div className="mt-4 space-y-2">
          {item.o[lang].map((label, k) => (
            <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 font-semibold ${picked[step] === k ? 'border-leaf bg-leaf/10' : 'border-line bg-white'}`}>
              <input type="radio" name={`q${step}`} className="h-4 w-4 accent-leaf" checked={picked[step] === k} onChange={() => setPicked(picked.map((p, i) => (i === step ? k : p)))} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-4 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
      <div className="mt-6 flex gap-3">
        <button className="btn-quiet flex-1 py-3" onClick={() => setStep(step - 1 < 0 ? -1 : step - 1)}>{t('back')}</button>
        <button className="btn flex-1" disabled={picked[step] == null || busy} onClick={() => (last ? submit() : setStep(step + 1))}>{last ? t('seeResult') : t('next')}</button>
      </div>
    </Layout>
  );
}

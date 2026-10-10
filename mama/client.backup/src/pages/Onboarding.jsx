import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const today = new Date().toISOString().slice(0, 10);

function Choice({ checked, onChange, children, name, value }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 font-semibold ${checked ? 'border-leaf bg-leaf/10' : 'border-line bg-white'}`}>
      <input type="radio" className="h-4 w-4 accent-leaf" name={name} value={value} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

export default function Onboarding() {
  const { t } = useTranslation();
  const { profile, saveProfile } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState(profile?.stage || 'pregnant');
  const [method, setMethod] = useState('edd');
  const [edd, setEdd] = useState(toInput(profile?.edd));
  const [lmp, setLmp] = useState(toInput(profile?.lmp));
  const [deliveryDate, setDeliveryDate] = useState(toInput(profile?.deliveryDate));
  const [hospital, setHospital] = useState(profile?.hospital || '');
  const [doctorName, setDoctorName] = useState(profile?.doctorName || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body = { stage, hospital: hospital || undefined, doctorName: doctorName || undefined };
    if (stage === 'pregnant') body[method] = method === 'edd' ? edd : lmp;
    else body.deliveryDate = deliveryDate;
    try {
      await saveProfile(body);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.offline ? t('offline') : err.details?.join(', ') || err.message || t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="mt-4 text-2xl font-bold">{t('onboardTitle')}</h1>
      <p className="mt-1 text-soft">{t('onboardLead')}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <fieldset className="space-y-2">
          <Choice name="stage" value="pregnant" checked={stage === 'pregnant'} onChange={() => setStage('pregnant')}>{t('stagePregnant')}</Choice>
          <Choice name="stage" value="postpartum" checked={stage === 'postpartum'} onChange={() => setStage('postpartum')}>{t('stagePostpartum')}</Choice>
        </fieldset>

        {stage === 'pregnant' ? (
          <>
            <fieldset className="space-y-2">
              <Choice name="method" value="edd" checked={method === 'edd'} onChange={() => setMethod('edd')}>{t('knowDue')}</Choice>
              <Choice name="method" value="lmp" checked={method === 'lmp'} onChange={() => setMethod('lmp')}>{t('knowLmp')}</Choice>
            </fieldset>
            {method === 'edd' ? (
              <div><label className="label" htmlFor="edd">{t('dueDate')}</label><input id="edd" type="date" className="input" value={edd} onChange={(e) => setEdd(e.target.value)} min={today} required /></div>
            ) : (
              <div><label className="label" htmlFor="lmp">{t('lmpDate')}</label><input id="lmp" type="date" className="input" value={lmp} onChange={(e) => setLmp(e.target.value)} max={today} required /></div>
            )}
          </>
        ) : (
          <div><label className="label" htmlFor="dd">{t('deliveryDate')}</label><input id="dd" type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} max={today} required /></div>
        )}

        <div><label className="label" htmlFor="hosp">{t('hospital')}</label><input id="hosp" className="input" value={hospital} onChange={(e) => setHospital(e.target.value)} maxLength={120} /></div>
        <div><label className="label" htmlFor="doc">{t('doctor')}</label><input id="doc" className="input" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} maxLength={80} /></div>

        {error && <p role="alert" className="rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
        <button className="btn w-full" disabled={busy}>{t('saveContinue')}</button>
      </form>
    </Layout>
  );
}

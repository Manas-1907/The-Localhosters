import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import FlagList from '../components/FlagList';
import { db } from '../lib/db';

export default function History() {
  const { t, i18n } = useTranslation();
  const logs = useLiveQuery(() => db.logs.orderBy('loggedAt').reverse().toArray(), []);
  const fmt = (d) => new Date(d).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Layout>
      <h1 className="mt-2 text-2xl font-bold">{t('historyTitle')}</h1>
      {logs && !logs.length && <p className="mt-6 text-soft">{t('historyEmpty')}</p>}
      <ul className="mt-5 space-y-4">
        {logs?.map((l) => {
          const vit = [
            l.vitals?.systolic != null && `${l.vitals.systolic}/${l.vitals.diastolic}`,
            l.vitals?.weightKg != null && `${l.vitals.weightKg} kg`,
            l.vitals?.tempC != null && `${l.vitals.tempC} °C`,
            l.vitals?.kicks != null && `${l.vitals.kicks} ${t('kicks').split(' ')[0].toLowerCase()}`,
          ].filter(Boolean);
          return (
            <li key={l.clientId} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between text-sm text-soft">
                <time dateTime={l.loggedAt}>{fmt(l.loggedAt)}</time>
                {l.synced === 0 && <span className="font-semibold text-petal-dark">{t('waiting')}</span>}
                {l.synced === 2 && <span className="font-semibold text-petal-dark">{t('syncFailed')}</span>}
              </div>
              {l.pendingAudio && <p className="mt-2 text-sm font-semibold text-leaf">{t('voicePending')}</p>}
              {l.mood && <p className="mt-2 font-semibold">{t(`mood${l.mood}`)}</p>}
              {l.symptoms?.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {l.symptoms.map((s) => <li key={s} className="rounded-full bg-mist px-3 py-1 text-sm">{t(`sym.${s}`)}</li>)}
                </ul>
              )}
              {vit.length > 0 && <p className="mt-2 text-sm text-soft">{vit.join(' · ')}</p>}
              {l.note && <p className="mt-2 whitespace-pre-wrap">{l.note}</p>}
              {l.flags?.length > 0 && <div className="mt-3"><FlagList flags={l.flags} compact /></div>}
            </li>
          );
        })}
      </ul>
    </Layout>
  );
}

import { useTranslation } from 'react-i18next';
import { WATCH, pickInsight } from '../insights';

export default function WeeklyInsight({ progress }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const pick = pickInsight(progress);
  if (!pick) return null;
  const { band, stage } = pick;
  const rows = [['insBaby', band.baby], ['insBody', band.body], ['insFood', band.food], ['insTip', band.tip]];

  return (
    <section className="mt-5 rounded-2xl border border-line bg-white p-4" aria-labelledby="ins-h">
      <h2 id="ins-h" className="font-bold">{t('insightTitle')} · <span className="text-soft font-semibold">{band.title[lang]}</span></h2>
      <dl className="mt-3 space-y-3">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-xs font-bold uppercase tracking-wide text-leaf">{t(k)}</dt><dd className="mt-0.5">{v[lang]}</dd></div>
        ))}
      </dl>
      <p className="mt-4 rounded-xl bg-sun/25 px-3 py-2 text-sm"><span className="font-bold">{t('insWatch')}: </span>{WATCH[stage][lang]}</p>
      <p className="mt-2 text-xs text-soft">{t('insDisclaimer')}</p>
    </section>
  );
}

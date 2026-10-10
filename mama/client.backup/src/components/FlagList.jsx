import { useTranslation } from 'react-i18next';
import { highestLevel } from '../lib/redFlags';
import CrisisCard from './CrisisCard';

const style = {
  emergency: 'bg-petal-dark text-white',
  urgent: 'bg-sun/30 text-ink border border-sun',
  watch: 'bg-white text-ink border border-line',
};

export default function FlagList({ flags = [], compact = false }) {
  const { t } = useTranslation();
  if (!flags.length) return null;
  const top = highestLevel(flags);
  return (
    <div role="alert" className="space-y-2">
      {flags.some((f) => f.code === 'self_harm_thoughts') && <CrisisCard />}
      <div className={`rounded-xl px-4 py-3 font-semibold ${style[top]}`}>{t(`act.${top}`)}</div>
      <ul className="space-y-1.5">
        {flags.map((f) => (
          <li key={f.code} className={`rounded-lg px-3 py-2 text-sm ${style[f.level]}`}>{t(`flag.${f.code}`)}</li>
        ))}
      </ul>
      {!compact && <p className="text-xs text-soft">{t('disclaimer')}</p>}
    </div>
  );
}

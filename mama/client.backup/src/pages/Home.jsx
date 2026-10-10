import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import Layout from '../components/Layout';
import FlagList from '../components/FlagList';
import PushCard from '../components/PushCard';
import SupportPrompt from '../components/SupportPrompt';
import WeeklyInsight from '../components/WeeklyInsight';
import { db } from '../lib/db';

// One tick per week (pregnancy) or per day (postpartum). The position is the information.
function Ticks({ total, current, groups }) {
  return (
    <div className="flex gap-[2px]" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const state = n < current ? 'bg-leaf' : n === current ? 'bg-petal' : 'bg-line';
        const gap = groups.includes(n) ? 'mr-1.5' : '';
        return <span key={n} className={`h-8 flex-1 rounded-sm ${state} ${gap} ${n === current ? 'h-11 -mt-1.5' : ''}`} />;
      })}
    </div>
  );
}

function LinkTile({ to, label }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-4 font-semibold hover:bg-white/60">
      <span>{label}</span>
    </Link>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { user, progress } = useAuth();
  const pregnant = progress?.stage === 'pregnant';
  // Show warnings from the last 48 hours of logs so they are not missed after the log screen closes.
  const recent = useLiveQuery(async () => {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const rows = await db.logs.where('loggedAt').above(since).toArray();
    rows.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
    return rows.find((r) => r.flags?.length) || null;
  }, []);

  return (
    <Layout>
      <p className="mt-2 text-soft">{t('hello', { name: user?.name })}</p>

      <section className="mt-4 rounded-2xl bg-ink p-5 text-white">
        {pregnant ? (
          <>
            <h1 className="text-4xl font-bold">{t('week', { n: progress.gestationalWeek })}</h1>
            <p className="mt-1 text-white/80">
              {t('trimester', { n: progress.trimester })} · {progress.daysToDue >= 0 ? t('daysToDue', { n: progress.daysToDue }) : t('dueSoon')}
            </p>
            <div className="mt-6"><Ticks total={40} current={progress.gestationalWeek} groups={[13, 27]} /></div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold">{t('pcDay', { n: Math.min(progress?.postpartumDay ?? 1, 42) })}</h1>
            <p className="mt-1 text-white/80">{progress?.postpartumDaysLeft > 0 ? t('pcLeft', { n: progress.postpartumDaysLeft }) : t('pcDone')}</p>
            <div className="mt-6"><Ticks total={42} current={progress?.postpartumDay ?? 1} groups={[7, 14, 28]} /></div>
          </>
        )}
      </section>

      {user?.role === 'mother' && <SupportPrompt />}

      {recent && (
        <section className="mt-5">
          <p className="mb-2 text-sm font-semibold text-soft">{t('recentAlert')}</p>
          <FlagList flags={recent.flags} compact />
        </section>
      )}

      <WeeklyInsight progress={progress} />

      <section className="mt-5 space-y-3">
        <LinkTile to="/log" label={t('tileLog')} />
        <LinkTile to="/medicines" label={t('tileMeds')} />
        <LinkTile to="/appointments" label={t('tileAppts')} />
        <LinkTile to="/mood" label={t('tileMood')} />
        <LinkTile to="/circle" label={t('tileCircle')} />
        <LinkTile to="/share" label={t('tileShare')} />
      </section>

      {user?.role === 'mother' && <PushCard />}

      <p className="mt-6 text-center"><Link to="/onboarding" className="text-sm font-semibold text-petal-dark underline">{t('editDates')}</Link></p>
    </Layout>
  );
}

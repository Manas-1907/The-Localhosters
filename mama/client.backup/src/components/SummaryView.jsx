import { useTranslation } from 'react-i18next';
import { highestLevel } from '../lib/redFlags';

// A clinical document: always English, whatever language the app is in, because the reader is the doctor.
const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' });
const levelStyle = { emergency: 'bg-petal-dark text-white', urgent: 'bg-sun/30 border border-sun', watch: 'bg-mist' };

function Section({ title, children }) {
  return <section className="mt-6 break-inside-avoid"><h2 className="border-b border-line pb-1 text-sm font-bold uppercase tracking-wide text-soft">{title}</h2><div className="mt-3">{children}</div></section>;
}

// Blood pressure over time with the 140/90 reference lines. Readings are also listed in the table below.
function BpChart({ rows }) {
  const pts = rows.filter((r) => r.systolic != null && r.diastolic != null);
  if (pts.length < 2) return null;
  const W = 320, H = 130, L = 30, R = 8, T = 8, B = 18;
  const t0 = new Date(pts[0].at).getTime(), t1 = new Date(pts[pts.length - 1].at).getTime();
  const x = (a) => L + ((new Date(a).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - (Math.min(180, Math.max(50, v)) - 50) / 130) * (H - T - B);
  const line = (k) => pts.map((p) => `${x(p.at)},${y(p[k])}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Blood pressure, ${pts.length} readings`}>
      {[[140, 'systolic limit'], [90, 'diastolic limit']].map(([v]) => (
        <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#C4476A" strokeDasharray="4 3" strokeWidth="1" /><text x={L - 4} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#6E6585">{v}</text></g>
      ))}
      <polyline points={line('systolic')} fill="none" stroke="#2B2340" strokeWidth="2" />
      <polyline points={line('diastolic')} fill="none" stroke="#2E8B7F" strokeWidth="2" />
      {pts.map((p, i) => <g key={i}><circle cx={x(p.at)} cy={y(p.systolic)} r="2.5" fill="#2B2340" /><circle cx={x(p.at)} cy={y(p.diastolic)} r="2.5" fill="#2E8B7F" /></g>)}
      <text x={L} y={H - 4} fontSize="9" fill="#6E6585">{fmtDay(pts[0].at)}</text>
      <text x={W - R} y={H - 4} fontSize="9" textAnchor="end" fill="#6E6585">{fmtDay(pts[pts.length - 1].at)}</text>
    </svg>
  );
}

export default function SummaryView({ summary }) {
  const { i18n } = useTranslation();
  const te = i18n.getFixedT('en');
  const s = summary;
  const st = s.status;
  const stageLine = !st ? '' : st.stage === 'postpartum'
    ? `Postpartum day ${st.postpartumDay} of 42${st.deliveryDate ? ` (delivered ${fmtDay(st.deliveryDate)})` : ''}`
    : `Pregnancy week ${st.gestationalWeek ?? '?'}${st.trimester ? `, trimester ${st.trimester}` : ''}${st.edd ? `, due ${fmtDay(st.edd)}` : ''}`;
  const alertTop = s.symptoms?.alerts?.length ? highestLevel(s.symptoms.alerts.flatMap((a) => a.flags)) : 'none';

  return (
    <article className="text-[15px] leading-relaxed">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-petal-dark">MAMA health summary</p>
        <h1 className="mt-1 text-2xl font-bold">{s.patient.name}</h1>
        <p className="text-soft">{stageLine}</p>
        {(st?.doctorName || st?.hospital) && <p className="text-soft">{[st.doctorName, st.hospital].filter(Boolean).join(' · ')}</p>}
        <p className="mt-1 text-xs text-soft">Generated {fmt(s.generatedAt)}. Covers the last {s.periodDays} days. Self-reported data, not a medical record. MAMA does not diagnose.</p>
      </header>

      {s.symptoms && (
        <Section title="Warning alerts">
          {s.symptoms.alerts.length === 0 ? <p>No urgent or emergency alerts in this period.</p> : (
            <ul className="space-y-2">
              {s.symptoms.alerts.slice(-8).reverse().map((a, i) => (
                <li key={i} className={`rounded-lg px-3 py-2 ${levelStyle[highestLevel(a.flags)]}`}>
                  <span className="font-semibold">{fmt(a.at)}</span>: {a.flags.map((f) => te(`flag.${f.code}`)).join(' ')}
                </li>
              ))}
            </ul>
          )}
          {alertTop !== 'none' && <p className="mt-2 text-xs text-soft">Alerts come from fixed screening rules applied to what the mother entered.</p>}
        </Section>
      )}

      {s.vitals && (
        <Section title="Vitals">
          {s.vitals.rows.length === 0 ? <p>No vitals recorded.</p> : (
            <>
              {s.vitals.highBpReadings > 0 && <p className="mb-2 font-semibold text-petal-dark">{s.vitals.highBpReadings} reading(s) at or above 140/90.</p>}
              <BpChart rows={s.vitals.rows} />
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-soft"><tr><th className="py-1 pr-3">When</th><th className="pr-3">BP</th><th className="pr-3">Weight</th><th className="pr-3">Temp</th><th>Movements</th></tr></thead>
                  <tbody>{s.vitals.rows.slice(-12).reverse().map((r, i) => (
                    <tr key={i} className="border-t border-line"><td className="py-1 pr-3">{fmt(r.at)}</td><td className="pr-3">{r.systolic != null ? `${r.systolic}/${r.diastolic}` : '–'}</td><td className="pr-3">{r.weightKg != null ? `${r.weightKg} kg` : '–'}</td><td className="pr-3">{r.tempC != null ? `${r.tempC} °C` : '–'}</td><td>{r.kicks ?? '–'}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
        </Section>
      )}

      {s.symptoms && (
        <Section title="Symptoms reported">
          {s.symptoms.counts.length === 0 ? <p>None reported.</p> : (
            <ul className="flex flex-wrap gap-2">{s.symptoms.counts.map((c) => <li key={c.code} className="rounded-full bg-mist px-3 py-1 text-sm">{te(`sym.${c.code}`)} × {c.count} <span className="text-soft">(last {fmtDay(c.last)})</span></li>)}</ul>
          )}
        </Section>
      )}

      {s.medicines && (
        <Section title="Medicines and adherence (last 14 days)">
          {s.medicines.perMedicine.length === 0 ? <p>No active medicines.</p> : (
            <>
              {s.medicines.overallPercent != null && <p className="mb-2">Doses marked as taken: <strong>{s.medicines.overallPercent}%</strong> of those due.</p>}
              <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead className="text-soft"><tr><th className="py-1 pr-3">Medicine</th><th className="pr-3">Schedule</th><th className="pr-3">Taken</th><th className="pr-3">Skipped</th><th>Not marked</th></tr></thead>
                <tbody>{s.medicines.perMedicine.map((m, i) => (
                  <tr key={i} className="border-t border-line align-top"><td className="py-1 pr-3 font-semibold">{m.name}{m.dosage && <span className="block font-normal text-soft">{m.dosage}</span>}</td><td className="pr-3">{m.times.join(', ')}</td><td className="pr-3">{m.taken}/{m.expected}</td><td className="pr-3">{m.skipped}</td><td>{m.notRecorded}</td></tr>
                ))}</tbody>
              </table></div>
              <p className="mt-2 text-xs text-soft">"Not marked" means the mother did not tap Taken or Skip, which is not the same as a missed dose.</p>
            </>
          )}
        </Section>
      )}

      {s.mood && (
        <Section title="Mood">
          {s.mood.selfHarmItemPositive && <p className="mb-2 rounded-lg bg-petal-dark px-3 py-2 font-semibold text-white">Most recent mood check: item on thoughts of self-harm was answered above "never".</p>}
          <p>Low-mood days (daily average 2 or less): <strong>{s.mood.lowDays}</strong> of {s.mood.daily.length} days logged.</p>
          {s.mood.epds.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">{s.mood.epds.map((e, i) => <li key={i}>{fmtDay(e.at)}: EPDS score <strong>{e.total}</strong>/30 ({e.level})</li>)}</ul>
          )}
          <p className="mt-2 text-xs text-soft">EPDS is a screening questionnaire (Cox, Holden &amp; Sagovsky, 1987), not a diagnosis.</p>
        </Section>
      )}

      {s.notes && (
        <Section title="Her own notes">
          {s.notes.length === 0 ? <p>No notes.</p> : <ul className="space-y-2">{s.notes.slice().reverse().map((n, i) => <li key={i}><span className="text-sm text-soft">{fmt(n.at)}</span><p className="whitespace-pre-wrap">{n.text}</p></li>)}</ul>}
        </Section>
      )}
    </article>
  );
}

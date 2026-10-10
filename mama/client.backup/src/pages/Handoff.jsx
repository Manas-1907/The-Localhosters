import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SummaryView from '../components/SummaryView';
import { api } from '../lib/api';

// Public, read-only page for the doctor. No account, no navigation, print-friendly. English only.
export default function Handoff() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    api(`/handoff/view/${token}`).then(setData).catch((e) => setError(e.offline ? 'You appear to be offline.' : 'This link has expired or is not valid.'));
    return () => meta.remove();
  }, [token]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-white px-5 py-6 print:max-w-none print:p-0">
      {error && <p role="alert" className="mt-10 text-center text-lg font-semibold">{error}</p>}
      {!data && !error && <p role="status" className="mt-10 text-center text-soft">Loading…</p>}
      {data && (
        <>
          <div className="mb-4 flex items-center justify-between print:hidden">
            <span className="text-xl font-bold text-petal">MAMA</span>
            <button className="btn-quiet" onClick={() => window.print()}>Print or save as PDF</button>
          </div>
          <SummaryView summary={data.summary} />
          <p className="mt-8 border-t border-line pt-3 text-xs text-soft">Shared with the patient&apos;s consent. This link expires {new Date(data.expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.</p>
        </>
      )}
    </div>
  );
}

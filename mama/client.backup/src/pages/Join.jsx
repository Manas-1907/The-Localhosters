import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../lib/api';

// Public page for the person who was invited. No account needed: the secret link is the credential.
export default function Join() {
  const { token } = useParams();
  const { t, i18n } = useTranslation();
  const [inv, setInv] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | invalid | accepted | declined
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/circle/invite/${token}`)
      .then((d) => { setInv(d); setState('ready'); if (d.language && d.language !== i18n.language) i18n.changeLanguage(d.language); })
      .catch(() => setState('invalid'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const respond = async (accept) => {
    setBusy(true);
    try { await api(`/circle/invite/${token}/respond`, { method: 'POST', body: { accept } }); setState(accept ? 'accepted' : 'declined'); } catch { setState('invalid'); }
    setBusy(false);
  };

  return (
    <Layout>
      <h1 className="mt-4 text-2xl font-bold">{t('joinTitle')}</h1>
      {state === 'loading' && <p role="status" className="mt-6 text-soft">{t('loading')}…</p>}
      {state === 'invalid' && <p className="mt-6 text-soft">{t('joinInvalid')}</p>}
      {state === 'accepted' && <p className="mt-6 rounded-2xl border border-line bg-white p-4 font-semibold text-leaf">{t('joinThanks', { mother: inv.motherName })}</p>}
      {state === 'declined' && <p className="mt-6 rounded-2xl border border-line bg-white p-4 font-semibold">{t('joinDeclined')}</p>}
      {state === 'ready' && (
        <div className="mt-5 space-y-4">
          <p className="text-lg font-semibold">{inv.status === 'active' ? t('joinActive', { mother: inv.motherName }) : t('joinInvite', { mother: inv.motherName })}</p>
          <p className="text-soft">{t('joinWhat')}</p>
          {inv.status === 'active' ? (
            <button className="btn w-full" disabled={busy} onClick={() => respond(false)}>{t('joinStop')}</button>
          ) : (
            <div className="flex gap-3"><button className="btn flex-1" disabled={busy} onClick={() => respond(true)}>{t('accept')}</button><button className="btn-quiet flex-1 py-3" disabled={busy} onClick={() => respond(false)}>{t('decline')}</button></div>
          )}
        </div>
      )}
    </Layout>
  );
}

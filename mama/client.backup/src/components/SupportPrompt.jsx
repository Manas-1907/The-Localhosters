import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

// Appears on Home after several low-mood days or a mood check above the screening cut-off.
export default function SupportPrompt() {
  const { t } = useTranslation();
  const [s, setS] = useState(null);
  useEffect(() => { api('/mood/status').then(setS).catch(() => {}); }, []);
  if (!s?.persistentLow) return null;

  return (
    <section className="mt-5 rounded-2xl border border-petal/40 bg-petal/10 p-4">
      <h2 className="font-bold">{t('promptTitle')}</h2>
      <p className="mt-1 text-sm">{t('promptBody')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="tel:14416" className="btn py-2.5 text-sm">{t('callHelpline')}</a>
        <Link to="/mood" className="btn-quiet">{t('tileMood')}</Link>
        <Link to="/circle" className="btn-quiet">{s.circleCount > 0 ? t('promptCircleHas') : t('promptCircleAdd')}</Link>
      </div>
    </section>
  );
}

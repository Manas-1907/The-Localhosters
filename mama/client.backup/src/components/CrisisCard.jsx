import { useTranslation } from 'react-i18next';

// Shown when someone may be at risk. Calm, no questions, one tap to a real person.
export default function CrisisCard({ contact }) {
  const { t } = useTranslation();
  return (
    <section role="alert" className="rounded-2xl bg-ink p-5 text-white">
      <h2 className="text-xl font-bold">{t('crisisTitle')}</h2>
      <p className="mt-2 text-white/85">{t('crisisBody')}</p>
      <div className="mt-4 space-y-2">
        <a href="tel:14416" className="btn w-full">{t('callHelpline')}</a>
        <a href="tel:112" className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-ink">{t('callEmergency')}</a>
        {contact?.phone && <a href={`tel:${contact.phone}`} className="inline-flex w-full items-center justify-center rounded-xl border border-white/40 px-5 py-3 font-semibold text-white">{t('callContact', { name: contact.name })}</a>}
      </div>
    </section>
  );
}

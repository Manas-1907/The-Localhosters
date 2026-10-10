import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const items = [
  { to: '/', key: 'navHome', end: true },
  { to: '/log', key: 'navLog' },
  { to: '/medicines', key: 'navMeds' },
  { to: '/appointments', key: 'navVisits' },
  { to: '/history', key: 'navHistory' },
];

export default function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <ul className="mx-auto flex max-w-md">
        {items.map((i) => (
          <li key={i.to} className="flex-1">
            <NavLink to={i.to} end={i.end} className={({ isActive }) => `block py-3.5 text-center text-xs font-semibold ${isActive ? 'border-t-4 border-petal text-petal-dark' : 'border-t-4 border-transparent text-soft'}`}>
              {t(i.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

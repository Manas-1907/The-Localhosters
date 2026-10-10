import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import { api } from '../lib/api';

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { user, profile, logout } = useAuth();
  const showNav = user?.role === 'mother' && profile;
  const other = i18n.language === 'hi' ? { code: 'en', label: 'English' } : { code: 'hi', label: 'हिन्दी' };

  return (
    <div className={`mx-auto min-h-screen w-full max-w-md px-4 ${showNav ? 'pb-28' : 'pb-10'}`} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <header className="flex items-center justify-between py-4">
        <span className="text-xl font-bold tracking-wide text-petal">MAMA</span>
        <div className="flex items-center gap-2">
          <button className="btn-quiet" onClick={() => { i18n.changeLanguage(other.code); if (user) api('/auth/language', { method: 'PATCH', body: { language: other.code } }).catch(() => {}); }} lang={other.code}>{other.label}</button>
          {user && <button className="btn-quiet" onClick={logout}>{t('signOut')}</button>}
        </div>
      </header>
      <main>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}

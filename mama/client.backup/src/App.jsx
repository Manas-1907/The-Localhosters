import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import LogPage from './pages/LogPage';
import History from './pages/History';
import Medicines from './pages/Medicines';
import Appointments from './pages/Appointments';
import Scan from './pages/Scan';
import Mood from './pages/Mood';
import Circle from './pages/Circle';
import Join from './pages/Join';
import Share from './pages/Share';
import Handoff from './pages/Handoff';
import { syncLogs } from './lib/sync';

function Splash() {
  const { t } = useTranslation();
  return <div className="grid min-h-screen place-items-center text-soft" role="status">{t('loading')}…</div>;
}

// Signed-in mothers without a profile go through onboarding first.
function Gate({ children, needProfile = true }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (needProfile && user.role === 'mother' && !profile) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  // Sync on sign-in, whenever the connection returns, and when the tab becomes visible again.
  useEffect(() => {
    if (user?.role !== 'mother') return;
    syncLogs();
    const onVisible = () => document.visibilityState === 'visible' && syncLogs();
    window.addEventListener('online', syncLogs);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', syncLogs);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/onboarding" element={<Gate needProfile={false}><Onboarding /></Gate>} />
      <Route path="/" element={<Gate><Home /></Gate>} />
      <Route path="/log" element={<Gate><LogPage /></Gate>} />
      <Route path="/medicines" element={<Gate><Medicines /></Gate>} />
      <Route path="/appointments" element={<Gate><Appointments /></Gate>} />
      <Route path="/scan" element={<Gate><Scan /></Gate>} />
      <Route path="/mood" element={<Gate><Mood /></Gate>} />
      <Route path="/circle" element={<Gate><Circle /></Gate>} />
      <Route path="/share" element={<Gate><Share /></Gate>} />
      <Route path="/join/:token" element={<Join />} />
      <Route path="/handoff/:token" element={<Handoff />} />
      <Route path="/history" element={<Gate><History /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

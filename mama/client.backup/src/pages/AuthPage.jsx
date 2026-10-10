import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AuthPage({ mode }) {
  const { t, i18n } = useTranslation();
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const register = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authenticate(register ? '/auth/register' : '/auth/login', register ? { ...form, language: i18n.language } : { email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.offline ? t('offline') : err.details?.join(', ') || err.message || t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="mt-6 text-3xl font-bold leading-tight">{t('appTagline')}</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {register && (
          <div>
            <label className="label" htmlFor="name">{t('name')}</label>
            <input id="name" className="input" value={form.name} onChange={set('name')} required autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">{t('email')}</label>
          <input id="email" type="email" className="input" value={form.email} onChange={set('email')} required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t('password')}</label>
          <input id="password" type="password" className="input" value={form.password} onChange={set('password')} required minLength={register ? 8 : 1} autoComplete={register ? 'new-password' : 'current-password'} />
          {register && <p className="mt-1 text-sm text-soft">{t('passwordHint')}</p>}
        </div>
        {error && <p role="alert" className="rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal-dark">{error}</p>}
        <button className="btn w-full" disabled={busy}>{register ? t('signUp') : t('signIn')}</button>
      </form>
      <p className="mt-6 text-center text-sm text-soft">
        {register ? t('haveAccount') : t('noAccount')}{' '}
        <Link className="font-semibold text-petal-dark underline" to={register ? '/login' : '/register'}>{register ? t('signIn') : t('signUp')}</Link>
      </p>
    </Layout>
  );
}

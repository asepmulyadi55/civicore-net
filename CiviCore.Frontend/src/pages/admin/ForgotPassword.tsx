// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDarkMode from '../../admin/useDarkMode';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(t('forgot_password.err_email_empty')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t('forgot_password.err_email_invalid')); return; }
    setError('');
    setIsLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess(t('forgot_password.success_msg'));
    } catch (err) {
      setError(err.response?.data?.message || t('forgot_password.err_default'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`admin-theme min-h-screen bg-surface flex items-center justify-center p-4 transition-colors duration-400 ${dark ? 'dark' : ''}`}>
      <button onClick={toggleDark}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-surface shadow-lg border border-surface-var text-on-surface hover:text-primary hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer">
        <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
            <span className="material-icons text-primary text-4xl">apartment</span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Dwipapuri</h1>
          <p className="text-on-surface-var mt-2 font-medium">Password Recovery</p>
        </div>

        <div className="bg-surface dark:bg-surface-var border border-surface-var shadow-xl rounded-xl overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-on-surface">{t('forgot_password.title')}</h2>
              <p className="text-sm text-on-surface-var mt-1">{t('forgot_password.subtitle')}</p>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg flex items-start gap-3">
                <span className="material-icons text-emerald-500 mt-0.5">check_circle</span>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1.5">
                  {t('forgot_password.field_email')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-on-surface-var text-sm">mail</span>
                  </span>
                  <input
                    id="email" type="email" placeholder="admin@civicore.com"
                    className={`block w-full pl-10 pr-4 py-2.5 bg-surface border rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${error ? 'border-red-500' : 'border-surface-var'}`}
                    value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoFocus
                  />
                </div>
                {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>

              <button type="submit"
                className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isLoading}
              >
                <span className="material-icons text-lg">{isLoading ? 'hourglass_top' : 'send'}</span>
                <span>{isLoading ? t('forgot_password.btn_sending') : t('forgot_password.btn_send')}</span>
              </button>
            </form>
          </div>

          <div className="p-6 bg-surface-var border-t border-surface-var text-center">
            <Link to="/admin/login" className="group flex items-center justify-center gap-2 text-sm font-bold text-primary transition-colors hover:opacity-80">
              <span className="material-icons text-base">arrow_back</span>
              <span className="group-hover:underline">{t('forgot_password.back_login')}</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-on-surface-var uppercase tracking-widest font-medium">
          <p>© {new Date().getFullYear()} Dwipapuri Management System • v2.4.0</p>
          <div className="mt-2 space-x-4">
            <a className="hover:text-primary transition-colors" href="#">Security</a>
            <a className="hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="hover:text-primary transition-colors" href="#">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}

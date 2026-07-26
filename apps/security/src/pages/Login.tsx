// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthToken } from '@civicore/auth';
import useDarkMode from '../useDarkMode';

const RECAPTCHA_SITE_KEY = '6LcYAU4tAAAAAIOUBvSBiUsCre0iHTwZRds2WpI5';

const loadRecaptcha = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).grecaptcha) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionConflictModal, setSessionConflictModal] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const navigate = useNavigate();

  const handleSuccessfulLogin = (token: string, user: any) => {
    setAuthToken(token, 'security_token');
    localStorage.setItem('security_user', JSON.stringify(user));
    setAuthToken(token, 'admin_token');
    localStorage.setItem('admin_user', JSON.stringify(user));
    navigate('/');
  };

  const handleCaptchaLogin = async (captchaToken: string, force = false) => {
    try {
      const res = await axios.post('/api/auth/login-captcha', {
        email,
        password,
        captchaToken,
        force,
        rememberMe: remember
      });
      handleSuccessfulLogin(res.data.token, res.data.user);
    } catch (err: any) {
      if (err.response?.data?.active_session_conflict) {
        setSessionConflictModal(true);
      } else {
        setError(err.response?.data?.message || 'CAPTCHA verification failed');
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent, force = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/login', { email, password, force, rememberMe: remember });
      handleSuccessfulLogin(res.data.token, res.data.user);
    } catch (err: any) {
      if (err.response?.data?.active_session_conflict) {
        setSessionConflictModal(true);
      } else if (err.response?.data?.requires_captcha) {
        try {
          await loadRecaptcha();
          const captchaToken = await new Promise<string>((resolve, reject) => {
            (window as any).grecaptcha.ready(async () => {
              try {
                const token = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
                resolve(token);
              } catch (e) {
                reject(e);
              }
            });
          });
          await handleCaptchaLogin(captchaToken, force);
          return;
        } catch (captchaErr) {
          setError('Failed to complete background CAPTCHA verification');
        }
      } else {
        setError(err.response?.data?.message || 'Invalid email/username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = () => {
    setSessionConflictModal(false);
    handleSubmit(undefined, true);
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Bar with Brand & Dark Mode Toggle matching Admin Portal */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
            <span className="material-icons">shield</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              Dwipapuri
            </h1>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
              Security Portal
            </p>
          </div>
        </div>

        <button
          onClick={toggleDark}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="material-icons text-xl">{dark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      {/* Main Form Container matching Admin Login card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl">verified_user</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Enter your Security Guard credentials to access gate logs
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2.5 animate-in fade-in">
              <span className="material-icons text-lg shrink-0">error_outline</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                  person_outline
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="security@dwipapuri.com or guard01"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                  lock_outline
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-icons text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400 font-medium">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-icons text-base animate-spin">autorenew</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In to Security Gate'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer matching Admin Login */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Dwipapuri Residence. All rights reserved.
        </p>
      </div>

      {/* Active Session Conflict Modal Overlay */}
      {sessionConflictModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(2, 6, 23, 0.75)' }}
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
              <span className="material-icons text-3xl">devices</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              Active Session Detected
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              An active session was detected on another device or tab. Would you like to sign out the other device and sign in here?
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleForceLogin}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Disconnecting...' : 'Force Sign In & Disconnect Other Device'}
              </button>
              <button
                type="button"
                onClick={() => setSessionConflictModal(false)}
                disabled={loading}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

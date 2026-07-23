// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import useDarkMode from '../../admin/useDarkMode';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../admin/components/ui';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupQRCode, setSetupQRCode] = useState(null);
  const [setupSecret, setSetupSecret] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [dark, toggleDark] = useDarkMode();
  const { t } = useTranslation();
  const [sessionConflict, setSessionConflict] = useState<{
    open: boolean;
    minutes: number;
    loginType: 'password' | 'captcha' | '2fa' | 'google';
  } | null>(null);

  // Set by the axios 401 handler when the server kicked this browser because the
  // account was signed in somewhere else. Read once, then cleared.
  React.useEffect(() => {
    if (sessionStorage.getItem('logout_reason') === 'session_conflict') {
      sessionStorage.removeItem('logout_reason');
      setError(t(
        'login.error_session_conflict',
        'You were signed out because your account was signed in on another device.'
      ));
    }
  }, [t]);

  const [successMessage, setSuccessMessage] = useState(() => {
    const msg = location.state?.message;
    if (msg) {
      window.history.replaceState({}, document.title);
    }
    return msg;
  });

  const [tempToken, setTempToken] = useState<string | null>(null);
  const [tempUserStr, setTempUserStr] = useState<string | null>(null);

  React.useEffect(() => {
    if (localStorage.getItem('admin_token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  React.useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const msg = searchParams.get('message');
    const isError = searchParams.get('isError');
    const req2fa = searchParams.get('requires_2fa');
    const req2faSetup = searchParams.get('requires_2fa_setup');
    const email = searchParams.get('email');
    const activeConflict = searchParams.get('active_session_conflict');
    const conflictMinutes = searchParams.get('minutes');

    if (activeConflict === 'true') {
      if (email) setUsername(email);
      setSessionConflict({
        open: true,
        minutes: conflictMinutes ? parseInt(conflictMinutes, 10) : 1,
        loginType: 'google'
      });
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    if (msg) {
      if (isError) setError(msg);
      else setSuccessMessage(msg);
    }

    if (req2fa === 'true') {
      setRequires2FA(true);
      if (email) setUsername(email);
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    if (req2faSetup === 'true' && token) {
      setTempToken(token);
      if (userStr) setTempUserStr(userStr);
      if (email) setUsername(email);
      setIsSettingUp2FA(true);
      fetch2FASetup(email, '', token);
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    if (token && userStr && req2faSetup !== 'true') {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', userStr);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e?: any, force = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!username || !password) {
      setError(t('login.err_empty'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', {
        email: username,
        password: password,
        remember: remember,
        force: force,
      });
      const { token, user } = response.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.active_session_conflict) {
        setSessionConflict({
          open: true,
          minutes: err.response.data.last_active_minutes || 1,
          loginType: 'password'
        });
      } else if (err.response?.data?.requires_2fa) {
        setRequires2FA(true);
      } else if (err.response?.data?.requires_captcha) {
        setRequiresCaptcha(true);
      } else if (err.response?.data?.requires_2fa_setup) {
        setIsSettingUp2FA(true);
        fetch2FASetup(username, password);
      } else {
        setError(err.response?.data?.message || t('login.err_default'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const RECAPTCHA_SITE_KEY = '6LcYAU4tAAAAAIOUBvSBiUsCre0iHTwZRds2WpI5';

  const loadRecaptcha = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).grecaptcha) { resolve(); return; }
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const handleCaptchaLogin = async (e?: any, force = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!username || !password) { setError(t('login.err_empty')); return; }
    setIsLoading(true);
    setError(null);
    try {
      await loadRecaptcha();
      const token = await new Promise((resolve, reject) => {
        (window as any).grecaptcha.ready(async () => {
          try {
            const t = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
            resolve(t);
          } catch (e) {
            reject(e);
          }
        });
      });
      const response = await axios.post('/api/auth/login-captcha', {
        email: username,
        password,
        captchaToken: token,
        rememberMe: remember,
        force: force,
      });
      const { token: sessionToken, user } = response.data;
      localStorage.setItem('admin_token', sessionToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.active_session_conflict) {
        setSessionConflict({
          open: true,
          minutes: err.response.data.last_active_minutes || 1,
          loginType: 'captcha'
        });
      } else {
        setError(err.response?.data?.message || 'CAPTCHA login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetch2FASetup = async (userEmail = username, userPassword = password, tkn = tempToken) => {
    setIsLoading(true);
    try {
      const config = tkn ? { headers: { Authorization: `Bearer ${tkn}` } } : {};
      const response = await axios.post('/api/auth/2fa/setup', {
        email: userEmail,
        password: userPassword,
      }, config);
      setSetupQRCode(response.data.qrCode);
      setSetupSecret(response.data.secret);
    } catch (err) {
      setError('Failed to initialize 2FA setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e?: any, force = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!twoFaCode) {
      setError(t('login.err_code_empty'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (isSettingUp2FA) {
        const config = tempToken ? { headers: { Authorization: `Bearer ${tempToken}` } } : {};
        response = await axios.post('/api/auth/2fa/verify', { code: twoFaCode }, config);
        
        if (tempToken && tempUserStr) {
          localStorage.setItem('admin_token', tempToken);
          localStorage.setItem('admin_user', tempUserStr);
          axios.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`;
          navigate('/dashboard');
          return;
        } else {
          response = await axios.post('/api/auth/login-2fa', {
            email: username,
            password: password,
            code: twoFaCode,
            rememberMe: remember,
            force: force,
          });
        }
      } else {
        response = await axios.post('/api/auth/login-2fa', {
          email: username,
          password: password,
          code: twoFaCode,
          rememberMe: remember,
          force: force,
        });
      }

      if (response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.active_session_conflict) {
        setSessionConflict({
          open: true,
          minutes: err.response.data.last_active_minutes || 1,
          loginType: '2fa'
        });
      } else {
        setError(err.response?.data?.message || 'Invalid 2FA code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogin = () => {
    if (!sessionConflict) return;
    const type = sessionConflict.loginType;
    setSessionConflict(null);

    if (type === 'google') {
      window.location.href = '/api/auth/google?intent=login&force=true';
    } else if (type === 'captcha') {
      handleCaptchaLogin(undefined, true);
    } else if (type === '2fa') {
      handle2FASubmit(undefined, true);
    } else {
      handleLogin(undefined, true);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google?intent=login';
  };

  return (
    <div className={`admin-theme min-h-screen bg-surface flex flex-col transition-colors duration-400 ${dark ? 'dark' : ''}`}>
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
              <span className="material-icons text-primary text-4xl">apartment</span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Dwipapuri</h1>
            <p className="text-on-surface-var mt-2 font-medium">Internal Admin Dashboard</p>
          </div>

          <div className="bg-surface dark:bg-surface-var border border-surface-var shadow-xl rounded-xl overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-on-surface">Sign In</h2>
                <p className="text-sm text-on-surface-var mt-1">Access the community management system</p>
              </div>

              {successMessage && (
                <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg flex items-start gap-3">
                  <span className="material-icons text-emerald-500 mt-0.5">check_circle</span>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {requiresCaptcha ? (
                <form onSubmit={handleCaptchaLogin} className="space-y-5" noValidate>
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                      <span className="material-icons text-emerald-600 text-3xl">verified_user</span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface mb-1">Security Verification</h3>
                    <p className="text-sm text-on-surface-var">
                      Click the button below to verify. Google reCAPTCHA will run silently in the background.
                    </p>
                  </div>
                  <button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><span className="material-icons text-sm animate-spin">autorenew</span> Verifying...</>
                    ) : (
                      <><span className="material-icons text-sm">shield</span> Verify &amp; Sign In</>
                    )}
                  </button>
                  <button type="button" onClick={() => setRequiresCaptcha(false)} className="w-full text-sm text-center text-on-surface-var hover:text-on-surface underline cursor-pointer">
                    ← Back to login
                  </button>
                </form>
              ) : requires2FA ? (
                <form onSubmit={handle2FASubmit} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="twoFaCode">
                      Authenticator Code
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-on-surface-var text-sm">lock_clock</span>
                      </span>
                      <input
                        className="block w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-var rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                        id="twoFaCode"
                        name="twoFaCode"
                        placeholder="123456"
                        type="text"
                        maxLength="6"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    type="submit"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false);
                      setError(null);
                    }}
                    className="w-full mt-3 py-3 px-4 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-on-surface-var hover:text-on-surface hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </form>
              ) : isSettingUp2FA ? (
                <form onSubmit={handle2FASubmit} className="space-y-5" noValidate>
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Mandatory Security</p>
                    <p className="text-sm text-on-surface-var">You must set up Two-Factor Authentication using Google Authenticator or a similar app.</p>
                  </div>

                  {setupQRCode ? (
                    <div className="flex justify-center mb-4 bg-white p-2 rounded-lg inline-block mx-auto border">
                      <img src={setupQRCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  ) : (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="twoFaCode">
                      Enter the 6-digit code to verify setup
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-on-surface-var text-sm">lock_clock</span>
                      </span>
                      <input
                        className="block w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-var rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                        id="twoFaCode"
                        name="twoFaCode"
                        placeholder="123456"
                        type="text"
                        maxLength="6"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    type="submit"
                    disabled={isLoading || !setupQRCode}
                  >
                    <span>{isLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingUp2FA(false);
                      setSetupQRCode(null);


                      setError(null);
                    }}
                    className="w-full mt-3 py-3 px-4 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-on-surface-var hover:text-on-surface hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="username">
                      Username or Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-on-surface-var text-sm">alternate_email</span>
                      </span>
                      <input
                        className={`block w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-var rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none ${!username && error === 'Please enter your username/email and password.' ? 'border-red-500 dark:border-red-500' : ''}`}
                        id="username"
                        name="username"
                        placeholder="admin@civicore.com"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-on-surface-var text-sm">lock_outline</span>
                      </span>
                      <input
                        className={`block w-full pl-10 pr-10 py-2.5 bg-surface border border-surface-var rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden ${!password && error === 'Please enter your username/email and password.' ? 'border-red-500 dark:border-red-500' : ''}`}
                        id="password"
                        name="password"
                        placeholder={t('login.field_password_placeholder')}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-var hover:text-on-surface cursor-pointer"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-icons text-sm">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      className="w-4 h-4 text-primary bg-surface border-surface-var rounded focus:ring-primary"
                      id="remember"
                      name="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label className="ml-2 text-sm text-on-surface-var" htmlFor="remember">
                      Remember this device
                    </label>
                  </div>

                  <button
                    className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    type="submit"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'Signing in...' : 'Login to Dashboard'}</span>
                  </button>
                </form>
              )}

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-var" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface dark:bg-surface-var px-4 text-on-surface-var font-semibold tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:scale-[1.02] hover:shadow-md py-3 px-4 rounded-lg transition-all duration-200 group shadow-sm cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-bold text-slate-700 dark:text-white">Sign in with Google</span>
              </button>
            </div>

            <div className="p-6 bg-surface-var border-t border-surface-var text-center">
              <p className="text-sm text-on-surface-var">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-bold hover:opacity-80 transition-opacity">
                  Register a new account
                </Link>
              </p>
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
      </main>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={toggleDark}
          className="p-3 rounded-full bg-surface shadow-lg border border-surface-var text-on-surface hover:text-primary hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer"
          title="Toggle dark mode"
        >
          <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      <ConfirmModal
        open={Boolean(sessionConflict?.open)}
        onClose={() => setSessionConflict(null)}
        onConfirm={handleForceLogin}
        title={t('sidebar.session_conflict_title', 'Active Session Detected')}
        message={t('sidebar.session_conflict_msg', 'Your account is currently active on another device (last active {{minutes}} minute(s) ago). Signing in now will log out the other device. Do you want to continue?', { minutes: sessionConflict?.minutes || 1 })}
        confirmLabel={t('sidebar.btn_force_login', 'Log Out Other Device & Continue')}
        icon="devices_other"
      />
    </div>
  );
}

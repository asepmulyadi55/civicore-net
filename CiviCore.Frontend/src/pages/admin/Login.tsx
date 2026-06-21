// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import useDarkMode from '../../admin/useDarkMode';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [dark, toggleDark] = useDarkMode();
  
  const [successMessage, setSuccessMessage] = useState(location.state?.message);

  React.useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const msg = searchParams.get('message');
    const isError = searchParams.get('isError');

    if (msg) {
      if (isError) setError(msg);
      else setSuccessMessage(msg);
    }

    if (token && userStr) {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', userStr);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/admin/dashboard');
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', {
        email: username,
        password: password,
        remember: remember,
      });
      const { token, user } = response.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google?intent=login';
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col transition-colors duration-400">
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
                    <Link to="/admin/forgot-password" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity">
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
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-var hover:text-on-surface"
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
                  className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isLoading}
                >
                  <span>{isLoading ? 'Signing in...' : 'Login to Dashboard'}</span>
                </button>
              </form>

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
                className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 py-3 px-4 rounded-lg transition-all duration-200 group shadow-sm"
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
                <Link to="/admin/register" className="text-primary font-bold hover:opacity-80 transition-opacity">
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
          className="p-3 rounded-full bg-surface shadow-lg border border-surface-var text-on-surface hover:text-primary transition-all duration-200"
          title="Toggle dark mode"
        >
          <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </div>
  );
}

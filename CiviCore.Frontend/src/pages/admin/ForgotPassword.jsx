import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDarkMode from '../../admin/useDarkMode';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    setError('');
    setIsLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess('If this email exists in our system, a reset link has been sent. Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <button onClick={toggleDark}
        className="fixed bottom-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-200">
        <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
            <span className="material-icons text-primary text-4xl">apartment</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dwipapuri</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Password Recovery</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-slate-800 shadow-xl rounded-xl overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Forgot Password?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your registered email and we'll send a reset link.</p>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg flex items-start gap-3">
                <span className="material-icons text-emerald-500 mt-0.5">check_circle</span>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-slate-400 text-sm">mail</span>
                  </span>
                  <input
                    id="email" type="email" placeholder="admin@civicore.com"
                    className={`block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                    value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoFocus
                  />
                </div>
                {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>

              <button type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={isLoading}
              >
                <span className="material-icons text-lg">{isLoading ? 'hourglass_top' : 'send'}</span>
                <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>
            </form>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link to="/admin/login" className="group flex items-center justify-center gap-2 text-sm font-bold text-primary transition-colors">
              <span className="material-icons text-base">arrow_back</span>
              <span className="group-hover:underline">Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

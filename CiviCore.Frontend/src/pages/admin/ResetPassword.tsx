// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useDarkMode from '../../admin/useDarkMode';

function PasswordInput({ id, name, placeholder, value, onChange, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons text-on-surface-var text-sm">lock_outline</span>
      </span>
      <input
        className="block w-full pl-10 pr-10 py-2.5 bg-surface border border-surface-var rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        id={id} name={name} placeholder={placeholder} type={show ? 'text' : 'password'}
        value={value} onChange={onChange} disabled={disabled}
      />
      <button type="button" onClick={() => setShow(s => !s)} disabled={disabled}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-var hover:text-on-surface">
        <span className="material-icons text-sm">{show ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  );
}

function PasswordValidation({ password }) {
  if (!password) return null;

  const reqs = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <ul className="mt-2 space-y-1">
      {reqs.map((req, i) => (
        <li key={i} className={`flex items-center text-xs ${req.valid ? 'text-emerald-500' : 'text-on-surface-var'}`}>
          <span className="material-icons text-[14px] mr-1.5">
            {req.valid ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          {req.label}
        </li>
      ))}
    </ul>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid password reset link. Please request a new one.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email) return;
    
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Please ensure your password meets all requirements.'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    setError('');
    setIsLoading(true);
    
    try {
      await axios.post('/api/auth/reset-password', { 
        email, 
        token, 
        newPassword: password 
      });
      setSuccess('Your password has been successfully reset. You can now login with your new password.');
      setTimeout(() => navigate('/admin/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. The link might have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 transition-colors duration-400">
      <button onClick={toggleDark}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-surface shadow-lg border border-surface-var text-on-surface hover:text-primary hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer">
        <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
            <span className="material-icons text-primary text-4xl">vpn_key</span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Dwipapuri</h1>
          <p className="text-on-surface-var mt-2 font-medium">Create New Password</p>
        </div>

        <div className="bg-surface dark:bg-surface-var border border-surface-var shadow-xl rounded-xl overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-on-surface">Reset Password</h2>
              {email && <p className="text-sm text-on-surface-var mt-1">For {email}</p>}
            </div>

            {success ? (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg flex items-start gap-3">
                <span className="material-icons text-emerald-500 mt-0.5">check_circle</span>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}<br/>Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-on-surface mb-1.5">
                    New Password
                  </label>
                  <PasswordInput 
                    id="password" name="password" placeholder="••••••••" 
                    value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} 
                    disabled={!token}
                  />
                  <PasswordValidation password={password} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-on-surface mb-1.5">
                    Confirm New Password
                  </label>
                  <PasswordInput 
                    id="confirmPassword" name="confirmPassword" placeholder="••••••••" 
                    value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} 
                    disabled={!token}
                  />
                  {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                <button type="submit"
                  className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isLoading || !token}
                >
                  <span className="material-icons text-lg">{isLoading ? 'hourglass_top' : 'save'}</span>
                  <span>{isLoading ? 'Saving...' : 'Reset Password'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="p-6 bg-surface-var border-t border-surface-var text-center">
            <Link to="/admin/login" className="group flex items-center justify-center gap-2 text-sm font-bold text-primary transition-colors hover:opacity-80">
              <span className="material-icons text-base">arrow_back</span>
              <span className="group-hover:underline">Back to Login</span>
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

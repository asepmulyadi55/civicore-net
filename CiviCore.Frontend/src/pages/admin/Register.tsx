// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useDarkMode from '../../admin/useDarkMode';

function PasswordInput({ id, name, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons text-on-surface-var text-sm">lock_outline</span>
      </span>
      <input
        className="block w-full pl-10 pr-10 py-2.5 bg-surface border border-surface-var rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        id={id} name={name} placeholder={placeholder} type={show ? 'text' : 'password'}
        value={value} onChange={onChange}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-var hover:text-on-surface">
        <span className="material-icons text-sm">{show ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  );
}

function Field({ label, id, type = 'text', placeholder, icon, value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor={id}>{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="material-icons text-on-surface-var text-sm">{icon}</span>
        </span>
        <input
          className={`block w-full pl-10 pr-4 py-2.5 bg-surface border rounded-lg text-on-surface placeholder:text-on-surface-var focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${error ? 'border-red-500' : 'border-surface-var'}`}
          id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
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

export default function Register() {
  const [form, setForm] = useState({ fullname: '', email: '', username: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dark, toggleDark] = useDarkMode();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setErrors({ general: errorMsg });
    }
  }, [searchParams]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google?intent=register';
  };

  const validate = () => {
    const e = {};
    if (!form.fullname.trim()) e.fullname = 'Please enter your full name.';
    if (!form.email.trim()) e.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email.';
    if (!form.username.trim()) e.username = 'Please choose a username.';
    if (!form.password) e.password = 'Please enter a password.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!form.password_confirmation) e.password_confirmation = 'Please confirm your password.';
    else if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name: form.fullname,
        email: form.email,
        username: form.username,
        password: form.password,
        confirmPassword: form.password_confirmation,
      });
      navigate('/admin/login', { state: { message: 'Registration successful! Your account is pending admin approval.' } });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.message || 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 transition-colors duration-400">
      <button onClick={toggleDark}
        className="fixed bottom-6 right-6 p-3 bg-surface rounded-full shadow-lg border border-surface-var text-on-surface hover:text-primary transition-all duration-200">
        <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
            <span className="material-icons text-primary text-4xl">domain</span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Dwipapuri</h1>
          <p className="text-on-surface-var mt-2 font-medium">Internal Admin Dashboard</p>
        </div>

        <div className="bg-surface dark:bg-surface-var border border-surface-var shadow-xl rounded-xl overflow-hidden">
          <div className="p-8 space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-bold text-on-surface">Register Account</h2>
              <p className="text-sm text-on-surface-var mt-1">Join the community management system</p>
            </div>

            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Full Name" id="fullname" placeholder="John Doe" icon="person_outline" value={form.fullname} onChange={set('fullname')} error={errors.fullname} />
              <Field label="Email Address" id="email" type="email" placeholder="john@example.com" icon="mail_outline" value={form.email} onChange={set('email')} error={errors.email} />
              <Field label="Username" id="username" placeholder="johndoe_admin" icon="alternate_email" value={form.username} onChange={set('username')} error={errors.username} />

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Password</label>
                <PasswordInput id="password" name="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
                <PasswordValidation password={form.password} />
                {errors.password && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Confirm Password</label>
                <PasswordInput id="password_confirmation" name="password_confirmation" placeholder="••••••••" value={form.password_confirmation} onChange={set('password_confirmation')} />
                {errors.password_confirmation && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password_confirmation}</p>}
              </div>

              <button
                className="w-full bg-primary hover:opacity-90 text-white dark:text-surface font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                type="submit" disabled={isLoading}
              >
                <span>{isLoading ? 'Registering...' : 'Register Account'}</span>
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
              <span className="text-sm font-bold text-slate-700 dark:text-white">Sign up with Google</span>
            </button>
          </div>

          <div className="p-6 bg-surface-var border-t border-surface-var text-center">
            <p className="text-sm text-on-surface-var">
              Already have an account? <Link to="/admin/login" className="text-primary font-bold hover:underline">Back to Login</Link>
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
    </div>
  );
}

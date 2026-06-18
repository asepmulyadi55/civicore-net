// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useDarkMode from '../../admin/useDarkMode';

function PasswordInput({ id, name, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons text-slate-400 text-sm">lock_outline</span>
      </span>
      <input
        className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        id={id} name={name} placeholder={placeholder} type={show ? 'text' : 'password'}
        value={value} onChange={onChange}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <span className="material-icons text-sm">{show ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({ fullname: '', email: '', username: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

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
        password_confirmation: form.password_confirmation,
      });
      setSuccess('Registration successful! Your account is pending admin approval.');
      setForm({ fullname: '', email: '', username: '', password: '', password_confirmation: '' });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.message || 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const Field = ({ label, id, type = 'text', placeholder, field, icon }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor={id}>{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="material-icons text-slate-400 text-sm">{icon}</span>
        </span>
        <input
          className={`block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${errors[field] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
          id={id} type={type} placeholder={placeholder} value={form[field]} onChange={set(field)}
        />
      </div>
      {errors[field] && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <button onClick={toggleDark}
        className="fixed bottom-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-200">
        <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
            <span className="material-icons text-primary text-4xl">domain</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dwipapuri</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Internal Admin Dashboard</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-slate-800 shadow-xl rounded-xl overflow-hidden">
          <div className="p-8 space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Register Account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join the community management system</p>
            </div>

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg flex items-start gap-3">
                <span className="material-icons text-green-500 mt-0.5">check_circle</span>
                <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
              </div>
            )}

            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Full Name" id="fullname" field="fullname" placeholder="John Doe" icon="person_outline" />
              <Field label="Email Address" id="email" type="email" field="email" placeholder="john@example.com" icon="mail_outline" />
              <Field label="Username" id="username" field="username" placeholder="johndoe_admin" icon="alternate_email" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <PasswordInput id="password" name="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
                {errors.password && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <PasswordInput id="password_confirmation" name="password_confirmation" placeholder="••••••••" value={form.password_confirmation} onChange={set('password_confirmation')} />
                {errors.password_confirmation && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password_confirmation}</p>}
              </div>

              <button
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                type="submit" disabled={isLoading}
              >
                <span className="material-icons text-lg">{isLoading ? 'hourglass_top' : 'person_add'}</span>
                <span>{isLoading ? 'Registering...' : 'Register Account'}</span>
              </button>
            </form>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg flex gap-3">
              <span className="material-icons text-amber-500 text-lg flex-shrink-0">info</span>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                Note: Your account will require Admin activation before you can access the dashboard.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account? <Link to="/admin/login" className="text-primary font-bold hover:underline">Back to Login</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400 uppercase tracking-widest font-medium">
          <p>© {new Date().getFullYear()} Dwipapuri Management System • v2.4.0</p>
        </div>
      </div>
    </div>
  );
}

// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FormInput } from '@civicore/ui';
import useDarkMode from '../useDarkMode';

export function Settings() {
  const { t, i18n } = useTranslation();
  const [dark, toggleDark] = useDarkMode();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || i18n.language || 'en');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await axios.post('/api/profile/change-password', {
        currentPassword,
        newPassword
      });
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);

    // Sync language preference to stored user objects matching Admin Portal
    const secUser = localStorage.getItem('security_user');
    if (secUser && secUser !== 'undefined') {
      try {
        const parsed = JSON.parse(secUser);
        parsed.language = newLang;
        localStorage.setItem('security_user', JSON.stringify(parsed));
      } catch {}
    }

    const admUser = localStorage.getItem('admin_user');
    if (admUser && admUser !== 'undefined') {
      try {
        const parsed = JSON.parse(admUser);
        parsed.language = newLang;
        localStorage.setItem('admin_user', JSON.stringify(parsed));
      } catch {}
    }

    i18n.changeLanguage(newLang);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('settings.title', 'Security Settings')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('settings.sub', 'Manage your account password, portal preferences, and language')}
        </p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
        }`}>
          <span className="material-icons text-base">
            {msg.type === 'success' ? 'check_circle' : 'error_outline'}
          </span>
          {msg.text}
        </div>
      )}

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-icons text-xl">lock</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.change_pass_title', 'Change Password')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.change_pass_sub', 'Update your security account credentials')}
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <FormInput
            id="currentPass"
            type="password"
            label={t('settings.current_pass', 'Current Password')}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <FormInput
            id="newPass"
            type="password"
            label={t('settings.new_pass', 'New Password')}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <FormInput
            id="confirmPass"
            type="password"
            label={t('settings.confirm_pass', 'Confirm New Password')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Updating...' : t('settings.btn_update_pass', 'Update Password')}
          </button>
        </form>
      </div>

      {/* Language & Theme Preferences Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <span className="material-icons text-xl">translate</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.preferences', 'Preferences')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.pref_sub', 'Language and appearance options')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              {t('settings.language', 'Language')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  lang === 'en'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                English (US)
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('id')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  lang === 'id'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Bahasa Indonesia
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              {t('settings.theme_mode', 'Theme Mode')}
            </label>
            <button
              type="button"
              onClick={toggleDark}
              className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>{dark ? t('settings.dark_mode', 'Dark Mode Active') : t('settings.light_mode', 'Light Mode Active')}</span>
              <span className="material-icons text-base">{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

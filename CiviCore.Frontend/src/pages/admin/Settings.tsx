// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';

// ── Tab definitions ───────────────────────────────────────────────────────
const ALL_TABS = [
  { id: 'profile',   icon: 'person',              label: 'Profile' },
  { id: 'password',  icon: 'lock',                label: 'Password' },
  { id: 'security',  icon: 'admin_panel_settings', label: 'Security',   adminOnly: true },
  { id: 'memo',      icon: 'sticky_note_2',       label: 'Admin Memo', adminOnly: true },
  { id: 'posyandu',  icon: 'health_and_safety',   label: 'Posyandu',   adminOnly: true },
];

function Flash({ message, type = 'success' }) {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    error: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
  };
  const icons = { success: 'check_circle', error: 'error' };
  return (
    <div className={`mb-6 p-4 border rounded-xl flex items-center gap-3 ${styles[type]}`}>
      <span className="material-icons">{icons[type]}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────
function ProfileTab({ flash, setFlash }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    axios.get('/api/settings/profile').then(res => {
      setProfile(res.data);
      setName(res.data.name || '');
      setLanguage(res.data.language || 'en');
      setAvatarPreview(res.data.avatar || '');
    }).catch(() => {});
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('language', language);
      if (avatarFile) formData.append('avatar', avatarFile);
      await axios.put('/api/settings/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFlash({ message: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      setFlash({ message: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally { setSaving(false); }
  };

  const initials = (profile?.name || 'U').split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');

  return (
    <div className="space-y-6">
      {/* Photo */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-primary/10 border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt={profile?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{initials}</span>
            )}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700">
              <span className="material-icons text-sm">upload</span> Upload photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <p className="text-xs text-slate-400 mt-2">JPG, PNG or WEBP · Max 2 MB</p>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Identity</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
          <input type="email" value={profile?.email || ''} disabled
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 cursor-not-allowed" />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed here. Contact your admin if needed.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
          <input type="text" value={profile?.username || ''} disabled
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 cursor-not-allowed" />
        </div>
      </div>

      {/* Language */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Language</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ code: 'en', flag: 'GB', label: 'English' }, { code: 'id', flag: 'ID', label: 'Indonesian' }].map(lang => (
            <label key={lang.code} htmlFor={`lang-${lang.code}`}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                language === lang.code
                  ? 'border-primary bg-primary/5 dark:border-primary dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary/40'
              }`}>
              <input type="radio" name="language" id={`lang-${lang.code}`} value={lang.code}
                checked={language === lang.code} onChange={() => setLanguage(lang.code)} className="sr-only" />
              <span className="text-lg font-bold text-slate-600 dark:text-slate-300">{lang.flag}</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{lang.label}</span>
              <span className={`ml-auto material-icons text-base ${language === lang.code ? 'text-emerald-500' : 'text-slate-300'}`}>
                {language === lang.code ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">The UI will update immediately after saving.</p>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
          <span className="material-icons text-sm">save</span> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

// ── Password Tab ──────────────────────────────────────────────────────────
function PasswordTab({ flash, setFlash }) {
  const [form, setForm] = useState({ currentPassword: '', password: '', passwordConfirmation: '' });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get('/api/settings/profile').then(res => setProfile(res.data)).catch(() => {});
  }, []);

  const hasGoogleId = !!profile?.googleId;

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/password', form);
      setFlash({ message: 'Password changed successfully.', type: 'success' });
      setForm({ currentPassword: '', password: '', passwordConfirmation: '' });
    } catch (err) {
      setFlash({ message: err.response?.data?.message || 'Failed to change password.', type: 'error' });
    } finally { setSaving(false); }
  };

  const pw = form.password;
  const checks = [
    { id: 'length', label: 'At least 8 characters', pass: pw.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', pass: /[A-Z]/.test(pw) },
    { id: 'lower', label: 'One lowercase letter', pass: /[a-z]/.test(pw) },
    { id: 'number', label: 'One number', pass: /[0-9]/.test(pw) },
    { id: 'symbol', label: 'One special character', pass: /[^A-Za-z0-9]/.test(pw) },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-icons text-slate-500 text-lg">lock</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Change Password</h2>
          <p className="text-xs text-slate-500">{hasGoogleId ? 'You signed up with Google. Set a password for manual login.' : 'Update your account password'}</p>
        </div>
      </div>

      {!hasGoogleId && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
          <input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
        <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
      </div>

      {pw && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {checks.map(c => (
            <div key={c.id} className={`flex items-center gap-1.5 ${c.pass ? 'text-emerald-500' : 'text-slate-400'}`}>
              <span className="material-icons text-sm">{c.pass ? 'check_circle' : 'radio_button_unchecked'}</span>
              {c.label}
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
        <input type="password" value={form.passwordConfirmation} onChange={e => setForm(f => ({ ...f, passwordConfirmation: e.target.value }))}
          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
      </div>

      <div className="flex justify-end pt-1">
        <button onClick={handleSave} disabled={saving || !form.password || form.password !== form.passwordConfirmation}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
          <span className="material-icons text-sm">save</span> {saving ? 'Saving...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}

// ── Security Tab (admin only) ─────────────────────────────────────────────
function SecurityTab({ flash, setFlash }) {
  const [data, setData] = useState({ session_timeout_minutes: 30, ga_measurement_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/settings/security').then(res => setData(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/security', {
        sessionTimeoutMinutes: data.session_timeout_minutes,
        gaMeasurementId: data.ga_measurement_id
      });
      setFlash({ message: 'Security settings saved.', type: 'success' });
    } catch (err) {
      setFlash({ message: err.response?.data?.message || 'Failed to save.', type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-icons text-slate-500 text-lg">security</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Security Settings</h2>
          <p className="text-xs text-slate-500">Admin-only session control</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Session Timeout</label>
        <div className="flex items-center gap-3">
          <input type="number" min="5" max="120" step="5" value={data.session_timeout_minutes}
            onChange={e => setData(d => ({ ...d, session_timeout_minutes: Number(e.target.value) }))}
            className="w-32 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
          <span className="text-sm text-slate-500">minutes</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Auto-logout after this many minutes of inactivity (5–120)</p>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons text-slate-400 text-lg">bar_chart</span>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Google Analytics</h3>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Measurement ID</label>
          <input type="text" maxLength={20} value={data.ga_measurement_id}
            onChange={e => setData(d => ({ ...d, ga_measurement_id: e.target.value }))}
            placeholder="G-XXXXXXXXXX"
            className="w-full max-w-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-mono" />
          <p className="text-xs text-slate-400 mt-1">Leave empty to disable tracking. Format: <code>G-XXXXXXXXXX</code></p>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
          <span className="material-icons text-sm">save</span> {saving ? 'Saving...' : 'Save Security'}
        </button>
      </div>
    </div>
  );
}

// ── Admin Memo Tab ────────────────────────────────────────────────────────
function MemoTab({ flash, setFlash }) {
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/settings/memo').then(res => setMemo(res.data.admin_memo || '')).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/memo', { adminMemo: memo });
      setFlash({ message: 'Memo saved.', type: 'success' });
    } catch (err) {
      setFlash({ message: err.response?.data?.message || 'Failed to save.', type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-icons text-slate-500 text-lg">sticky_note_2</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Admin Memo</h2>
          <p className="text-xs text-slate-500">Internal notes visible only to administrators</p>
        </div>
      </div>

      <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={8} maxLength={1000}
        placeholder="Write your admin notes here..."
        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none transition-all" />
      <p className="text-xs text-slate-400 text-right">{memo.length}/1000</p>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
          <span className="material-icons text-sm">save</span> {saving ? 'Saving...' : 'Save Memo'}
        </button>
      </div>
    </div>
  );
}

// ── Posyandu Tab (admin only) ─────────────────────────────────────────────
function PosyanduTab({ flash, setFlash }) {
  const [data, setData] = useState({
    posyandu_baby_max_months: 12,
    posyandu_toddler_max_months: 36,
    posyandu_child_max_months: 72,
    posyandu_teen_max_months: 168,
    posyandu_adult_max_months: 720,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/settings/posyandu').then(res => setData(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/posyandu', {
        posyanduBabyMaxMonths: data.posyandu_baby_max_months,
        posyanduToddlerMaxMonths: data.posyandu_toddler_max_months,
        posyanduChildMaxMonths: data.posyandu_child_max_months,
        posyanduTeenMaxMonths: data.posyandu_teen_max_months,
        posyanduAdultMaxMonths: data.posyandu_adult_max_months,
      });
      setFlash({ message: 'Posyandu settings saved.', type: 'success' });
    } catch (err) {
      setFlash({ message: err.response?.data?.message || 'Failed to save.', type: 'error' });
    } finally { setSaving(false); }
  };

  const fields = [
    { key: 'posyandu_baby_max_months', label: 'Baby (max months)', icon: 'child_care', min: 1, max: 24 },
    { key: 'posyandu_toddler_max_months', label: 'Toddler (max months)', icon: 'escalator_warning', min: 2, max: 60 },
    { key: 'posyandu_child_max_months', label: 'Child (max months)', icon: 'boy', min: 12, max: 144 },
    { key: 'posyandu_teen_max_months', label: 'Teen (max months)', icon: 'person', min: 48, max: 216 },
    { key: 'posyandu_adult_max_months', label: 'Adult (max months)', icon: 'elderly', min: 120, max: 840 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-icons text-slate-500 text-lg">health_and_safety</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Posyandu Age Categories</h2>
          <p className="text-xs text-slate-500">Define the upper age limit (in months) for each category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="material-icons text-sm text-slate-400">{f.icon}</span>
              {f.label}
            </label>
            <input type="number" min={f.min} max={f.max} value={data[f.key]}
              onChange={e => setData(d => ({ ...d, [f.key]: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
            <p className="text-[11px] text-slate-400 mt-1">Range: {f.min} – {f.max} months</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
          <span className="material-icons text-sm">save</span> {saving ? 'Saving...' : 'Save Posyandu'}
        </button>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────
export default function Settings() {
  const { tab } = useParams();
  const activeTab = tab || 'profile';
  const [flash, setFlash] = useState({ message: '', type: 'success' });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const userStr = localStorage.getItem('admin_user');
  const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
  const isAdmin = (user.role || '').toLowerCase() === 'admin';

  const tabs = ALL_TABS.filter(t => !t.adminOnly || isAdmin);

  // Clear flash on tab change
  useEffect(() => { setFlash({ message: '', type: 'success' }); }, [activeTab]);

  const renderTab = () => {
    const props = { flash, setFlash };
    switch (activeTab) {
      case 'profile': return <ProfileTab {...props} />;
      case 'password': return <PasswordTab {...props} />;
      case 'security': return isAdmin ? <SecurityTab {...props} /> : null;
      case 'memo': return isAdmin ? <MemoTab {...props} /> : null;
      case 'posyandu': return isAdmin ? <PosyanduTab {...props} /> : null;
      default: return null;
    }
  };

  const tabTitle = tabs.find(t => t.id === activeTab)?.label || 'Account Settings';

  return (
    <AdminLayout title={tabTitle}>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Flash */}
        <Flash message={flash.message} type={flash.type} />

        {/* Active Tab Content */}
        {renderTab()}
      </div>
    </AdminLayout>
  );
}

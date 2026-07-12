// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Pagination, Modal, ConfirmModal,
  Avatar, PageHeader, FilterBar, SearchInput, SelectFilter,
  TableWrapper, Th, FormInput, FormSelect
} from '../../admin/components/ui';
import { useTranslation, Trans } from 'react-i18next';
import { usePermissions } from '../../admin/PermissionsContext';
import { formatApiErrors } from '../../utils/formatErrors';

interface UserRole {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role_id: number;
  roleName?: string;
  role?: UserRole;
  is_active: boolean;
  email_verified_at?: string;
  createdAt?: string;
  photo?: string;
}

interface UserStats {
  total: number;
  pending: number;
  active: number;
  admins: number;
}

interface PaginationMeta { current_page: number; last_page: number; from: number; to: number; total: number; }

function PasswordStrength({ password }: { password?: string }) {
  const { t } = useTranslation();
  const checks = [
    { label: t('users.pw_length'), test: (p: string) => p.length >= 8 },
    { label: t('users.pw_upper'), test: (p: string) => /[A-Z]/.test(p) },
    { label: t('users.pw_lower'), test: (p: string) => /[a-z]/.test(p) },
    { label: t('users.pw_number'), test: (p: string) => /[0-9]/.test(p) },
    { label: t('users.pw_special'), test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => {
        const pass = c.test(password);
        return (
          <div key={c.label} className={`flex items-center gap-2 text-xs ${pass ? 'text-emerald-500' : 'text-slate-400'}`}>
            <span className="material-icons text-sm">{pass ? 'check_circle' : 'radio_button_unchecked'}</span>
            {c.label}
          </div>
        );
      })}
    </div>
  );
}

function HouseholderSelect({ label, value, onChange, options, error }: { label: string, value: string, onChange: (val: string) => void, options: {value: string, label: string}[], error?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        {open ? (
            <input 
              type="text" autoFocus
              placeholder={t('users.hh_search')}
              value={search} onChange={e => setSearch(e.target.value)}
              className={`block w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
            />
        ) : (
            <div  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setOpen(true)} className={`block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-sm text-slate-900 dark:text-white cursor-pointer select-none flex justify-between items-center`}>
              <span className="truncate">{selected ? selected.label : t('users.hh_none')}</span>
              <span className="material-icons text-slate-400 text-sm">expand_more</span>
            </div>
        )}
        {open && <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none rotate-180">expand_more</span>}
        
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1B2236] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filtered.length === 0 ? <div className="p-3 text-sm text-slate-500 text-center">{t('users.hh_no_results')}</div> : 
             filtered.map(o => (
              <div key={o.value}  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                className={`px-4 py-2.5 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors ${value === o.value ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                {o.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function UserModal({ open, onClose, onSaved, data, roles, householders }: { open: boolean; onClose: () => void; onSaved: () => void; data: User | null; roles: UserRole[]; householders: any[] }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ name: '', username: '', email: '', role_id: '', password: '', password_confirmation: '', is_active: true, HouseholderId: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name || '', username: data.username || '', email: data.email || '', role_id: String(data.role_id) || '', password: '', password_confirmation: '', is_active: data.is_active !== false, HouseholderId: (data as any).householder_id || '' });
    else setForm({ name: '', username: '', email: '', role_id: '', password: '', password_confirmation: '', is_active: true, HouseholderId: '' });
    setErrors({}); setShowPw(false);
  }, [data, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('users.error_name_required', 'Name is required.');
    if (!form.username.trim()) errs.username = t('users.error_username_required', 'Username is required.');
    if (!form.email.trim()) errs.email = t('users.error_email_required', 'Email is required.');
    if (!form.role_id) errs.role_id = t('users.error_role_required', 'Role is required.');
    if (!form.HouseholderId) errs.HouseholderId = t('users.error_householder_required', 'Householder is required.');
    if (form.password && form.password !== form.password_confirmation) {
      errs.password_confirmation = t('users.error_password_mismatch', 'Kata sandi tidak cocok.');
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true); setErrors({});
    try {
      const payload: any = { ...form };
      if (!payload.HouseholderId) payload.HouseholderId = null;
      if (isEdit && !payload.password) { delete payload.password; delete payload.password_confirmation; }
      if (isEdit) await axios.put(`/api/users/${data!.id}`, payload);
      else await axios.post('/api/users', payload);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(formatApiErrors(err));
    } finally { setLoading(false); }
  };

  const roleOptions = (roles || []).map(r => ({ value: String(r.id), label: r.name }));
  const hhOptions = [{ value: '', label: t('users.hh_none') }, ...householders.map(h => ({ value: h.id, label: `${h.fullname} (Block ${h.block?.name || '-'}, Unit ${h.unit?.unitNumber || '-'})` }))];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('users.modal_edit_title') : t('users.modal_add_title')} size="lg">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t('users.full_name')} id="u-name" value={form.name} onChange={set('name')} error={errors.name} required />
          <FormInput label={t('users.username')} id="u-uname" value={form.username} onChange={set('username')} error={errors.username} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t('users.email')} id="u-email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
          <FormSelect label={t('users.role')} id="u-role" value={form.role_id} onChange={set('role_id')} options={roleOptions} error={errors.role_id} required placeholder={t('users.select_role')} />
        </div>
        <div>
          <HouseholderSelect label={t('users.linked_householder')} value={form.HouseholderId} onChange={(val) => setForm(p => ({ ...p, HouseholderId: val }))} options={hhOptions} error={errors.HouseholderId} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('users.password')} {isEdit && <span className="font-normal text-slate-400">{t('users.password_hint')}</span>}
          </label>
          <div className="relative">
            <input id="u-pw" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder={t('users.password_placeholder')}
              className={`block w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`} />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
              <span className="material-icons text-sm">{showPw ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          <PasswordStrength password={form.password} />
          {errors.password && <p className="mt-1.5 text-xs text-rose-600">{errors.password}</p>}
        </div>
        {form.password && (
          <FormInput label={t('users.confirm_password')} id="u-pw2" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} placeholder={t('users.password_placeholder')} />
        )}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="u-active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="u-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('users.active_account')}</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">{t('users.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('users.saving') : isEdit ? t('users.btn_save') : t('users.btn_create')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ApproveModal({ open, onClose, user, onApproved, householders }: { open: boolean; onClose: () => void; user: User | null; onApproved: () => void; householders: any[] }) {
  const { t } = useTranslation();
  const [roleId, setRoleId] = useState('');
  const [householderId, setHouseholderId] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
        axios.get('/api/roles').then(r => setRoles(Array.isArray(r.data) ? r.data : (r.data?.data || []))).catch(() => {});
        setHouseholderId((user as any)?.householder_id || '');
    }
  }, [open, user]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const handle = async () => {
    const errs: Record<string, string> = {};
    if (!roleId) errs.roleId = t('users.error_role_required', 'Role is required.');
    if (!householderId) errs.householderId = t('users.error_householder_required', 'Householder is required.');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true); setErrors({});
    try {
      await axios.post(`/api/users/${user!.id}/approve`, { 
        role_id: roleId, 
        HouseholderId: householderId || null 
      });
      onApproved(); onClose();
    } catch {} finally { setLoading(false); }
  };

  if (!user) return null;
  const hhOptions = [{ value: '', label: t('users.hh_none') }, ...householders.map(h => ({ value: h.id, label: `${h.fullname} (Block ${h.block?.name || '-'}, Unit ${h.unit?.unitNumber || '-'})` }))];

  return (
    <Modal open={open} onClose={onClose} title={t('users.approve_title')} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <Trans i18nKey="users.approve_message" values={{ name: user.name }}>
            Approve <strong className="text-slate-900 dark:text-white">{{name: user.name}}</strong> and assign a role.
          </Trans>
        </p>
        <FormSelect label={t('users.assign_role')} id="approve-role" value={roleId} onChange={e => setRoleId(e.target.value)} options={(roles || []).map(r => ({ value: String(r.id), label: r.name }))} placeholder={t('users.select_role')} error={errors.roleId} required />
        <HouseholderSelect label={t('users.linked_householder')} value={householderId} onChange={setHouseholderId} options={hhOptions} error={errors.householderId} />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">{t('users.btn_cancel')}</button>
          <button onClick={handle} disabled={loading} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex justify-center items-center gap-2 cursor-pointer hover:scale-[1.02] shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200">
            {loading ? t('users.approving') : t('users.btn_approve')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Users() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [householders, setHouseholders] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: User | null }>({ open: false, data: null });
  const [approveModal, setApproveModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: User | null; loading: boolean }>({ open: false, item: null, loading: false });
  const [qrConfirm, setQrConfirm] = useState<{ open: boolean; item: User | null; type: 'send' | 'regenerate' | null; loading: boolean }>({ open: false, item: null, type: null, loading: false });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes, sRes, hRes] = await Promise.all([
        axios.get('/api/users', { params: filters }),
        axios.get('/api/roles').catch(() => ({ data: [] })),
        axios.get('/api/users/stats').catch(() => ({ data: {} })),
        axios.get('/api/householders?per_page=1000').catch(() => ({ data: { data: [] } })),
      ]);
      const u = uRes.data;
      setData(Array.isArray(u) ? u : (u.data || []));
      setMeta(u.meta || null);
      setRoles(Array.isArray(rRes.data) ? rRes.data : (rRes.data?.data || []));
      setStats(sRes.data);
      setHouseholders(Array.isArray(hRes.data) ? hRes.data : (hRes.data?.data || []));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k: string, v: string | number) => setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try { await axios.delete(`/api/users/${confirm.item!.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch (err: any) { 
      alert(err.response?.data?.message || err.response?.data?.title || 'Failed to delete user. They might have related records.');
      setConfirm(c => ({ ...c, loading: false })); 
    }
  };

  const doQrAction = async () => {
    setQrConfirm(c => ({ ...c, loading: true }));
    setMessage(null);
    try {
      if (qrConfirm.type === 'send') {
        await axios.post(`/api/users/${qrConfirm.item!.id}/2fa/send-qr`);
        setMessage({ type: 'success', text: t('users.alert_qr_sent', 'Email sent!') });
      } else {
        await axios.post(`/api/users/${qrConfirm.item!.id}/2fa/regenerate-qr`);
        setMessage({ type: 'success', text: t('users.alert_qr_regen', 'Email sent with new QR code!') });
      }
      setTimeout(() => setMessage(null), 5000);
      setQrConfirm({ open: false, item: null, type: null, loading: false });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send.' });
      setTimeout(() => setMessage(null), 5000);
      setQrConfirm({ open: false, item: null, type: null, loading: false });
    }
  };

  const roleOptions = roles.map(r => ({ value: String(r.id), label: r.name }));
  const statCards = [
    { label: t('users.stat_total'), value: stats?.total ?? 0, icon: 'group', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: t('users.stat_pending'), value: stats?.pending ?? 0, icon: 'pending', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: t('users.stat_active'), value: stats?.active ?? 0, icon: 'person', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: t('users.stat_admins'), value: stats?.admins ?? 0, icon: 'admin_panel_settings', iconBg: 'bg-indigo-100 dark:bg-indigo-500/10', iconColor: 'text-indigo-500' },
  ];

  return (
    <AdminLayout title={t('users.title')}>
      <UserModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} roles={roles} householders={householders} />
      <ApproveModal open={approveModal.open} onClose={() => setApproveModal({ open: false, user: null })} user={approveModal.user} onApproved={fetchData} householders={householders} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="person_remove"
        title={t('users.delete_title')} message={t('users.delete_message', { name: confirm.item?.name, defaultValue: `Permanently delete <strong>{{name}}</strong>? This cannot be undone.` })}
        confirmLabel={t('users.btn_delete')} />
      <ConfirmModal open={qrConfirm.open} onClose={() => setQrConfirm({ open: false, item: null, type: null, loading: false })}
        onConfirm={doQrAction} loading={qrConfirm.loading} icon={qrConfirm.type === 'send' ? 'qr_code' : 'autorenew'}
        title={qrConfirm.type === 'send' ? t('users.confirm_send_qr_title', 'Send QR Code') : t('users.confirm_regen_qr_title', 'Regenerate QR Code')} 
        message={qrConfirm.type === 'send' ? t('users.confirm_send_qr', 'Send existing 2FA QR code to this user via email?') : t('users.confirm_regen_qr', 'Regenerate 2FA secret and send new QR code to this user? They will need to update their authenticator app.')}
        confirmLabel={t('users.btn_send', 'Send')}
        confirmClass="bg-indigo-600 hover:bg-indigo-700 text-white" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${s.iconBg}`}><span className={`material-icons ${s.iconColor}`}>{s.icon}</span></div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <PageHeader
        title={t('users.header_title')}
        subtitle={t('users.header_subtitle')}
        actions={
          can('users.create') && (
            <button onClick={() => setModal({ open: true, data: null })}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="material-icons text-sm">person_add</span> {t('users.btn_add_user')}
            </button>
          )
        }
      />

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30'}`}>
          <span className="material-icons text-xl">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100 flex items-center justify-center"><span className="material-icons text-sm">close</span></button>
        </div>
      )}

      <FilterBar>
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder={t('users.search_placeholder')} />
        <SelectFilter value={filters.role} onChange={v => setFilter('role', v)} options={roleOptions} placeholder={t('users.all_roles')} />
        <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
          options={[{ value: 'active', label: t('users.status_active') }, { value: 'inactive', label: t('users.status_inactive') }, { value: 'pending', label: t('users.status_pending') }]}
          placeholder={t('users.all_status')} />
        <button onClick={() => setFilters({ search: '', role: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> {t('users.btn_clear')}
        </button>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>{t('users.th_user')}</Th>
              <Th>{t('users.th_role')}</Th>
              <Th>{t('users.th_status')}</Th>
              <Th>{t('users.th_joined')}</Th>
              <Th className="text-center">{t('users.th_actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="manage_accounts" title={t('users.empty_title')} subtitle={t('users.empty_subtitle')} /></td></tr>
            ) : data.map((u: User) => {
              const isPending = !u.is_active && !u.email_verified_at;
              return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} photo={u.photo} size={10} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{u.name}</p>
                          {isPending && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase">{t('users.badge_pending')}</span>}
                        </div>
                        <p className="text-xs text-slate-400">{u.email}</p>
                        {u.username && <p className="text-xs text-slate-400">@{u.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                      {u.role?.name || u.roleName || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={isPending ? 'pending' : u.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {isPending && can('users.approve') && (
                        <button onClick={() => setApproveModal({ open: true, user: u })}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-all cursor-pointer">
                          <span className="material-icons text-sm">how_to_reg</span> {t('users.tooltip_approve')}
                        </button>
                      )}
                      {can('users.edit') && (
                        <button onClick={() => setModal({ open: true, data: u })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer" title={t('users.tooltip_edit')}>
                          <span className="material-icons text-lg">edit</span>
                        </button>
                      )}
                      {can('users.edit') && !isPending && u.is_active && (
                        <button onClick={async () => { try { await axios.post(`/api/users/${u.id}/deactivate`); fetchData(); } catch {} }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer" title={t('users.tooltip_deactivate')}>
                          <span className="material-icons text-lg">person_off</span>
                        </button>
                      )}
                      {can('users.edit') && !isPending && !u.is_active && (
                        <button onClick={async () => { try { await axios.post(`/api/users/${u.id}/reactivate`); fetchData(); } catch {} }} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer" title={t('users.tooltip_reactivate')}>
                          <span className="material-icons text-lg">person_add</span>
                        </button>
                      )}
                      {can('users.edit') && !isPending && (
                        <button onClick={() => setQrConfirm({ open: true, item: u, type: 'send', loading: false })} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer" title={t('users.tooltip_send_qr', 'Send Existing 2FA QR Code')}>
                          <span className="material-icons text-lg">qr_code</span>
                        </button>
                      )}
                      {can('users.edit') && !isPending && (
                        <button onClick={() => setQrConfirm({ open: true, item: u, type: 'regenerate', loading: false })} className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer" title={t('users.tooltip_regen_qr', 'Regenerate & Send New 2FA QR Code')}>
                          <span className="material-icons text-lg">autorenew</span>
                        </button>
                      )}
                      {can('users.delete') && (
                        <button onClick={() => setConfirm({ open: true, item: u, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer" title={t('users.tooltip_delete')}>
                          <span className="material-icons text-lg">person_remove</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {meta && (
            <tfoot>
              <tr><td colSpan={5}><Pagination meta={meta} onChange={p => setFilters(f => ({ ...f, page: p }))} /></td></tr>
            </tfoot>
          )}
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

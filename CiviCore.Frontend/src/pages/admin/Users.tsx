// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Pagination, Modal, ConfirmModal,
  Avatar, PageHeader, FilterBar, SearchInput, SelectFilter,
  TableWrapper, Th, FormInput, FormSelect
} from '../../admin/components/ui';

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
  const checks = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
    { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
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

function UserModal({ open, onClose, onSaved, data, roles }: { open: boolean; onClose: () => void; onSaved: () => void; data: User | null; roles: UserRole[] }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ name: '', username: '', email: '', role_id: '', password: '', password_confirmation: '', is_active: true });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name || '', username: data.username || '', email: data.email || '', role_id: String(data.role_id) || '', password: '', password_confirmation: '', is_active: data.is_active !== false });
    else setForm({ name: '', username: '', email: '', role_id: '', password: '', password_confirmation: '', is_active: true });
    setErrors({}); setShowPw(false);
  }, [data, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      const payload: any = { ...form };
      if (isEdit && !payload.password) { delete payload.password; delete payload.password_confirmation; }
      if (isEdit) await axios.put(`/api/users/${data!.id}`, payload);
      else await axios.post('/api/users', payload);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  const roleOptions = (roles || []).map(r => ({ value: String(r.id), label: r.name }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Create User'} size="lg">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Full Name" id="u-name" value={form.name} onChange={set('name')} error={errors.name} required />
          <FormInput label="Username" id="u-uname" value={form.username} onChange={set('username')} error={errors.username} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Email" id="u-email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
          <FormSelect label="Role" id="u-role" value={form.role_id} onChange={set('role_id')} options={roleOptions} error={errors.role_id} required placeholder="Select Role" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Password {isEdit && <span className="font-normal text-slate-400">(leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <input id="u-pw" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••••"
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
          <FormInput label="Confirm Password" id="u-pw2" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} placeholder="••••••••" />
        )}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="u-active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="u-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active account</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ApproveModal({ open, onClose, user, onApproved }: { open: boolean; onClose: () => void; user: User | null; onApproved: () => void }) {
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) axios.get('/api/roles').then(r => setRoles(Array.isArray(r.data) ? r.data : (r.data?.data || []))).catch(() => {});
  }, [open]);

  const handle = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/users/${user!.id}/approve`, { role_id: roleId });
      onApproved(); onClose();
    } catch {} finally { setLoading(false); }
  };

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="Approve User" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">Approve <strong className="text-slate-900 dark:text-white">{user.name}</strong> and assign a role.</p>
        <FormSelect label="Assign Role" id="approve-role" value={roleId} onChange={e => setRoleId(e.target.value)} options={(roles || []).map(r => ({ value: String(r.id), label: r.name }))} placeholder="Select Role" required />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
          <button onClick={handle} disabled={!roleId || loading} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex justify-center items-center gap-2 cursor-pointer hover:scale-[1.02] shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200">
            {loading ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: User | null }>({ open: false, data: null });
  const [approveModal, setApproveModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: User | null; loading: boolean }>({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes, sRes] = await Promise.all([
        axios.get('/api/users', { params: filters }),
        axios.get('/api/roles').catch(() => ({ data: [] })),
        axios.get('/api/users/stats').catch(() => ({ data: {} })),
      ]);
      const u = uRes.data;
      setData(Array.isArray(u) ? u : (u.data || []));
      setMeta(u.meta || null);
      setRoles(Array.isArray(rRes.data) ? rRes.data : (rRes.data?.data || []));
      setStats(sRes.data);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k: string, v: string | number) => setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try { await axios.delete(`/api/users/${confirm.item!.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  const roleOptions = roles.map(r => ({ value: String(r.id), label: r.name }));
  const statCards = [
    { label: 'Total Users', value: stats?.total ?? 0, icon: 'group', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Pending Approval', value: stats?.pending ?? 0, icon: 'pending', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Active', value: stats?.active ?? 0, icon: 'person', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Admins', value: stats?.admins ?? 0, icon: 'admin_panel_settings', iconBg: 'bg-indigo-100 dark:bg-indigo-500/10', iconColor: 'text-indigo-500' },
  ];

  return (
    <AdminLayout title="User Management">
      <UserModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} roles={roles} />
      <ApproveModal open={approveModal.open} onClose={() => setApproveModal({ open: false, user: null })} user={approveModal.user} onApproved={fetchData} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="person_remove"
        title="Delete User?" message={`Permanently delete <strong>${confirm.item?.name}</strong>? This cannot be undone.`}
        confirmLabel="Yes, Delete" />

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
        title="Users & Access"
        subtitle="Manage system users, roles, and approvals"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
            <span className="material-icons text-sm">person_add</span> Add User
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder="Search name, email, username…" />
        <SelectFilter value={filters.role} onChange={v => setFilter('role', v)} options={roleOptions} placeholder="All Roles" />
        <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'pending', label: 'Pending Approval' }]}
          placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', role: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="manage_accounts" title="No users found" subtitle="Try adjusting your filters" /></td></tr>
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
                          {isPending && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase">Pending</span>}
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
                      {isPending && (
                        <button onClick={() => setApproveModal({ open: true, user: u })}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-all cursor-pointer">
                          <span className="material-icons text-sm">how_to_reg</span> Approve
                        </button>
                      )}
                      <button onClick={() => setModal({ open: true, data: u })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      {!isPending && u.is_active && (
                        <button onClick={async () => { try { await axios.post(`/api/users/${u.id}/deactivate`); fetchData(); } catch {} }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer" title="Deactivate">
                          <span className="material-icons text-lg">person_off</span>
                        </button>
                      )}
                      {!isPending && !u.is_active && (
                        <button onClick={async () => { try { await axios.post(`/api/users/${u.id}/reactivate`); fetchData(); } catch {} }} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer" title="Reactivate">
                          <span className="material-icons text-lg">person_add</span>
                        </button>
                      )}
                      <button onClick={() => setConfirm({ open: true, item: u, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer" title="Delete">
                        <span className="material-icons text-lg">person_remove</span>
                      </button>
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

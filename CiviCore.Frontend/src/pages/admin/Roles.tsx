// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, TableWrapper, Th, EmptyState, Modal, ConfirmModal, FormInput } from '../../admin/components/ui';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: string[];
  users_count?: number;
}

function RoleModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Role | null }) {
  const isEdit = !!data?.id;
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { setName(data?.name || ''); setErrors({}); }, [data, open]);

  const handleSave = async () => {
    if (!name.trim()) { setErrors({ name: 'Role name is required.' }); return; }
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/roles/${data!.id}`, { name });
      else await axios.post('/api/roles', { name });
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Role' : 'Create Role'} size="sm">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Role Name" id="role-name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required placeholder="e.g. Treasurer" />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; data: Role | null }>({ open: false, data: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: Role | null; loading: boolean }>({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/roles');
      setRoles(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setRoles([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try { await axios.delete(`/api/roles/${confirm.item!.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm((c) => ({ ...c, loading: false })); }
  };

  const SYSTEM_ROLES = ['admin', 'super-admin', 'superadmin'];

  return (
    <AdminLayout title="Roles">
      <RoleModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title="Delete Role?" message={`Delete role <strong>${confirm.item?.name}</strong>? Users with this role may lose access.`}
        confirmLabel="Yes, Delete" />

      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage system roles assigned to users"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Create Role
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>Role Name</Th>
              <Th>Users</Th>
              <Th>Type</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {roles.length === 0 ? (
              <tr><td colSpan={4}><EmptyState icon="admin_panel_settings" title="No roles found" subtitle="Create your first role" /></td></tr>
            ) : roles.map((r) => {
              const isSystem = SYSTEM_ROLES.includes(r.name.toLowerCase());
              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSystem ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <span className={`material-icons text-sm ${isSystem ? 'text-primary' : 'text-slate-500'}`}>
                          {isSystem ? 'shield' : 'manage_accounts'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{r.users_count ?? 0} users</td>
                  <td className="px-6 py-4">
                    {isSystem ? (
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">System</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold">Custom</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setModal({ open: true, data: r })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      {!isSystem && (
                        <button onClick={() => setConfirm({ open: true, item: r, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                          <span className="material-icons text-lg">delete_outline</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

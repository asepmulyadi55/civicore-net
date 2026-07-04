// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, TableWrapper, Th, EmptyState, Modal, ConfirmModal, FormInput } from '../../admin/components/ui';
import { useTranslation, Trans } from 'react-i18next';
import { usePermissions } from '../../admin/PermissionsContext';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: string[];
  users_count?: number;
}

const AVAILABLE_PERMISSIONS = {
  dashboard: ['view'],
  householders: ['view', 'create', 'edit', 'delete'],
  blocks: ['view', 'create', 'edit', 'delete'],
  organization: ['view', 'create', 'edit', 'delete'],
  meetings: ['view', 'create', 'edit', 'delete'],
  posyandu: ['view', 'create', 'edit', 'delete'],
  finance: ['view', 'create', 'edit', 'delete', 'approve'],
  payments: ['view', 'create', 'edit', 'delete', 'approve'],
  reports: ['view'],
  users: ['view', 'create', 'edit', 'delete', 'approve'],
  roles: ['view', 'create', 'edit', 'delete'],
  media: ['view', 'delete'],
  homepage_hero: ['view', 'edit'],
  homepage_events: ['view', 'create', 'edit', 'delete'],
  homepage_gallery: ['view', 'create', 'edit', 'delete'],
  homepage_bulletin: ['view', 'create', 'edit', 'delete'],
  homepage_property: ['view', 'create', 'edit', 'delete'],
  homepage_navigation: ['view', 'create', 'edit', 'delete'],
  homepage_footer: ['view', 'edit'],
  homepage_metadata: ['view', 'edit'],
  overview: ['view'],
  my_household: ['view', 'edit'],
  settings_profile: ['view', 'edit'],
  settings_password: ['view', 'edit'],
  settings_security: ['view', 'edit'],
  settings_memo: ['view', 'edit']
};

function RoleModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Role | null }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const isSystem = ['admin', 'super-admin', 'superadmin'].includes((data?.name || '').toLowerCase());
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(data?.name || '');
    setErrors({});
    if (data?.permissions) {
      const set = new Set<string>();
      data.permissions.forEach((p: any) => set.add(p.permissionKey || p));
      setSelectedPerms(set);
    } else {
      setSelectedPerms(new Set());
    }
  }, [data, open]);

  const togglePerm = (key: string) => {
    if (isSystem) return;
    const next = new Set(selectedPerms);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedPerms(next);
  };

  const handleSave = async () => {
    if (!name.trim()) { setErrors({ name: 'Role name is required.' }); return; }
    setLoading(true); setErrors({});
    try {
      const payload = {
        name,
        permissions: Array.from(selectedPerms).map(p => ({ permissionKey: p }))
      };
      if (isEdit) await axios.put(`/api/roles/${data!.id}`, payload);
      else await axios.post('/api/roles', payload);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('roles.modal_edit_title') : t('roles.modal_create_title')} size="lg">
      <div className="space-y-6">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        
        <FormInput label={t('roles.role_name')} id="role-name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required placeholder={t('roles.role_name_placeholder')} disabled={isSystem} />

        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">{t('roles.permissions')}</h3>
          {isSystem && <p className="text-xs text-primary mb-3 p-2 bg-primary/10 rounded">{t('roles.system_permissions_note')}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(AVAILABLE_PERMISSIONS).map(([module, actions]) => (
              <div key={module} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 capitalize mb-3 text-sm">{module.replace(/_/g, ' ')}</h4>
                <div className="flex flex-wrap gap-2">
                  {actions.map(action => {
                    const key = `${module}.${action}`;
                    const active = isSystem || selectedPerms.has(key);
                    return (
                      <button key={action} type="button" onClick={() => togglePerm(key)} disabled={isSystem}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed ${active ? 'bg-primary border-primary text-white dark:text-surface' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary/50 dark:hover:border-primary/50'}`}>
                        {action}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">{t('roles.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('roles.saving') : isEdit ? t('roles.btn_save') : t('roles.btn_create')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Roles() {
  const { t } = useTranslation();
  const { can } = usePermissions();
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
    <AdminLayout title={t('roles.title')}>
      <RoleModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title={t('roles.delete_title')} message={<Trans i18nKey="roles.delete_message" values={{ name: confirm.item?.name }}>Delete role <strong>{confirm.item?.name}</strong>? Users with this role may lose access.</Trans>}
        confirmLabel={t('roles.btn_delete')} />

      <PageHeader
        title={t('roles.header_title')}
        subtitle={t('roles.header_subtitle')}
        actions={
          can('roles.create') && (
            <button onClick={() => setModal({ open: true, data: null })}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="material-icons text-sm">add</span> {t('roles.btn_create_role')}
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>{t('roles.th_role_name')}</Th>
              <Th>{t('roles.th_users')}</Th>
              <Th>{t('roles.th_type')}</Th>
              <Th className="text-center">{t('roles.th_actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {roles.length === 0 ? (
              <tr><td colSpan={4}><EmptyState icon="admin_panel_settings" title={t('roles.empty_title')} subtitle={t('roles.empty_subtitle')} /></td></tr>
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
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{t('roles.users_count', { count: r.users_count ?? 0 })}</td>
                  <td className="px-6 py-4">
                    {isSystem ? (
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{t('roles.type_system')}</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold">{t('roles.type_custom')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {can('roles.edit') && (
                        <button onClick={() => setModal({ open: true, data: r })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer">
                          <span className="material-icons text-lg">edit</span>
                        </button>
                      )}
                      {!isSystem && can('roles.delete') && (
                        <button onClick={() => setConfirm({ open: true, item: r, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer">
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

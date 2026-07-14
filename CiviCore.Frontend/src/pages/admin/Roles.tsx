// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, TableWrapper, Th, EmptyState, ConfirmModal } from '../../admin/components/ui';
import { useTranslation, Trans } from 'react-i18next';
import { usePermissions } from '../../admin/PermissionsContext';
import RoleSecurityModal from './components/RoleSecurityModal';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: string[];
  users_count?: number;
  securityMode?: string;
}

const SYSTEM_ROLES = ['admin', 'super-admin', 'superadmin'];

export default function Roles() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ open: boolean; item: Role | null; loading: boolean }>({ open: false, item: null, loading: false });
  const [securityModal, setSecurityModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/roles');
      setRoles(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setRoles([]); } finally { setLoading(false); }
  }, []);

  const handleSecuritySaved = (roleId: string, newMode: string) => {
    setRoles(prev => prev.map(r => String(r.id) === String(roleId) ? { ...r, securityMode: newMode } : r));
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await axios.delete(`/api/roles/${confirm.item!.id}`);
      fetchData();
      setConfirm({ open: false, item: null, loading: false });
    } catch {
      setConfirm(c => ({ ...c, loading: false }));
    }
  };

  return (
    <AdminLayout title={t('roles.title')}>
      <RoleSecurityModal
        role={securityModal.role}
        open={securityModal.open}
        onClose={() => setSecurityModal({ open: false, role: null })}
        onSaved={handleSecuritySaved}
      />
      <ConfirmModal
        open={confirm.open}
        onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete}
        loading={confirm.loading}
        icon="delete_outline"
        title={t('roles.delete_title')}
        message={<Trans i18nKey="roles.delete_message" values={{ name: confirm.item?.name }}>Delete role <strong>{confirm.item?.name}</strong>? Users with this role may lose access.</Trans>}
        confirmLabel={t('roles.btn_delete')}
      />

      <PageHeader
        title={t('roles.header_title')}
        subtitle={t('roles.header_subtitle')}
        actions={
          can('roles.create') && (
            <button
              onClick={() => navigate('/roles/new/edit')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <span className="material-icons text-sm">add</span> {t('roles.btn_create_role')}
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
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
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {t('roles.users_count', { count: r.users_count ?? 0 })}
                  </td>
                  <td className="px-6 py-4">
                    {isSystem ? (
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{t('roles.type_system')}</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold">{t('roles.type_custom')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSecurityModal({ open: true, role: r })}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer"
                        title="Mode Keamanan"
                      >
                        <span className="material-icons text-lg">shield</span>
                      </button>
                      {can('roles.edit') && (
                        <button
                          onClick={() => navigate(`/admin/roles/${r.id}/edit`)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                          title="Edit peran & izin"
                        >
                          <span className="material-icons text-lg">edit</span>
                        </button>
                      )}
                      {!isSystem && can('roles.delete') && (
                        <button
                          onClick={() => setConfirm({ open: true, item: r, loading: false })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete role"
                        >
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

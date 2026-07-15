// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, FormInput } from '../../admin/components/ui';
import { usePermissions } from '../../admin/PermissionsContext';

/* ═══════════════════════════════════════════
   Permission definitions grouped by menu tab
═══════════════════════════════════════════ */
const PERMISSION_TABS = [
  {
    key: 'dashboard',
    labelKey: 'edit_role.tab_dashboard',
    icon: 'dashboard',
    groups: [
      { module: 'dashboard', labelKey: 'edit_role.module_dashboard', actions: ['view'] },
    ],
  },
  {
    key: 'community',
    labelKey: 'edit_role.tab_community',
    icon: 'groups',
    groups: [
      { module: 'householders', labelKey: 'edit_role.module_householders', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'blocks', labelKey: 'edit_role.module_blocks', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'organization', labelKey: 'edit_role.module_organization', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'meetings', labelKey: 'edit_role.module_meetings', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'posyandu', labelKey: 'edit_role.module_posyandu', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    key: 'finance',
    labelKey: 'edit_role.tab_finance',
    icon: 'attach_money',
    groups: [
      { module: 'finance', labelKey: 'edit_role.module_finance', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'payments', labelKey: 'edit_role.module_payments', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'reports', labelKey: 'edit_role.module_reports', actions: ['view'] },
    ],
  },
  {
    key: 'administration',
    labelKey: 'edit_role.tab_administration',
    icon: 'admin_panel_settings',
    groups: [
      { module: 'users', labelKey: 'edit_role.module_users', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'roles', labelKey: 'edit_role.module_roles', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'media', labelKey: 'edit_role.module_media', actions: ['view', 'delete'] },
      // Read-only by design: an audit trail nobody can edit is the point.
      { module: 'audit', labelKey: 'edit_role.module_audit', actions: ['view'] },
    ],
  },
  {
    key: 'homepage',
    labelKey: 'edit_role.tab_homepage',
    icon: 'public',
    groups: [
      { module: 'homepage_hero', labelKey: 'edit_role.module_homepage_hero', actions: ['view', 'edit'] },
      { module: 'homepage_events', labelKey: 'edit_role.module_homepage_events', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'homepage_gallery', labelKey: 'edit_role.module_homepage_gallery', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'homepage_bulletin', labelKey: 'edit_role.module_homepage_bulletin', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'homepage_property', labelKey: 'edit_role.module_homepage_property', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'homepage_navigation', labelKey: 'edit_role.module_homepage_navigation', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'homepage_footer', labelKey: 'edit_role.module_homepage_footer', actions: ['view', 'edit'] },
      { module: 'homepage_emergency', labelKey: 'edit_role.module_homepage_emergency', actions: ['view', 'edit'] },
      { module: 'homepage_metadata', labelKey: 'edit_role.module_homepage_metadata', actions: ['view', 'edit'] },
    ],
  },
  {
    key: 'resident_profile',
    labelKey: 'edit_role.tab_resident_profile',
    icon: 'home',
    groups: [
      { module: 'overview', labelKey: 'edit_role.module_overview', actions: ['view'] },
      { module: 'my_household', labelKey: 'edit_role.module_my_household', actions: ['view', 'edit'] },
    ],
  },
  {
    key: 'settings',
    labelKey: 'edit_role.tab_settings',
    icon: 'settings',
    groups: [
      { module: 'settings_profile', labelKey: 'edit_role.module_settings_profile', actions: ['view', 'edit'] },
      { module: 'settings_password', labelKey: 'edit_role.module_settings_password', actions: ['view', 'edit'] },
      { module: 'settings_security', labelKey: 'edit_role.module_settings_security', actions: ['view', 'edit'] },
      { module: 'settings_memo', labelKey: 'edit_role.module_settings_memo', actions: ['view', 'edit'] },
    ],
  },
];

// Active = full primary; inactive = faded primary tint with border
function getButtonClass(action: string, active: boolean): string {
  if (active) {
    return 'bg-primary border-primary text-white dark:text-surface shadow-sm shadow-primary/30';
  }
  // Inactive: subtle primary-tinted border, muted text
  return 'bg-primary/5 border-primary/20 text-primary/50 dark:text-primary/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary dark:hover:text-primary';
}

/* ═══════════════════════════════════════════
   Reusable permission card for a single module
═══════════════════════════════════════════ */
function PermissionCard({ group, selectedPerms, onToggle, onBatchToggle, isSystem, t }) {
  const allSelected = group.actions.every(a => isSystem || selectedPerms.has(`${group.module}.${a}`));
  const someSelected = !allSelected && group.actions.some(a => selectedPerms.has(`${group.module}.${a}`));

  const toggleAll = () => {
    if (isSystem) return;
    const keys = group.actions.map(a => `${group.module}.${a}`);
    onBatchToggle(keys, !allSelected);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 hover:border-primary/30 hover:shadow-sm transition-all min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t(group.labelKey)}</h4>
        {!isSystem && (
          <button
            type="button"
            onClick={toggleAll}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              allSelected
                ? 'bg-primary/10 border-primary/30 text-primary'
                : someSelected
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-primary/30 hover:text-primary'
            }`}
          >
            {allSelected ? t('edit_role.deselect_all') : t('edit_role.select_all')}
          </button>
        )}
      </div>

      {/* Action toggles */}
      <div className="flex flex-wrap gap-2">
        {group.actions.map(action => {
          const key = `${group.module}.${action}`;
          const active = isSystem || selectedPerms.has(key);
          return (
            <button
              key={action}
              type="button"
              onClick={() => onToggle(key, !active)}
              disabled={isSystem}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed select-none ${getButtonClass(action, active)}`}
            >
              {t(`edit_role.action_${action}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page
═══════════════════════════════════════════ */
export default function EditRole() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(PERMISSION_TABS[0].key);
  const [isSystem, setIsSystem] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const fetchRole = async () => {
      try {
        const res = await axios.get(`/api/roles/${id}`);
        const role = res.data;
        setName(role.name || '');
        setIsSystem(['admin', 'super-admin', 'superadmin'].includes((role.name || '').toLowerCase()));
        if (role.permissions) {
          const set = new Set<string>();
          role.permissions.forEach((p: any) => set.add(p.permissionKey || p));
          setSelectedPerms(set);
        }
      } catch {
        navigate('/roles');
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [id, isNew, navigate]);

  const togglePerm = (key: string, on: boolean) => {
    if (isSystem) return;
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
  };

  const batchTogglePerm = (keys: string[], on: boolean) => {
    if (isSystem) return;
    setSelectedPerms(prev => {
      const next = new Set(prev);
      keys.forEach(k => { if (on) next.add(k); else next.delete(k); });
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { setErrors({ name: t('edit_role.error_name_required', 'Role name is required.') }); return; }
    setSaving(true); setErrors({});
    try {
      const payload = {
        name,
        permissions: Array.from(selectedPerms).map(p => ({ permissionKey: p })),
      };
      if (isNew) await axios.post('/api/roles', payload);
      else await axios.put(`/api/roles/${id}`, payload);
      navigate('/roles');
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  const currentTab = PERMISSION_TABS.find(tab => tab.key === activeTab)!;

  // Count active perms per tab for the badge
  const getTabPermCount = (tab: typeof PERMISSION_TABS[0]) => {
    if (isSystem) return null;
    let total = 0;
    let active = 0;
    tab.groups.forEach(g => {
      g.actions.forEach(a => {
        total++;
        if (selectedPerms.has(`${g.module}.${a}`)) active++;
      });
    });
    return { active, total };
  };

  return (
    <AdminLayout title={isNew ? 'Create Role' : 'Edit Role'}>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto pb-12">
          <PageHeader
            title={isNew ? t('edit_role.page_title_create') : t('edit_role.page_title_edit', { name })}
            subtitle={isNew ? t('edit_role.subtitle_create') : t('edit_role.subtitle_edit')}
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/roles')}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold rounded-lg transition-all cursor-pointer"
                >
                  <span className="material-icons text-sm">arrow_back</span> {t('edit_role.back')}
                </button>
                {(can('roles.edit') || can('roles.create')) && !isSystem && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    <span className="material-icons text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                    {saving ? t('edit_role.saving') : t('edit_role.save_role')}
                  </button>
                )}
              </div>
            }
          />

          {/* Error banner */}
          {errors.general && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-sm font-medium">
              {errors.general}
            </div>
          )}

          {/* System role notice */}
          {isSystem && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
              <span className="material-icons text-primary">shield</span>
            <p className="text-sm text-primary font-medium">{t('edit_role.system_role_note')}</p>
            </div>
          )}

          {/* Role name card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('edit_role.role_details')}</h3>
            <div className="max-w-sm">
              <FormInput
                label={t('edit_role.role_name')}
                id="role-name"
                value={name}
                onChange={e => setName(e.target.value)}
                error={errors.name}
                required
                placeholder={t('edit_role.role_name_placeholder')}
                disabled={isSystem}
              />
            </div>
          </div>

          {/* Permissions section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('edit_role.permissions_title')}</h3>
              {!isSystem && (
                <p className="text-xs text-slate-400">
                  {selectedPerms.size} {selectedPerms.size !== 1 ? t('edit_role.permissions_count_plural', { count: selectedPerms.size }) : t('edit_role.permissions_count', { count: selectedPerms.size })}
                </p>
              )}
            </div>

            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
              {/* Sidebar tabs */}
              <div className="w-full md:w-52 flex-shrink-0 py-2 flex flex-row md:flex-col overflow-x-auto hide-scrollbar">
                {PERMISSION_TABS.map(tab => {
                  const counts = getTabPermCount(tab);
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-auto md:w-full whitespace-nowrap flex-shrink-0 flex items-center gap-3 px-4 py-3 text-left transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-primary/5 border-b-2 md:border-b-0 md:border-r-2 border-primary text-primary'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`material-icons text-sm flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                        {tab.icon}
                      </span>
                      <span className="text-sm font-medium flex-1 whitespace-nowrap md:truncate">{t(tab.labelKey)}</span>
                      {counts && counts.active > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-primary text-white dark:text-surface' : 'bg-primary/10 text-primary'}`}>
                          {counts.active}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Permission cards */}
              <div className="flex-1 min-w-0 p-4 md:p-6 min-h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {currentTab.groups.map(group => (
                    <PermissionCard
                      key={group.module}
                      group={group}
                      selectedPerms={selectedPerms}
                      onToggle={togglePerm}
                      onBatchToggle={batchTogglePerm}
                      isSystem={isSystem}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom save bar */}
          {!isSystem && (can('roles.edit') || can('roles.create')) && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => navigate('/roles')}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-all cursor-pointer"
              >
                {t('edit_role.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? t('edit_role.saving') : t('edit_role.save_role')}
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

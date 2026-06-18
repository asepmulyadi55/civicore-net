// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, EmptyState, Modal, ConfirmModal, FormInput } from '../../admin/components/ui';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  group?: string;
}

const GROUP_ICONS: Record<string, string> = {
  general: 'settings',
  payment: 'payments',
  notification: 'notifications',
  community: 'group',
};

function SettingModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Setting | null }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setValue(data?.value || ''); setError(''); }, [data, open]);

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await axios.put(`/api/settings/${data!.id}`, { value });
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit: ${data?.key}`} size="sm">
      <div className="space-y-4">
        {data?.description && <p className="text-sm text-slate-500 dark:text-slate-400">{data.description}</p>}
        {error && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Value</label>
          <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3}
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; data: Setting | null }>({ open: false, data: null });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/settings');
      setSettings(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setSettings([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group settings by their group field
  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    const g = s.group || 'general';
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  return (
    <AdminLayout title="Settings">
      <SettingModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} />

      <PageHeader title="System Settings" subtitle="Manage application configuration and preferences" />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : settings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="settings" title="No settings found" subtitle="System settings will appear here" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="material-icons text-primary">{GROUP_ICONS[group] || 'tune'}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">{group}</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((s) => (
                  <div key={s.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.key}</p>
                      {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                      <code className="mt-1 inline-block text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono truncate max-w-xs">
                        {s.value || '(empty)'}
                      </code>
                    </div>
                    <button onClick={() => setModal({ open: true, data: s })}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                      <span className="material-icons text-lg">edit</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

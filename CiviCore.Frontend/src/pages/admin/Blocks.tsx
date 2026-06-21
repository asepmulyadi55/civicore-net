// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Modal, ConfirmModal,
  PageHeader, FilterBar, SearchInput,
  TableWrapper, Th, FormInput, FormSelect
} from '../../admin/components/ui';

function BlockModal({ open, onClose, onSaved, data, coordinatorUsers }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ name: '', description: '', is_active: true, coordinator_ids: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name || '', description: data.description || '', is_active: data.is_active !== false, coordinator_ids: (data.coordinators || []).map(c => String(c.id)) });
    else setForm({ name: '', description: '', is_active: true, coordinator_ids: [] });
    setErrors({});
  }, [data, open]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const toggleCoord = (id) => setForm(p => ({
    ...p,
    coordinator_ids: p.coordinator_ids.includes(id) ? p.coordinator_ids.filter(x => x !== id) : [...p.coordinator_ids, id]
  }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/blocks/${data.id}`, form);
      else await axios.post('/api/blocks', form);
      onSaved(); onClose();
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Block' : 'Add New Block'} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Block Name" id="b-name" value={form.name} onChange={set('name')} error={errors.name} required placeholder="e.g. Block A" />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Optional description..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none text-sm" />
        </div>
        {coordinatorUsers?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Coordinators</p>
            <div className="flex flex-wrap gap-2">
              {coordinatorUsers.map(u => (
                <button key={u.id} type="button" onClick={() => toggleCoord(String(u.id))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.coordinator_ids.includes(String(u.id)) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/30'}`}>
                  <span className="material-icons text-sm">{form.coordinator_ids.includes(String(u.id)) ? 'check_circle' : 'radio_button_unchecked'}</span>
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="b-active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="b-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active block</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm shadow-primary/20 disabled:opacity-60 transition-all">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Block'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BlockCard({ block, onEdit, onDelete, onManageUnits }) {
  const stats = [
    { label: 'Units', value: block.units_count ?? 0, cls: 'bg-slate-50 dark:bg-slate-800', valCls: 'text-slate-900 dark:text-white' },
    { label: 'Occupied', value: block.owner_occupied_units_count ?? 0, cls: 'bg-emerald-50 dark:bg-emerald-900/10', valCls: 'text-emerald-500' },
    { label: 'Rented', value: block.rented_units_count ?? 0, cls: 'bg-amber-50 dark:bg-amber-900/10', valCls: 'text-amber-500' },
    { label: 'Vacant', value: block.vacant_units_count ?? 0, cls: 'bg-slate-50 dark:bg-slate-800', valCls: 'text-slate-900 dark:text-white' },
    { label: 'Public', value: block.public_facility_units_count ?? 0, cls: 'bg-teal-50 dark:bg-teal-900/10', valCls: 'text-teal-500' },
    { label: 'Developer', value: block.developer_units_count ?? 0, cls: 'bg-indigo-50 dark:bg-indigo-900/10', valCls: 'text-indigo-500' },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-icons text-2xl">apartment</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white truncate">{block.name}</h3>
          {block.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{block.description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className={`${s.cls} rounded-lg p-2 text-center`}>
            <p className={`text-xl font-bold ${s.valCls}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="py-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="material-icons text-sm text-slate-400 flex-shrink-0">manage_accounts</span>
          {(block.coordinators || []).length === 0 ? (
            <span className="text-xs text-slate-400 italic">No coordinator assigned</span>
          ) : block.coordinators.map(c => (
            <div key={c.id} className="flex items-center gap-1 bg-primary/5 rounded-full px-2 py-0.5">
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                {c.name?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[10px] font-medium text-primary truncate max-w-[80px]">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <StatusBadge status={block.is_active ? 'active' : 'inactive'} />
        <div className="flex gap-1">
          <button onClick={() => onManageUnits(block)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Manage Units">
            <span className="material-icons text-sm">home_work</span>
          </button>
          <button onClick={() => onEdit(block)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
            <span className="material-icons text-sm">edit</span>
          </button>
          <button onClick={() => onDelete(block)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors" title="Delete">
            <span className="material-icons text-sm">delete_outline</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [coordinatorUsers, setCoordinatorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([
        axios.get('/api/blocks', { params: { search } }),
        axios.get('/api/users?role=coordinator&per_page=100').catch(() => ({ data: [] })),
      ]);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
      setCoordinatorUsers(Array.isArray(uRes.data) ? uRes.data : (uRes.data?.data || []));
    } catch { setBlocks([]); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try { await axios.delete(`/api/blocks/${confirm.item.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  const filtered = blocks.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Blocks">
      <BlockModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} coordinatorUsers={coordinatorUsers} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title="Delete Block?" message={`Permanently delete block <strong>${confirm.item?.name}</strong>? This cannot be undone.`}
        confirmLabel="Yes, Delete" />

      <PageHeader
        title="Blocks Management"
        subtitle="Manage residential blocks and their coordinators"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Add Block
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search blocks…" />
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="apartment" title="No blocks yet" subtitle="Add your first block to get started" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(block => (
            <BlockCard key={block.id} block={block}
              onEdit={b => setModal({ open: true, data: b })}
              onDelete={b => setConfirm({ open: true, item: b, loading: false })}
              onManageUnits={b => window.location.href = `/admin/blocks/${b.id}/units`}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

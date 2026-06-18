// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Pagination, Modal, ConfirmModal,
  Avatar, PageHeader, FilterBar, SearchInput, SelectFilter,
  BulkActionBar, TableWrapper, Th, FormInput, FormSelect
} from '../../admin/components/ui';

const HOUSE_STATUS_OPTIONS = [
  { value: 'owner_occupied', label: 'Owner Occupied' },
  { value: 'rented', label: 'Rented' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'public_facility', label: 'Public Facility' },
  { value: 'developer', label: 'Developer' },
];

function HouseholderModal({ open, onClose, onSaved, data, blocks }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState({
    fullname: '', unit_number: '', block_id: '', house_status: 'owner_occupied', is_active: true,
    phone: '', email: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ fullname: data.fullname || '', unit_number: data.unit_number || '', block_id: data.block_id || '', house_status: data.house_status || 'owner_occupied', is_active: data.is_active !== false, phone: data.phone || '', email: data.email || '' });
    else setForm({ fullname: '', unit_number: '', block_id: '', house_status: 'owner_occupied', is_active: true, phone: '', email: '' });
    setErrors({});
  }, [data, open]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/householders/${data.id}`, form);
      else await axios.post('/api/householders', form);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Householder' : 'Add Householder'} size="lg">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Full Name" id="h-fullname" value={form.fullname} onChange={set('fullname')} error={errors.fullname} required />
          <FormInput label="Unit Number" id="h-unit" value={form.unit_number} onChange={set('unit_number')} error={errors.unit_number} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect label="Block" id="h-block" value={form.block_id} onChange={set('block_id')} error={errors.block_id} required
            options={(blocks || []).map(b => ({ value: b.id, label: b.name }))} placeholder="Select Block" />
          <FormSelect label="House Status" id="h-status" value={form.house_status} onChange={set('house_status')} error={errors.house_status}
            options={HOUSE_STATUS_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Phone" id="h-phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <FormInput label="Email" id="h-email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input type="checkbox" id="h-active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="h-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active householder</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm shadow-primary/20 transition-all disabled:opacity-60">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Householder'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Householders() {
  const [data, setData] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', block_id: '', status: '', page: 1 });
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const [hRes, bRes] = await Promise.all([
        axios.get('/api/householders', { params }),
        axios.get('/api/blocks?per_page=100'),
      ]);
      const h = hRes.data;
      setData(Array.isArray(h) ? h : (h.data || []));
      setMeta(h.meta || null);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allChecked = data.length > 0 && selected.length === data.length;
  const toggleAll = () => setSelected(allChecked ? [] : data.map(h => h.id));
  const toggleOne = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const openConfirm = (type, item) => setConfirm({ open: true, type, item, loading: false });
  const closeConfirm = () => setConfirm({ open: false, type: null, item: null, loading: false });

  const doConfirm = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      if (confirm.type === 'delete') await axios.delete(`/api/householders/${confirm.item.id}`);
      else if (confirm.type === 'deactivate') await axios.patch(`/api/householders/${confirm.item.id}/deactivate`);
      else if (confirm.type === 'bulk') { await axios.delete('/api/householders/bulk', { data: { ids: selected } }); setSelected([]); }
      fetchData(); closeConfirm();
    } catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const blockOptions = blocks.map(b => ({ value: String(b.id), label: b.name }));

  return (
    <AdminLayout title="Residents">
      <HouseholderModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} blocks={blocks} />
      <ConfirmModal
        open={confirm.open} onClose={closeConfirm} onConfirm={doConfirm} loading={confirm.loading}
        icon={confirm.type === 'delete' || confirm.type === 'bulk' ? 'delete_forever' : 'person_off'}
        title={confirm.type === 'delete' ? 'Delete Householder?' : confirm.type === 'bulk' ? 'Delete Selected?' : 'Deactivate Householder?'}
        message={confirm.type === 'bulk' ? `Delete <strong>${selected.length}</strong> selected householders permanently?` : `Are you sure about <strong>${confirm.item?.fullname}</strong>?`}
        confirmLabel={confirm.type === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Delete'}
        confirmClass={confirm.type === 'deactivate' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
      />

      <PageHeader
        title="Householders"
        subtitle="Manage all residential units and occupants"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Add Householder
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder="Search name, unit, phoneâ€¦" />
        <SelectFilter value={filters.block_id} onChange={v => setFilter('block_id', v)} options={blockOptions} placeholder="All Blocks" />
        <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', block_id: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </FilterBar>

      <BulkActionBar count={selected.length} onDelete={() => openConfirm('bulk', null)} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="w-12 px-6 py-4 text-center">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer" />
              </th>
              <Th>Household</Th>
              <Th className="hidden sm:table-cell">House Status</Th>
              <Th className="text-right">Monthly Fee</Th>
              <Th>Status</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon="people_outline" title="No residents found" subtitle="Try adjusting your filters" /></td></tr>
            ) : data.map(h => {
              const initials = h.fullname?.split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
              const blockLabel = h.block ? `${h.block.name} Â· ${h.unit_number}` : h.unit_number;
              return (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="w-12 px-6 py-4 text-center">
                    <input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggleOne(h.id)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={h.fullname} photo={h.photo_url} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{h.fullname}</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{blockLabel}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <StatusBadge status={h.house_status || 'owner_occupied'} />
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                    Rp {(h.monthly_fee || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={h.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setModal({ open: true, data: h })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Edit">
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      {h.is_active && (
                        <button onClick={() => openConfirm('deactivate', h)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Deactivate">
                          <span className="material-icons text-lg">person_off</span>
                        </button>
                      )}
                      <button onClick={() => openConfirm('delete', h)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Delete">
                        <span className="material-icons text-lg">delete_forever</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {meta && (
            <tfoot>
              <tr><td colSpan={6}><Pagination meta={meta} onChange={p => setFilters(f => ({ ...f, page: p }))} /></td></tr>
            </tfoot>
          )}
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

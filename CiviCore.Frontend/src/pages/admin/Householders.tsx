// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Pagination, Modal, ConfirmModal,
  Avatar, PageHeader, FilterBar, SearchInput, SelectFilter,
  BulkActionBar, TableWrapper, Th, FormInput, FormSelect, SecureImage
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
    fullname: '', unitId: '', blockId: '', houseStatus: 0, isActive: true,
    phone: '', email: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ fullname: data.fullname || '', unitId: data.unitId || '', blockId: data.blockId || '', houseStatus: data.houseStatus ?? 0, isActive: data.isActive !== false, phone: data.phone || '', email: data.email || '' });
    else setForm({ fullname: '', unitId: '', blockId: '', houseStatus: 0, isActive: true, phone: '', email: '' });
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
          <FormSelect label="Block" id="h-block" value={form.blockId} onChange={e => setForm(p => ({ ...p, blockId: e.target.value, unitId: '' }))} error={errors.blockId} required
            options={(blocks || []).map(b => ({ value: b.id, label: b.name }))} placeholder="Select Block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect label="Unit Number" id="h-unit" value={form.unitId} onChange={set('unitId')} error={errors.unitId} required
            options={(blocks.find(b => b.id === form.blockId)?.units || []).filter(u => !u.isAssigned).map(u => ({ value: u.id, label: u.unitNumber }))} placeholder="Select Unit" />
          <FormSelect label="House Status (Override)" id="h-status" value={String(form.houseStatus)} onChange={e => setForm(p => ({ ...p, houseStatus: Number(e.target.value) }))} error={errors.houseStatus}
            options={[
              { value: '0', label: 'Owner Occupied' },
              { value: '1', label: 'Rented' },
              { value: '2', label: 'Vacant' },
              { value: '3', label: 'Public Facility' },
              { value: '4', label: 'Developer' }
            ]} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Phone" id="h-phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <FormInput label="Email" id="h-email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input type="checkbox" id="h-active" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="h-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active householder</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
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
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
            <span className="material-icons text-sm">add</span> Add Householder
          </button>
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder="Search name, unit, or phone..." />
        <SelectFilter value={filters.block_id} onChange={v => setFilter('block_id', v)} options={blockOptions} placeholder="All Blocks" />
        <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', block_id: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </div>

      <BulkActionBar count={selected.length} onDelete={() => openConfirm('bulk', null)} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/50">
              <th className="w-12 px-6 py-4 text-center">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded bg-transparent border-slate-400 dark:border-slate-600 text-primary focus:ring-primary/30 cursor-pointer" />
              </th>
              <Th>Household &uarr;</Th>
              <Th className="hidden sm:table-cell">House Status &uarr;</Th>
              <Th>Monthly Fee</Th>
              <Th>Status &uarr;</Th>
              <Th className="text-right pr-6">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon="people_outline" title="No residents found" subtitle="Try adjusting your filters" /></td></tr>
            ) : data.map(h => {
              const initials = h.fullname?.split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
              const blockLabel = h.block && h.unit ? `${h.block.name} - ${h.unit.unitNumber}` : 'Unassigned';
              return (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/30 last:border-0">
                  <td className="w-12 px-6 py-4 text-center">
                    <input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggleOne(h.id)} className="w-4 h-4 rounded bg-transparent border-slate-400 dark:border-slate-600 text-primary focus:ring-primary/30 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                        {h.photoPath ? (
                          <SecureImage src={`/api/media/path/${h.photoPath}`} className="w-full h-full object-cover" alt="Household" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white leading-none mb-1">{h.fullname}</div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">{blockLabel}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <StatusBadge status={['owner_occupied', 'rented', 'vacant', 'public_facility', 'developer'][h.unit?.houseStatus ?? 0]} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">
                    Rp {(h.monthlyFee || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={h.isActive ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/householders/${h.id}/edit`} className="text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit">
                        <span className="material-icons text-[18px]">edit</span>
                      </Link>
                      {h.is_active && (
                        <button onClick={() => openConfirm('deactivate', h)} className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" title="Deactivate">
                          <span className="material-icons text-[18px]">visibility_off</span>
                        </button>
                      )}
                      <button onClick={() => openConfirm('delete', h)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title="Delete">
                        <span className="material-icons text-[18px]">delete</span>
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

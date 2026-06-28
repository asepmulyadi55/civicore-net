// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, FilterBar, SearchInput, SelectFilter, EmptyState, Pagination, TableWrapper, Th, Modal, ConfirmModal, FormInput, FormSelect, StatusBadge } from '../../admin/components/ui';

interface Property {
  id: number;
  title: string;
  type: string;
  price: number;
  status: 'available' | 'sold' | 'rented';
  description?: string;
  location?: string;
  created_at: string;
}

interface PaginationMeta { current_page: number; last_page: number; from: number; to: number; total: number; }

const TYPE_OPTIONS = [
  { value: 'house', label: 'House' }
];
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' }, { value: 'sold', label: 'Sold' }, { value: 'rented', label: 'Rented' },
];

function PropertyModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Property | null }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ title: '', type: 'house', price: '', status: 'available', description: '', location: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ title: data.title, type: data.type, price: String(data.price), status: data.status, description: data.description || '', location: data.location || '' });
    else setForm({ title: '', type: 'house', price: '', status: 'available', description: '', location: '' });
    setErrors({});
  }, [data, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      const payload = { ...form, price: Number(form.price) };
      if (isEdit) await axios.put(`/api/property/${data!.id}`, payload);
      else await axios.post('/api/property', payload);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Property' : 'Add Property'} size="lg">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Title" id="p-title" value={form.title} onChange={set('title')} error={errors.title} required placeholder="e.g. Unit A-01 For Rent" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormSelect label="Type" id="p-type" value={form.type} onChange={set('type')} options={TYPE_OPTIONS} />
          <FormSelect label="Status" id="p-status" value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />
          <FormInput label="Price (Rp)" id="p-price" type="number" value={form.price} onChange={set('price')} error={errors.price} placeholder="0" />
        </div>
        <FormInput label="Location" id="p-loc" value={form.location} onChange={set('location')} placeholder="Block & unit, e.g. Block A No. 5" />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Property details..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5 px-2 mt-4">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function PropertyAdmin() {
  const [data, setData] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: Property | null }>({ open: false, data: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: Property | null; loading: boolean }>({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/property', { params: filters });
      const d = res.data;
      setData(Array.isArray(d) ? d : (d.data || []));
      setMeta(d.meta || null);
    } catch { setData([]); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k: string, v: string | number) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const doDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try { await axios.delete(`/api/property/${confirm.item!.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm((c) => ({ ...c, loading: false })); }
  };

  return (
    <AdminLayout title="Property">
      <PropertyModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title="Delete Property?" message={`Delete <strong>${confirm.item?.title}</strong>? This cannot be undone.`}
        confirmLabel="Yes, Delete" />

      <PageHeader title="Property Listings" subtitle="Manage available, sold, and rented properties"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
            <span className="material-icons text-sm">add</span> Add Property
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder="Search title, location…" />
        <SelectFilter value={filters.type} onChange={(v) => setFilter('type', v)} options={TYPE_OPTIONS} placeholder="All Types" />
        <SelectFilter value={filters.status} onChange={(v) => setFilter('status', v)} options={STATUS_OPTIONS} placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', type: '', status: '', page: 1 })}
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
              <Th>Property</Th>
              <Th>Type</Th>
              <Th className="text-right">Price</Th>
              <Th>Status</Th>
              <Th>Listed</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon="home_work" title="No properties found" subtitle="Add your first property listing" /></td></tr>
            ) : data.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
                  {p.location && <p className="text-xs text-slate-400 mt-0.5">{p.location}</p>}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold capitalize">{p.type}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Rp {p.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setModal({ open: true, data: p })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer">
                      <span className="material-icons text-lg">edit</span>
                    </button>
                    <button onClick={() => setConfirm({ open: true, item: p, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer">
                      <span className="material-icons text-lg">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {meta && <tfoot><tr><td colSpan={6}><Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></td></tr></tfoot>}
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

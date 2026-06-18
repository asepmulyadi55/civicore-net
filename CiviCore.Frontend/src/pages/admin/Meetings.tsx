// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableWrapper, Th, EmptyState, Pagination, Modal, ConfirmModal, FormInput, FormSelect } from '../../admin/components/ui';

interface Meeting {
  id: number;
  title: string;
  description?: string;
  meeting_date: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  total: number;
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function MeetingModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Meeting | null }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ title: '', description: '', meeting_date: '', location: '', status: 'scheduled' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({ title: data.title, description: data.description || '', meeting_date: data.meeting_date?.slice(0, 16) || '', location: data.location || '', status: data.status });
    } else {
      setForm({ title: '', description: '', meeting_date: '', location: '', status: 'scheduled' });
    }
    setErrors({});
  }, [data, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/meetings/${data!.id}`, form);
      else await axios.post('/api/meetings', form);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Meeting' : 'Schedule Meeting'} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Title" id="m-title" value={form.title} onChange={set('title')} error={errors.title} required placeholder="e.g. Monthly RT Meeting" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="m-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date & Time <span className="text-rose-500">*</span></label>
            <input id="m-date" type="datetime-local" value={form.meeting_date} onChange={set('meeting_date')}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" />
            {errors.meeting_date && <p className="mt-1.5 text-xs text-rose-600">{errors.meeting_date}</p>}
          </div>
          <FormSelect label="Status" id="m-status" value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />
        </div>
        <FormInput label="Location" id="m-location" value={form.location} onChange={set('location')} error={errors.location} placeholder="e.g. Balai RT, Block A" />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Meeting agenda or notes..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Meetings() {
  const [data, setData] = useState<Meeting[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: Meeting | null }>({ open: false, data: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: Meeting | null; loading: boolean }>({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/meetings', { params: filters });
      const d = res.data;
      setData(Array.isArray(d) ? d : (d.data || []));
      setMeta(d.meta || null);
    } catch { setData([]); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k: string, v: string | number) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const doDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try { await axios.delete(`/api/meetings/${confirm.item!.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm((c) => ({ ...c, loading: false })); }
  };

  return (
    <AdminLayout title="Meetings">
      <MeetingModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="event_busy"
        title="Cancel Meeting?" message={`Are you sure you want to delete <strong>${confirm.item?.title}</strong>?`}
        confirmLabel="Yes, Delete" />

      <PageHeader
        title="Meetings" subtitle="Schedule and track community meetings"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Schedule Meeting
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder="Search meetingsâ€¦" />
        <SelectFilter value={filters.status} onChange={(v) => setFilter('status', v)} options={STATUS_OPTIONS} placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>Meeting</Th>
              <Th>Date & Time</Th>
              <Th>Location</Th>
              <Th>Status</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="event_note" title="No meetings found" subtitle="Schedule your first community meeting" /></td></tr>
            ) : data.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.title}</p>
                  {m.description && <p className="text-xs text-slate-400 truncate max-w-xs">{m.description}</p>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {m.meeting_date ? new Date(m.meeting_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{m.location || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[m.status] || STATUS_STYLES.scheduled}`}>
                    {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setModal({ open: true, data: m })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                      <span className="material-icons text-lg">edit</span>
                    </button>
                    <button onClick={() => setConfirm({ open: true, item: m, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                      <span className="material-icons text-lg">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {meta && <tfoot><tr><td colSpan={5}><Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></td></tr></tfoot>}
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

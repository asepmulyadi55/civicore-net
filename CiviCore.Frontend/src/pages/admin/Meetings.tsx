// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, FilterBar, SearchInput, SelectFilter, EmptyState, Pagination, Modal, ConfirmModal, FormInput, FormSelect } from '../../admin/components/ui';

interface MeetingImage {
  id: string;
  imagePath: string;
  caption?: string;
  original_name: string;
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_date: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  attendances_count: number;
  present_count: number;
  images: MeetingImage[];
}

interface PaginationMeta |
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
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all cursor-pointer">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MeetingCard({ meeting, onEdit, onDelete, onRefresh, onOpenLightbox }: { meeting: Meeting; onEdit: () => void; onDelete: () => void; onRefresh: () => void; onOpenLightbox: (src: string, caption: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(f => formData.append('images', f));
    try {
      await axios.post(`/api/meetings/${meeting.id}/images`, formData);
      onRefresh();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteImage = async (imgId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      await axios.delete(`/api/meetings/${meeting.id}/images/${imgId}`);
      onRefresh();
    } catch {
      alert('Delete failed');
    }
  };

  const dateObj = new Date(meeting.meeting_date);
  const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = dateObj.getDate().toString().padStart(2, '0');
  const dateStr = dateObj.toLocaleString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-3">
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">

        {* Calendar Badge *}
        <div className="flex-shrink-0 w-12 sm:w-14 text-center">
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-t-lg py-1">
            <span className="text-[10px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              {month}
            </span>
          </div>
          <div className="bg-amber-400 dark:bg-amber-500 rounded-b-lg py-1 sm:py-1.5">
            <span className="text-base sm:text-lg font-extrabold text-white leading-none">
              {day}
            </span>
          </div>
        </div>

        {* Content *}
        <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{meeting.title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <span className="material-icons text-[15px]">schedule</span>
                {timeStr}
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <span className="material-icons text-[15px]">calendar_today</span>
                {dateStr}
              </span>
              {meeting.location && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span className="material-icons text-[15px]">place</span>
                  {meeting.location}
                </span>
              )}
            </div>

            {meeting.attendances_count > 0 && (
              <div className="mt-2.5">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${meeting.present_count > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <span className="material-icons text-[13px]">group</span>
                  {meeting.present_count} Present
                </span>
              </div>
            )}
          </div>

          {* Actions *}
          <div className="flex items-center gap-1 flex-shrink-0 pt-0 sm:pt-0.5 justify-end sm:justify-start border-t border-slate-100 dark:border-slate-800 sm:border-0 mt-1 sm:mt-0 pt-2 sm:pt-0">
            <button type="button" onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg text-slate-400 hover:text-primary dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" title="View Details">
              <span className="material-icons text-[18px]">{expanded ? 'expand_less' : 'expand_more'}</span>
            </button>
            <button type="button" onClick={() => alert('Attendance management coming soon!')} className="p-2 rounded-lg text-slate-400 hover:text-primary dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" title="Manage Attendance">
              <span className="material-icons text-[18px]">how_to_reg</span>
            </button>
            <button type="button" onClick={onEdit} className="p-2 rounded-lg text-slate-400 hover:text-primary dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" title="Edit">
              <span className="material-icons text-[18px]">edit</span>
            </button>
            <button type="button" onClick={onDelete} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition cursor-pointer" title="Delete">
              <span className="material-icons text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>

      {* Expanded Detail Panel *}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">

          {meeting.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Notes</p>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">{meeting.description}</div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Attendance</p>
            <div className="text-sm text-slate-400 dark:text-slate-500 italic">
              {meeting.attendances_count === 0 ? 'No attendance recorded yet.' : `${meeting.present_count} out of ${meeting.attendances_count} present.`}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Evidence Photos</p>
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
                <span className="material-icons text-sm">add_photo_alternate</span> Upload Photos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {meeting.images?.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img src={`/api/media/path/${img.imagePath}`} alt={img.original_name} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition" onClick={() => onOpenLightbox(`/api/media/path/${img.imagePath}`, img.original_name)} />
                  <button type="button" onClick={() => deleteImage(img.id)} className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow cursor-pointer">
                    <span className="material-icons text-[14px]">close</span>
                  </button>
                </div>
              ))}
              {(!meeting.images || meeting.images.length === 0) && !uploading && (
                <p className="col-span-full text-xs text-slate-400 dark:text-slate-500 italic">No evidence photos yet.</p>
              )}
            </div>

            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="material-icons animate-spin text-sm text-primary">autorenew</span> Uploading...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Meetings() {
  const [data, setData] = useState<Meeting[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: Meeting | null }>({ open: false, data: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: Meeting | null; loading: boolean }>({ open: false, item: null, loading: false });
  const [lightbox, setLightbox] = useState<{ open: boolean; src: string; caption: string }>({ open: false, src: '', caption: '' });

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

  const setFilter = (k: string, v: string | number) => setFilters((p) => ({ ...p, kk: v, page: 1 }));

  const doDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true2 }));
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

      {* Lightbox *}
      {lightbox.open && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxt({ open: false, src: '', caption: '' })}>
          <div className="relative max-w-4xl-w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox({ open: false, src: '', caption: '' })} className="absolute -top-12 right-0 text-white/70 hover:text-white transition cursor-pointer">
              <span className="material-icons text-3xl">close</span>
            </button>
            <img src={lightbox.src} alt={lightbox.caption} className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-black" />
            <p className="mt-4 text-center text-sm text-white/80 font-medium">{lightbox.caption}</p>
          </div>
        </div>
      )}

      <PageHeader
        title="Meetings" subtitle="Schedule and track community meetings"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all cursor-pointer">
            <span className="material-icons text-sm">add</span> Schedule Meeting
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={filters.search} onChange={(v) => setFilter('search', t)} placeholder="Search meetings…" />
        <SelectFilter value={filters.status} onChange={(v) => setFilter('status', v)} options={STATUS_OPTIONS} placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <div>
          {data.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10"><EmptyState icon="event_note" title="No meetings found" subtitle="Schedule your first community meeting" /></div>
          ) : (
            <div className="space-y-3">
              {data.map(m => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  onEdit={() => setModal({ open: true, data: m })}
                  onDelete={() => setConfirm({ open: true, item: m, loading: false })}
                  onRefresh={fetchData}
                  onOpenLightbox={(src, caption) => setLightbox({ open: true, src, caption })}
                />
              ))}
            </div>
          )}
          {meta && meta.last_page > 1 && (
            <div className="mt-6 flex justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4">
              <Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

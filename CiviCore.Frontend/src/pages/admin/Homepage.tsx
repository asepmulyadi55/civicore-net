// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, Modal, ConfirmModal, FormInput, FormSelect, SearchInput, SelectFilter, FilterBar, Pagination, TableWrapper, Th, EmptyState, StatusBadge } from '../../admin/components/ui';

/* ═══════════════════════════════════════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'hero',     label: 'Hero Section',    icon: 'star' },
  { key: 'events',   label: 'Events',          icon: 'event' },
  { key: 'gallery',  label: 'Gallery',         icon: 'photo_library' },
  { key: 'bulletin', label: 'Bulletin',        icon: 'article' },
  { key: 'footer',   label: 'Footer',          icon: 'web_asset' },
  { key: 'metadata', label: 'SEO & Metadata',  icon: 'manage_search' },
];

const CATEGORY_OPTIONS = [
  { value: 'wellness', label: 'Wellness' }, { value: 'meetings', label: 'Meetings' },
  { value: 'education', label: 'Education' }, { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' }, { value: 'other', label: 'Other' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionCard({ icon, iconBg, iconColor, title, subtitle, badge, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <span className={`material-icons ${iconColor} text-[20px]`}>{icon}</span>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {badge !== undefined && (
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ onClick, loading, label = 'Save Changes' }) {
  return (
    <div className="flex justify-end pt-4 px-6 pb-6">
      <button onClick={onClick} disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
        <span className="material-icons text-base">{loading ? 'hourglass_top' : 'save'}</span>
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}

function ImageUploadBox({ id, label, currentUrl, onFileChange, file }) {
  const inputRef = React.useRef(null);
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
      {currentUrl && !file && (
        <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mb-2">
          <img src={currentUrl} alt="Current" className="w-20 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Image</p>
            <p className="text-xs text-slate-400 truncate">{currentUrl}</p>
          </div>
        </div>
      )}
      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <img src={URL.createObjectURL(file)} alt="Preview" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary">Ready to upload</p>
            <p className="text-xs text-slate-400 truncate">{file.name}</p>
          </div>
          <button type="button" onClick={() => { onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
            <span className="material-icons text-lg">close</span>
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer">
          <span className="material-icons text-slate-400 text-2xl">cloud_upload</span>
          <span className="text-xs font-semibold text-slate-500">Upload New Image <span className="text-slate-400 font-normal">(optional · max 5 MB)</span></span>
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={e => onFileChange(e.target.files?.[0] || null)} />
        </label>
      )}
    </div>
  );
}

function SuccessBanner({ show }) {
  if (!show) return null;
  return (
    <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
      <span className="material-icons text-emerald-500">check_circle</span>
      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Changes saved successfully!</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 1: FEATURED EVENT
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroTab() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  useEffect(() => {
    axios.get('/api/homepage/hero').then(r => setData(r.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append('title', data.title || '');
    fd.append('subtitle', data.subtitle || '');
    fd.append('cta_label', data.cta_label || '');
    if (bgImage) fd.append('background_image', bgImage);
    try {
      await axios.put('/api/homepage/hero', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      setBgImage(null);
    } catch {}
    setSaving(false);
  };

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  return (
    <SectionCard icon="star" iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-500" title="Hero Section" subtitle="The main header on the public homepage">
      <SuccessBanner show={success} />
      <div className="p-6 space-y-5">
        <FormInput label="Main Title" id="hero-title" value={data.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Welcome to Dwipapuri Residence" />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subtitle</label>
          <textarea value={data.subtitle || ''} onChange={e => set('subtitle', e.target.value)} rows={3} placeholder="e.g. Modern Living in Harmony..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none resize-none" />
        </div>
        <FormInput label="CTA Button Text" id="hero-cta" value={data.cta_label || ''} onChange={e => set('cta_label', e.target.value)} placeholder="e.g. Schedule a Visit" />
        <ImageUploadBox label="Background Image" currentUrl={data.background_image_url} file={bgImage} onFileChange={setBgImage} />
      </div>
      <SaveButton onClick={save} loading={saving} label="Save Hero Section" />
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 2: EVENTS
   ═══════════════════════════════════════════════════════════════════════════ */
function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState({ title: '', description: '', date: '', category: '', status: '', url: '' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(1);

  const STATUS_OPTIONS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'past', label: 'Past' },
  ];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get('/api/homepage/events'); setEvents(r.data || []); } catch { setEvents([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter(e => {
    const s = search.toLowerCase();
    if (s && !(e.title?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s))) return false;
    if (catFilter && e.category !== catFilter) return false;
    return true;
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const perPage = 10;
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const meta = { current_page: page, last_page: lastPage, from: total === 0 ? 0 : (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total };

  const openModal = (ev = null) => {
    setModal({ open: true, data: ev });
    if (ev) {
      setForm({ title: ev.title || '', description: ev.description || '', date: ev.date || '', category: ev.category || '', status: ev.status || '', url: ev.url || '' });
    } else {
      setForm({ title: '', description: '', date: '', category: '', status: '', url: '' });
    }
    setImage(null);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image_file', image);
    try {
      if (modal.data) {
        await axios.put(`/api/homepage/events/${modal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/homepage/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModal({ open: false, data: null });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      fetchEvents();
    } catch {}
    setSaving(false);
  };

  const deleteEvent = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/events/${deleteModal.id}`); fetchEvents(); } catch {}
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  const catLabel = (c) => CATEGORY_OPTIONS.find(o => o.value === c)?.label || c || '—';

  return (
    <>
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? "Edit Event" : "Add Event"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Title" id="ev-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Event title..." />
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
            </div>
            <FormSelect label="Category" id="ev-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORY_OPTIONS} placeholder="None" />
            <FormSelect label="Status" id="ev-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUS_OPTIONS} placeholder="Auto (based on date)" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <ReactQuill theme="snow" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} className="bg-white text-slate-900 rounded-lg" />
          </div>
          <FormInput label="URL" id="ev-url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://... (optional)" />
          <ImageUploadBox label="Event Image" currentUrl={modal.data?.image_url} file={image} onFileChange={setImage} />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            <button onClick={saveEvent} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteEvent} loading={deleteModal.loading} icon="delete_outline"
        title="Delete Event?" message={`Delete <strong>${deleteModal.title}</strong>? This cannot be undone.`} confirmLabel="Yes, Delete" />

      <SectionCard icon="event" iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-500" title="Events" subtitle="Manage community events displayed on the homepage" badge={events.length}>
        <SuccessBanner show={success} />
        
        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search events..." />
            <SelectFilter value={catFilter} onChange={v => { setCatFilter(v); setPage(1); }} options={CATEGORY_OPTIONS} placeholder="All Categories" />
            <div className="flex-grow"></div>
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> Add Event
            </button>
          </FilterBar>

          <TableWrapper>
            {loading ? (
              <tbody><tr><td colSpan={5} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>Title</Th><Th>Category</Th><Th>Date</Th><Th>Status</Th><Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState icon="event_busy" title="No events found" subtitle={search || catFilter ? 'Try adjusting your filters' : 'Add your first event above'} /></td></tr>
                  ) : paged.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {ev.image_url ? <img src={ev.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" /> : (
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"><span className="material-icons text-emerald-500 text-[15px]">event</span></div>
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{ev.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{ev.category ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">{catLabel(ev.category)}</span> : <span className="text-slate-400 text-xs">—</span>}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{ev.date ? new Date(ev.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={ev.status === 'upcoming' ? 'pending' : (ev.status === 'ongoing' ? 'active' : 'inactive')} />
                        {ev.status && <span className="ml-1 text-xs text-slate-400">({ev.status})</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openModal(ev)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">edit</span></button>
                          <button onClick={() => setDeleteModal({ open: true, id: ev.id, title: ev.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {meta.last_page > 1 && <tfoot><tr><td colSpan={5}><Pagination meta={meta} onChange={p => setPage(p)} /></td></tr></tfoot>}
              </>
            )}
          </TableWrapper>
        </div>
      </SectionCard>
    </>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   TAB 3: GALLERY
   ═══════════════════════════════════════════════════════════════════════════ */
function GalleryTab() {
  const [settings, setSettings] = useState<any>({});
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState({ title: '', description: '', count: '' });
  const [image, setImage] = useState(null);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { 
      const [sRes, aRes] = await Promise.all([
        axios.get('/api/homepage/gallery-settings'),
        axios.get('/api/homepage/gallery')
      ]);
      setSettings(sRes.data || {});
      setAlbums(aRes.data || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = albums.filter(a => {
    const s = search.toLowerCase();
    if (s && !(a.title?.toLowerCase().includes(s) || a.description?.toLowerCase().includes(s))) return false;
    return true;
  });

  const perPage = 10;
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const meta = { current_page: page, last_page: lastPage, from: total === 0 ? 0 : (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total };

  const saveSettings = async () => {
    setSavingSettings(true);
    const fd = new FormData();
    fd.append('eyebrow', settings.eyebrow || '');
    fd.append('title', settings.title || '');
    fd.append('subtitle', settings.subtitle || '');
    fd.append('archive_url', settings.archive_url || '');
    try {
      await axios.put('/api/homepage/gallery-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('settings'); setTimeout(() => setSuccess(''), 3000);
    } catch {}
    setSavingSettings(false);
  };

  const openModal = (item = null) => {
    setModal({ open: true, data: item });
    if (item) {
      setForm({ title: item.title || '', description: item.description || '', count: item.count || '' });
    } else {
      setForm({ title: '', description: '', count: '' });
    }
    setImage(null);
  };

  const saveAlbum = async () => {
    if (!form.title.trim()) return;
    setSavingAlbum(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image_file', image);
    try {
      if (modal.data) {
        await axios.put(`/api/homepage/gallery/${modal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/homepage/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModal({ open: false, data: null });
      setSuccess('album'); setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch {}
    setSavingAlbum(false);
  };

  const deleteAlbum = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/gallery/${deleteModal.id}`); fetchData(); } catch {}
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  return (
    <>
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? "Edit Album" : "Add Album"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Album Title" id="a-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Clubhouse Inauguration" />
            <FormInput label="Photo Count" id="a-count" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} placeholder="e.g. 24 Photos" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Album description..."
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none resize-none" />
          </div>
          <ImageUploadBox label="Cover Image" currentUrl={modal.data?.image_url} file={image} onFileChange={setImage} />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            <button onClick={saveAlbum} disabled={savingAlbum} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {savingAlbum ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteAlbum} loading={deleteModal.loading} icon="delete_outline"
        title="Delete Album?" message={`Delete <strong>${deleteModal.title}</strong>? This cannot be undone.`} confirmLabel="Yes, Delete" />

      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title="Gallery Settings" subtitle="Configure the main gallery header">
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Eyebrow Label" id="g-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder="e.g. Visual Tour" />
            <FormInput label="Section Title" id="g-title" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Gallery" />
            <div className="md:col-span-2"><FormInput label="Subtitle" id="g-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder="Explore..." /></div>
            <div className="md:col-span-2"><FormInput label="Archive URL" id="g-url" value={settings.archive_url || ''} onChange={e => setSettings(d => ({ ...d, archive_url: e.target.value }))} placeholder="https://..." /></div>
          </div>
        </div>
        <SaveButton onClick={saveSettings} loading={savingSettings} label="Save Settings" />
      </SectionCard>

      <div className="h-6"></div>

      <SectionCard icon="photo_library" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title="Albums" subtitle="Manage gallery albums" badge={albums.length}>
        <SuccessBanner show={success === 'album'} />
        
        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search albums..." />
            <div className="flex-grow"></div>
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> Add Album
            </button>
          </FilterBar>

          <TableWrapper>
            {loading ? (
              <tbody><tr><td colSpan={4} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>Title</Th><Th>Description</Th><Th>Photos</Th><Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.length === 0 ? (
                    <tr><td colSpan={4}><EmptyState icon="photo_library" title="No albums found" subtitle={search ? 'Try adjusting your filters' : 'Add your first album above'} /></td></tr>
                  ) : paged.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {a.image_url ? <img src={a.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" /> : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0"><span className="material-icons text-indigo-500 text-[15px]">photo_library</span></div>
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{a.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 truncate max-w-xs">{a.description || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{a.count || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openModal(a)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">edit</span></button>
                          <button onClick={() => setDeleteModal({ open: true, id: a.id, title: a.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {meta.last_page > 1 && <tfoot><tr><td colSpan={4}><Pagination meta={meta} onChange={p => setPage(p)} /></td></tr></tfoot>}
              </>
            )}
          </TableWrapper>
        </div>
      </SectionCard>
    </>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   TAB 4: BULLETIN
   ═══════════════════════════════════════════════════════════════════════════ */
function BulletinTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ title: '', description: '', date: '', url: '' });
  const [addImage, setAddImage] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [editForm, setEditForm] = useState({ title: '', description: '', date: '', url: '' });
  const [editImage, setEditImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get('/api/homepage/bulletin'); setItems(r.data || []); } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = items.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b.title?.toLowerCase().includes(s) || b.description?.toLowerCase().includes(s);
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const perPage = 10;
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const meta = { current_page: page, last_page: lastPage, from: total === 0 ? 0 : (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total };

  const addBulletin = async () => {
    if (!addForm.title.trim()) return;
    setAddLoading(true);
    const fd = new FormData();
    Object.entries(addForm).forEach(([k, v]) => fd.append(k, v));
    if (addImage) fd.append('image_file', addImage);
    try {
      await axios.post('/api/homepage/bulletin', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAddForm({ title: '', description: '', date: '', url: '' }); setAddImage(null);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      fetch();
    } catch {}
    setAddLoading(false);
  };

  const openEdit = (b) => {
    setEditModal({ open: true, data: b });
    setEditForm({ title: b.title || '', description: b.description || '', date: b.date || '', url: b.url || '' });
    setEditImage(null);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    const fd = new FormData();
    Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
    if (editImage) fd.append('image_file', editImage);
    try {
      await axios.put(`/api/homepage/bulletin/${editModal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditModal({ open: false, data: null });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      fetch();
    } catch {}
    setEditLoading(false);
  };

  const deleteBulletin = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/bulletin/${deleteModal.id}`); fetch(); } catch {}
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  return (
    <>
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, data: null })} title="Edit Bulletin" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Title" id="eb-title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required placeholder="Bulletin title..." />
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                onClick={e => 'showPicker' in e.target && (e.target as any).showPicker()}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
            </div>
          </div>
          <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <ReactQuill theme="snow" value={editForm.description || ''} onChange={v => setEditForm(f => ({ ...f, description: v }))} className="bg-white text-slate-900 rounded-lg" />
            </div>
          <FormInput label="URL" id="eb-url" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="https://... (optional)" />
          <ImageUploadBox label="Bulletin Image" currentUrl={editModal.data?.image_url} file={editImage} onFileChange={setEditImage} />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setEditModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            <button onClick={saveEdit} disabled={editLoading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteBulletin} loading={deleteModal.loading} icon="delete_outline"
        title="Delete Bulletin?" message={`Delete <strong>${deleteModal.title}</strong>? This cannot be undone.`} confirmLabel="Yes, Delete" />

      <SectionCard icon="article" iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-500" title="Bulletin" subtitle="Manage information bulletins" badge={items.length}>
        <SuccessBanner show={success} />
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Add New Bulletin</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Title" id="ab-title" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} required placeholder="Bulletin title..." />
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                  onClick={e => 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker()}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
              </div>
            </div>
            <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <ReactQuill theme="snow" value={addForm.description || ''} onChange={v => setAddForm(f => ({ ...f, description: v }))} className="bg-white text-slate-900 rounded-lg mb-4" />
          </div>
            <FormInput label="URL" id="ab-url" value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))} placeholder="https://... (optional)" />
            <ImageUploadBox label="Bulletin Image" file={addImage} onFileChange={setAddImage} />
            <div className="flex justify-end">
              <button onClick={addBulletin} disabled={addLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
                <span className="material-icons text-base">add</span> {addLoading ? 'Adding...' : 'Add Bulletin'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]"><SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search bulletins..." /></div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> Clear
            </button>
          )}
        </div>

        {loading ? <div className="flex items-center justify-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800"><Th>Title</Th><Th>Date</Th><Th className="text-center">Actions</Th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr><td colSpan={3}><EmptyState icon="article" title="No bulletins found" subtitle="Add your first bulletin above" /></td></tr>
                ) : paged.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {b.image_url ? <img src={b.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" /> : (
                          <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0"><span className="material-icons text-sky-500 text-[15px]">article</span></div>
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{b.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{b.date ? new Date(b.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">edit</span></button>
                        <button onClick={() => setDeleteModal({ open: true, id: b.id, title: b.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {meta.last_page > 1 && <tfoot><tr><td colSpan={3}><Pagination meta={meta} onChange={p => setPage(p)} /></td></tr></tfoot>}
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}



/* ═══════════════════════════════════════════════════════════════════════════
   TAB 6: FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
function FooterTab() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get('/api/homepage/footer').then(r => setData(r.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setLink = (i, field, v) => {
    const links = [...(data.links || [{ label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }])];
    while (links.length < 4) links.push({ label: '', url: '' });
    links[i] = { ...links[i], [field]: v };
    setData(d => ({ ...d, links }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/homepage/footer', data);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  const links = data.links || [{ label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }];
  while (links.length < 4) links.push({ label: '', url: '' });

  return (
    <SectionCard icon="web_asset" iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-500" title="Footer" subtitle="Manage footer content and links">
      <SuccessBanner show={success} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Brand Name" id="ft-brand" value={data.brand_name || ''} onChange={e => set('brand_name', e.target.value)} placeholder="e.g. Dwipapuri" />
          <FormInput label="Tagline" id="ft-tag" value={data.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Cultivating a better lifestyle..." />
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Links</label>
          <p className="text-xs text-slate-400">Up to 4 quick links in the footer. Leave blank to hide.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex-1 space-y-1.5">
                  <input type="text" value={l.label || ''} onChange={e => setLink(i, 'label', e.target.value)} placeholder="Label"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white" />
                  <input type="url" value={l.url || ''} onChange={e => setLink(i, 'url', e.target.value)} placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Contact Email" id="ft-email" value={data.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder="e.g. hello@dwipapuri.com" />
          <FormInput label="Contact Phone" id="ft-phone" value={data.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} placeholder="e.g. +62 123 4567 890" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contact Information / Location</label>
          <ReactQuill theme="snow" value={data.location || ''} onChange={v => set('location', v)} className="bg-white text-slate-900 rounded-lg mb-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Facebook URL" id="ft-fb" value={data.facebook_url || ''} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
          <FormInput label="Instagram URL" id="ft-ig" value={data.instagram_url || ''} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormInput label="Copyright" id="ft-copy" value={data.copyright || ''} onChange={e => set('copyright', e.target.value)} placeholder="e.g. © 2025 Dwipapuri. All rights reserved." />
            <p className="text-xs text-slate-400 mt-1">Shown at the bottom of the footer.</p>
          </div>
          <div>
            <FormInput label="Bottom Note" id="ft-note" value={data.bottom_note || ''} onChange={e => set('bottom_note', e.target.value)} placeholder="e.g. Built for a better community experience." />
            <p className="text-xs text-slate-400 mt-1">Small note below the copyright text.</p>
          </div>
        </div>
      </div>
      <SaveButton onClick={save} loading={saving} label="Save Footer" />
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 7: SEO & METADATA
   ═══════════════════════════════════════════════════════════════════════════ */
function MetadataTab() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ogFile, setOgFile] = useState(null);

  useEffect(() => {
    axios.get('/api/homepage/metadata').then(r => setData(r.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append('page_title', data.page_title || '');
    fd.append('meta_description', data.meta_description || '');
    fd.append('meta_keywords', data.meta_keywords || '');
    fd.append('og_title', data.og_title || '');
    fd.append('og_description', data.og_description || '');
    if (ogFile) fd.append('og_image', ogFile);
    try {
      await axios.put('/api/homepage/metadata', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      setOgFile(null);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  const titleLen = (data.page_title || '').length;
  const descLen = (data.meta_description || '').length;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <span className="material-icons text-violet-500 text-[22px]">manage_search</span>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">SEO & Metadata</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Control how the homepage appears in search engines and social media shares.</p>
        </div>
      </div>

      <SuccessBanner show={success} />

      {/* Basic SEO */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="material-icons text-[16px] text-slate-400">search</span> Search Engine Optimisation (SEO)
        </h3>
        <div>
          <FormInput label="Page Title" id="seo-title" value={data.page_title || ''} onChange={e => set('page_title', e.target.value)} placeholder="e.g. Dwipapuri – Residential Community" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-400">Recommended: 50–60 characters for optimal display.</p>
            <span className={`text-xs tabular-nums ${titleLen > 60 ? 'text-amber-500' : 'text-slate-400'}`}>{titleLen} / 60 recommended</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Meta Description</label>
          <textarea value={data.meta_description || ''} onChange={e => set('meta_description', e.target.value)} rows={3} maxLength={300} placeholder="e.g. Official portal of Dwipapuri Residential Community..."
            className="block w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-400">Recommended: 120–160 characters.</p>
            <span className={`text-xs tabular-nums ${descLen > 160 ? 'text-amber-500' : 'text-slate-400'}`}>{descLen} / 160 recommended</span>
          </div>
        </div>
        <div>
          <FormInput label="Meta Keywords (optional)" id="seo-kw" value={data.meta_keywords || ''} onChange={e => set('meta_keywords', e.target.value)} placeholder="e.g. perumahan, iuran warga, komunitas, dwipapuri" />
          <p className="text-xs text-slate-400 mt-1">Comma-separated keywords. Mostly ignored by Google but used by some search engines.</p>
        </div>
      </div>

      {/* Open Graph */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="material-icons text-[16px] text-slate-400">share</span> Open Graph — Social Share Preview
        </h3>

        {/* Live Preview */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 max-w-sm">
          {data.og_image || ogFile ? (
            <img src={ogFile ? URL.createObjectURL(ogFile) : data.og_image} alt="OG" className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-icons text-slate-300 dark:text-slate-600 text-5xl">image</span>
            </div>
          )}
          <div className="p-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">dwipapuri.amsite.click</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{data.og_title || data.page_title || 'Dwipapuri'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{data.og_description || data.meta_description || ''}</p>
          </div>
        </div>

        <FormInput label="OG Title (optional)" id="og-title" value={data.og_title || ''} onChange={e => set('og_title', e.target.value)} placeholder={data.page_title || 'Defaults to Page Title'} />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">OG Description (optional)</label>
          <textarea value={data.og_description || ''} onChange={e => set('og_description', e.target.value)} rows={2} maxLength={300} placeholder={data.meta_description || 'Defaults to Meta Description'}
            className="block w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
        </div>
        <ImageUploadBox label="OG Image (optional)" currentUrl={data.og_image} file={ogFile} onFileChange={setOgFile} />
      </div>

      <SaveButton onClick={save} loading={saving} label="Save Metadata" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminHomepage() {
  const { tab } = useParams();
  const activeTab = tab || 'hero';

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const renderTab = () => {
    switch (activeTab) {
      case 'hero': return <HeroTab />;
      case 'events':   return <EventsTab />;
      case 'gallery':  return <GalleryTab />;
      case 'bulletin': return <BulletinTab />;
      case 'footer':   return <FooterTab />;
      case 'metadata': return <MetadataTab />;
      default: return null;
    }
  };

  const tabTitle = TABS.find(t => t.key === activeTab)?.label || 'Homepage CMS';

  return (
    <AdminLayout title={tabTitle}>
      <div className="max-w-5xl mx-auto pb-12">
        <PageHeader title={tabTitle} subtitle="Manage homepage content" />

        {/* Active Tab Content */}
        {renderTab()}
      </div>
    </AdminLayout>
  );
}

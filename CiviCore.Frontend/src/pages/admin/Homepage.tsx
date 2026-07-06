// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { compressImage } from '../../utils/imageCompressor';
import AdminLayout from '../../admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { PageHeader, Modal, ConfirmModal, FormInput, FormSelect, SearchInput, SelectFilter, FilterBar, Pagination, TableWrapper, Th, EmptyState, StatusBadge } from '../../admin/components/ui';
import NavigationTab from '../../admin/homepage/Navigation';
import { usePermissions } from '../../admin/PermissionsContext';

/* ═══════════════════════════════════════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'hero', label: 'Hero Section', icon: 'star' },
  { key: 'events', label: 'Events', icon: 'event' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
  { key: 'bulletin', label: 'Bulletin', icon: 'article' },
  { key: 'property', label: 'Properties', icon: 'home_work' },
  { key: 'navigation', label: 'Navigation', icon: 'menu' },
  { key: 'footer', label: 'Footer', icon: 'web_asset' },
  { key: 'metadata', label: 'SEO & Metadata', icon: 'manage_search' },
];

const CATEGORY_OPTIONS = [
  { value: 'wellness', label: 'Wellness' }, { value: 'meetings', label: 'Meetings' },
  { value: 'education', label: 'Education' }, { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' }, { value: 'other', label: 'Other' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'house', label: 'House' }
];

const PROPERTY_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' }, { value: 'sold', label: 'Sold' }, { value: 'rented', label: 'Rented' },
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

function SaveButton({ onClick, loading, label = 'Save Changes', disabled = false }) {
  const { can } = usePermissions();
  const canEdit = can('homepage.edit');
  return (
    <div className="flex justify-end pt-4 px-6 pb-6">
      <button onClick={onClick} disabled={loading || disabled || !canEdit}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
        <span className="material-icons text-base">{loading ? 'hourglass_top' : 'save'}</span>
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}

function ImageUploadBox({ id, label, currentUrl, onFileChange, file, recommendedSize }: any) {
  const inputRef = React.useRef<any>(null);
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
          <span className="text-xs font-semibold text-slate-500">Upload New Image <span className="text-slate-400 font-normal">(optional · max 1 MB auto-compressed{recommendedSize ? ` · rec: ${recommendedSize}` : ''})</span></span>
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
function HeroTab({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  useEffect(() => {
    axios.get('/api/homepage/hero').then(r => setData(r.data || {})).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append('title', data.title || '');
    fd.append('subtitle', data.subtitle || '');
    fd.append('cta_label', data.cta_label || '');
    fd.append('cta_url', data.cta_url || '');
    if (bgImage) fd.append('background_image', await compressImage(bgImage));
    try {
      await axios.put('/api/homepage/hero', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      setBgImage(null);
    } catch { }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="CTA Button Text" id="hero-cta" value={data.cta_label || ''} onChange={e => set('cta_label', e.target.value)} placeholder="e.g. Schedule a Visit" />
          <FormInput label="CTA Button URL" id="hero-cta-url" value={data.cta_url || ''} onChange={e => set('cta_url', e.target.value)} placeholder="e.g. /schedule-visit" />
        </div>
        <ImageUploadBox label="Background Image" currentUrl={data.background_image_url} file={bgImage} onFileChange={setBgImage} recommendedSize="1920x1080" />
      </div>
      {canEdit && <SaveButton onClick={save} loading={saving} label="Save Hero Section" />}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 2: EVENTS
   ═══════════════════════════════════════════════════════════════════════════ */
function EventsTab({ canEdit }: { canEdit: boolean }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', category: '', status: '', url: '' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState({ eyebrow: '', title: '', subtitle: '' });
  const [savingSettings, setSavingSettings] = useState(false);


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

  const fetchSettings = useCallback(async () => {
    try { const r = await axios.get('/api/homepage/event-settings'); setSettings(r.data); } catch { }
  }, []);

  useEffect(() => { fetchEvents(); fetchSettings(); }, [fetchEvents, fetchSettings]);

  const saveSettings = async () => {
    setSavingSettings(true);
    const fd = new FormData();
    fd.append('eyebrow', settings.eyebrow || '');
    fd.append('title', settings.title || '');
    fd.append('subtitle', settings.subtitle || '');
    try {
      await axios.put('/api/homepage/event-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('settings'); setTimeout(() => setSuccess(''), 3000);
    } catch { }
    setSavingSettings(false);
  };

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
      setForm({ title: ev.title || '', description: ev.description || '', date: ev.date ? (ev.date.includes('T') ? ev.date.slice(0, 16) : ev.date + 'T00:00') : '', location: ev.location || '', category: ev.category || '', status: ev.status || '', url: ev.url || '' });
    } else {
      setForm({ title: '', description: '', date: '', location: '', category: '', status: '', url: '' });
    }
    setImage(null);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image_file', await compressImage(image));
    try {
      if (modal.data) {
        await axios.put(`/api/homepage/events/${modal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/homepage/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModal({ open: false, data: null });
      setSuccess('event'); setTimeout(() => setSuccess(''), 3000);
      fetchEvents();
    } catch { }
    setSaving(false);
  };

  const deleteEvent = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/events/${deleteModal.id}`); fetchEvents(); } catch { }
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  const catLabel = (c) => CATEGORY_OPTIONS.find(o => o.value === c)?.label || c || '—';

  return (
    <>
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? "Edit Event" : "Add Event"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Title" id="ev-title" value={form.title} onChange={e => {
              const title = e.target.value;
              const slug = '/events/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              setForm(f => ({ ...f, title, url: (!f.url || f.url.startsWith('/events/')) ? slug : f.url }));
            }} required placeholder="Event title..." />
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date & Time</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
            </div>
            <FormInput label="Location" id="ev-location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Central Garden" />
            <FormSelect label="Category" id="ev-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORY_OPTIONS} placeholder="None" />
          </div>
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
            </div>
            <ReactQuill theme="snow" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL</label>
            <input type="text" readOnly disabled value={form.url} placeholder="Auto-generated from title" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
          </div>
          <ImageUploadBox label="Event Image" currentUrl={modal.data?.image_url} file={image} onFileChange={setImage} recommendedSize="1000x600" />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            {canEdit && <button onClick={saveEvent} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteEvent} loading={deleteModal.loading} icon="delete_outline"
        title="Delete Event?" message={`Delete <strong>${deleteModal.title}</strong>? This cannot be undone.`} confirmLabel="Yes, Delete" />

      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title="Event Settings" subtitle="Configure the main events header">
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Eyebrow Label" id="e-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder="e.g. Discover More" />
            <FormInput label="Section Title" id="e-title" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Events" />
            <div className="md:col-span-2"><FormInput label="Subtitle" id="e-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder="Explore..." /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label="Save Settings" />}
      </SectionCard>

      <div className="h-6"></div>

      <SectionCard icon="event" iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-500" title="Events" subtitle="Manage community events displayed on the homepage" badge={events.length}>
        <SuccessBanner show={success === 'event'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search events..." />
            <SelectFilter value={catFilter} onChange={v => { setCatFilter(v); setPage(1); }} options={CATEGORY_OPTIONS} placeholder="All Categories" />
            <div className="flex-grow"></div>
            {canEdit && <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> Add Event
            </button>}
          </FilterBar>

          <TableWrapper>
            {loading ? (
              <tbody><tr><td colSpan={7} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>Title</Th><Th>Category</Th><Th>Date</Th><Th>Time</Th><Th>Location</Th><Th>Status</Th><Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon="event_busy" title="No events found" subtitle={search || catFilter ? 'Try adjusting your filters' : 'Add your first event above'} /></td></tr>
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
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{ev.date && ev.date.includes('T') ? new Date(ev.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{ev.location || '—'}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={ev.status === 'upcoming' ? 'pending' : (ev.status === 'ongoing' ? 'active' : 'inactive')} />
                        {ev.status && <span className="ml-1 text-xs text-slate-400">({ev.status})</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit && <button onClick={() => openModal(ev)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">edit</span></button>}
                          {canEdit && <button onClick={() => setDeleteModal({ open: true, id: ev.id, title: ev.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>}
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

function ManagePhotosModal({ open, album, onClose, onRefresh, canEdit }: any) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [file, setFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchPhotos = useCallback(async () => {
    if (!album?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/homepage/gallery/${album.id}`);
      setPhotos(res.data?.photos || []);
    } catch { }
    setLoading(false);
  }, [album?.id]);

  useEffect(() => {
    if (open) {
      setFile(null);
      setTitle('');
      setDescription('');
      fetchPhotos();
    }
  }, [open, fetchPhotos]);

  const uploadPhoto = async () => {
    if (!file || !album?.id) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image_file', await compressImage(file));
    if (title) fd.append('title', title);
    if (description) fd.append('description', description);

    try {
      await axios.post(`/api/homepage/gallery/${album.id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      setTitle('');
      setDescription('');
      await fetchPhotos();
      if (onRefresh) onRefresh();
    } catch { }
    setUploading(false);
  };

  const deletePhoto = async () => {
    if (!album?.id || !deleteConfirmId) return;
    setDeleting(deleteConfirmId);
    try {
      await axios.delete(`/api/homepage/gallery/${album.id}/photos/${deleteConfirmId}`);
      await fetchPhotos();
      if (onRefresh) onRefresh();
    } catch { }
    setDeleting(null);
    setDeleteConfirmId(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Manage Photos - ${album?.title}`} size="xl">
      <div className="space-y-6">
        {canEdit && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Upload New Photo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormInput label="Title (Optional)" id="p-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pool Area" />
              <FormInput label="Description (Optional)" id="p-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Enjoying the sunset..." />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <ImageUploadBox label="" currentUrl="" file={file} onFileChange={setFile} recommendedSize="Any" />
              </div>
              <button onClick={uploadPhoto} disabled={!file || uploading} className="px-5 h-[100px] rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed mb-1.5 flex flex-col items-center justify-center gap-1">
                {uploading ? <span className="material-icons animate-spin">autorenew</span> : <span className="material-icons">cloud_upload</span>}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Album Photos ({photos.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8"><span className="material-icons animate-spin text-primary text-3xl">autorenew</span></div>
          ) : photos.length === 0 ? (
            <EmptyState icon="photo_library" title="No photos yet" subtitle="Upload your first photo above" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {photos.map(p => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 dark:border-slate-700">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div>
                        {p.title && <p className="text-white text-xs font-bold truncate">{p.title}</p>}
                        {p.description && <p className="text-white/80 text-[10px] truncate">{p.description}</p>}
                      </div>
                      <button onClick={() => setDeleteConfirmId(p.id)} disabled={deleting === p.id} className="self-end p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                        {deleting === p.id ? <span className="material-icons animate-spin text-sm">autorenew</span> : <span className="material-icons text-sm">delete_outline</span>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={deletePhoto}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        loading={!!deleting}
      />
    </Modal>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   TAB 3: GALLERY
   ═══════════════════════════════════════════════════════════════════════════ */
function GalleryTab({ canEdit }: { canEdit: boolean }) {
  const [settings, setSettings] = useState<any>({});
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState({ open: false, data: null });
  const [managePhotosModal, setManagePhotosModal] = useState({ open: false, album: null });
  const [form, setForm] = useState({ title: '', description: '' });
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
    } catch { }
    setSavingSettings(false);
  };

  const openModal = (item = null) => {
    setModal({ open: true, data: item });
    if (item) {
      setForm({ title: item.title || '', description: item.description || '' });
    } else {
      setForm({ title: '', description: '' });
    }
    setImage(null);
  };

  const saveAlbum = async () => {
    if (!form.title.trim()) return;
    setSavingAlbum(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image_file', await compressImage(image));
    try {
      if (modal.data) {
        await axios.put(`/api/homepage/gallery/${modal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/homepage/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModal({ open: false, data: null });
      setSuccess('album'); setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch { }
    setSavingAlbum(false);
  };

  const deleteAlbum = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/gallery/${deleteModal.id}`); fetchData(); } catch { }
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  return (
    <>
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? "Edit Album" : "Add Album"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <FormInput label="Album Title" id="a-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Clubhouse Inauguration" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Album description..."
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none resize-none" />
          </div>
          <ImageUploadBox label="Cover Image" currentUrl={modal.data?.image_url} file={image} onFileChange={setImage} recommendedSize="1000x800" />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            {canEdit && <button onClick={saveAlbum} disabled={savingAlbum} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {savingAlbum ? 'Saving...' : 'Save Changes'}
            </button>}
          </div>
        </div>
      </Modal>

      <ManagePhotosModal
        open={managePhotosModal.open}
        album={managePhotosModal.album}
        onClose={() => setManagePhotosModal({ open: false, album: null })}
        onRefresh={fetchData}
        canEdit={canEdit}
      />

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
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label="Save Settings" />}
      </SectionCard>

      <div className="h-6"></div>

      <SectionCard icon="photo_library" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title="Albums" subtitle="Manage gallery albums" badge={albums.length}>
        <SuccessBanner show={success === 'album'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search albums..." />
            <div className="flex-grow"></div>
            {canEdit && <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> Add Album
            </button>}
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
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{a.photos?.length || 0} Photos</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setManagePhotosModal({ open: true, album: a })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer" title="Manage Photos"><span className="material-icons text-lg">photo_library</span></button>
                          {canEdit && <button onClick={() => openModal(a)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">edit</span></button>}
                          {canEdit && <button onClick={() => setDeleteModal({ open: true, id: a.id, title: a.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>}
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
function BulletinTab({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ title: '', description: '', date: '', url: '' });
  const [addImage, setAddImage] = useState<any>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, data: null as any });
  const [editForm, setEditForm] = useState({ title: '', description: '', date: '', url: '' });

  const [editImage, setEditImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });
  const [settings, setSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [success, setSuccess] = useState<string | false>(false);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        axios.get('/api/homepage/bulletin'),
        axios.get('/api/homepage/bulletin-settings')
      ]);
      setItems(r.data || []);
      setSettings(s.data || {});
    } catch { setItems([]); }
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
    if (addImage) fd.append('image_file', await compressImage(addImage));
    try {
      await axios.post('/api/homepage/bulletin', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAddForm({ title: '', description: '', date: '', url: '' }); setAddImage(null);
      setAddModalOpen(false);
      setSuccess('item'); setTimeout(() => setSuccess(false), 3000);
      fetch();
    } catch { }
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
    if (editImage) fd.append('image_file', await compressImage(editImage));
    try {
      await axios.put(`/api/homepage/bulletin/${editModal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditModal({ open: false, data: null });
      setSuccess('item'); setTimeout(() => setSuccess(false), 3000);
      fetch();
    } catch { }
    setEditLoading(false);
  };

  const deleteBulletin = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/bulletin/${deleteModal.id}`); fetch(); } catch { }
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const fd = new FormData();
    Object.entries(settings).forEach(([k, v]) => fd.append(k, v as string));
    try {
      await axios.put('/api/homepage/bulletin-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('settings'); setTimeout(() => setSuccess(false), 3000);
    } catch { }
    setSavingSettings(false);
  };

  return (
    <>
      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title="Bulletin Settings" subtitle="Configure the main bulletin header">
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Eyebrow Label" id="b-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder="e.g. Informasi" />
            <FormInput label="Section Title" id="b-title" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Buletin" />
            <div className="md:col-span-2"><FormInput label="Subtitle" id="b-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder="Explore our bulletins..." /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label="Save Settings" />}
      </SectionCard>

      <div className="h-6"></div>

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Bulletin" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Title" id="ab-title" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} required placeholder="Bulletin title..." />
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                onClick={e => 'showPicker' in e.target && (e.target as any).showPicker()}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
            </div>
            <ReactQuill theme="snow" value={addForm.description || ''} onChange={v => setAddForm(f => ({ ...f, description: v }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
          </div>
          <FormInput label="URL" id="ab-url" value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))} placeholder="https://... (optional)" />
          <ImageUploadBox label="Bulletin Image" file={addImage} onFileChange={setAddImage} recommendedSize="800x600" />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setAddModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            {canEdit && <button onClick={addBulletin} disabled={addLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              <span className="material-icons text-base">add</span> {addLoading ? 'Adding...' : 'Add Bulletin'}
            </button>}
          </div>
        </div>
      </Modal>

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
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
            </div>
            <ReactQuill theme="snow" value={editForm.description || ''} onChange={v => setEditForm(f => ({ ...f, description: v }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
          </div>
          <FormInput label="URL" id="eb-url" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="https://... (optional)" />
          <ImageUploadBox label="Bulletin Image" currentUrl={editModal.data?.image_url} file={editImage} onFileChange={setEditImage} recommendedSize="800x600" />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setEditModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            {canEdit && <button onClick={saveEdit} disabled={editLoading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteBulletin} loading={deleteModal.loading} icon="delete_outline"
        title="Delete Bulletin?" message={`Delete <strong>${deleteModal.title}</strong>? This cannot be undone.`} confirmLabel="Yes, Delete" />

      <SectionCard icon="article" iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-500" title="Bulletin" subtitle="Manage information bulletins" badge={items.length}>
        <SuccessBanner show={success === 'item'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search bulletins..." />
            <div className="flex-grow"></div>
            {canEdit && <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> Add Bulletin
            </button>}
          </FilterBar>

          <TableWrapper>
            {loading ? (
              <tbody><tr><td colSpan={3} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>Title</Th><Th>Date</Th><Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.length === 0 ? (
                    <tr><td colSpan={3}><EmptyState icon="article" title="No bulletins found" subtitle={search ? 'Try adjusting your search' : 'Add your first bulletin above'} /></td></tr>
                  ) : paged.map((b: any) => (
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
                          {canEdit && <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">edit</span></button>}
                          {canEdit && <button onClick={() => setDeleteModal({ open: true, id: b.id, title: b.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {meta.last_page > 1 && <tfoot><tr><td colSpan={3}><Pagination meta={meta} onChange={(p: any) => setPage(p)} /></td></tr></tfoot>}
              </>
            )}
          </TableWrapper>
        </div>
      </SectionCard>
    </>
  );
}



/* ═══════════════════════════════════════════════════════════════════════════
   TAB 5: PROPERTY
   ═══════════════════════════════════════════════════════════════════════════ */
function PropertyTab({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: any; loading: boolean }>({ open: false, item: null, loading: false });
  const [settings, setSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [success, setSuccess] = useState<string | false>(false);
  
  const [imageModal, setImageModal] = useState<{ open: boolean; property: any }>({ open: false, property: null });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteImageConfirmUrl, setDeleteImageConfirmUrl] = useState<string | null>(null);

  const [form, setForm] = useState({ 
    title: '', type: 'house', price: '', status: 'available', description: '', location: '',
    bedrooms: '', bathrooms: '', landArea: '', buildingArea: '', amenities: '', contactName: '', contactPhone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProperty, setSavingProperty] = useState(false);
  const isEdit = !!modal.data?.id;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        axios.get('/api/property', { params: filters }),
        axios.get('/api/homepage/property-settings').catch(() => ({ data: {} }))
      ]);
      const d = r.data;
      setData(Array.isArray(d) ? d : (d.data || []));
      setMeta(d.meta || null);
      setSettings(s.data || {});
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const setFilter = (k: string, v: string | number) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !imageModal.property) return;
    setUploadingImage(true);
    const fd = new FormData();
    const compressedFile = await compressImage(e.target.files[0]);
    fd.append('file', compressedFile);
    try {
      await axios.post(`/api/property/${imageModal.property.id}/images`, fd);
      fetch();
      const res = await axios.get(`/api/property/${imageModal.property.id}`);
      setImageModal({ ...imageModal, property: res.data });
    } catch { }
    setUploadingImage(false);
  };

  const deleteImage = async () => {
    if (!imageModal.property || !deleteImageConfirmUrl) return;
    try {
      await axios.delete(`/api/property/${imageModal.property.id}/images?url=${encodeURIComponent(deleteImageConfirmUrl)}`);
      fetch();
      const res = await axios.get(`/api/property/${imageModal.property.id}`);
      setImageModal({ ...imageModal, property: res.data });
    } catch { }
    setDeleteImageConfirmUrl(null);
  };

  const doDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try { await axios.delete(`/api/property/${confirm.item!.id}`); fetch(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm((c) => ({ ...c, loading: false })); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const fd = new FormData();
    Object.entries(settings).forEach(([k, v]) => fd.append(k, v as string));
    try {
      await axios.put('/api/homepage/property-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('settings'); setTimeout(() => setSuccess(false), 3000);
    } catch { }
    setSavingSettings(false);
  };

  const openModal = (p = null) => {
    setModal({ open: true, data: p });
    if (p) {
      setForm({ 
        title: p.title, type: p.type, price: String(p.price), status: p.status, description: p.description || '', location: p.location || '',
        bedrooms: p.bedrooms ? String(p.bedrooms) : '', bathrooms: p.bathrooms ? String(p.bathrooms) : '',
        landArea: p.landArea ? String(p.landArea) : '', buildingArea: p.buildingArea ? String(p.buildingArea) : '',
        amenities: p.amenities || '', contactName: p.contactName || '', contactPhone: p.contactPhone || ''
      });
    } else {
      setForm({ title: '', type: 'house', price: '', status: 'available', description: '', location: '', bedrooms: '', bathrooms: '', landArea: '', buildingArea: '', amenities: '', contactName: '', contactPhone: '' });
    }
    setErrors({});
  };

  const setFormValue = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const saveProperty = async () => {
    setSavingProperty(true); setErrors({});
    try {
      const payload = { 
        ...form, 
        price: Number(form.price),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        landArea: form.landArea ? Number(form.landArea) : null,
        buildingArea: form.buildingArea ? Number(form.buildingArea) : null
      };
      if (isEdit) await axios.put(`/api/property/${modal.data!.id}`, payload);
      else await axios.post('/api/property', payload);
      setSuccess('item'); setTimeout(() => setSuccess(false), 3000);
      setModal({ open: false, data: null });
      fetch();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setSavingProperty(false); }
  };

  return (
    <>
      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title="Property Settings" subtitle="Configure the main properties header">
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Eyebrow Label" id="p-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder="e.g. Properties" />
            <FormInput label="Section Title" id="p-title-set" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Featured Listings" />
            <div className="md:col-span-2"><FormInput label="Subtitle" id="p-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder="Explore available properties..." /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label="Save Settings" />}
      </SectionCard>

      <div className="h-6"></div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={isEdit ? 'Edit Property' : 'Add Property'} size="lg">
        <div className="space-y-4">
          {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
          <FormInput label="Title" id="p-title" value={form.title} onChange={setFormValue('title')} error={errors.title} required placeholder="e.g. Unit A-01 For Rent" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect label="Status" id="p-status" value={form.status} onChange={setFormValue('status')} options={PROPERTY_STATUS_OPTIONS} />
            <FormInput label="Price (Rp)" id="p-price" type="number" value={form.price} onChange={setFormValue('price')} error={errors.price} placeholder="0" />
          </div>
          <FormInput label="Location" id="p-loc" value={form.location} onChange={setFormValue('location')} placeholder="Block & unit, e.g. Block A No. 5" />
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <FormInput label="Bedrooms" id="p-beds" type="number" value={form.bedrooms} onChange={setFormValue('bedrooms')} placeholder="e.g. 3" />
            <FormInput label="Bathrooms" id="p-baths" type="number" value={form.bathrooms} onChange={setFormValue('bathrooms')} placeholder="e.g. 2" />
            <FormInput label="Land Area" id="p-land" type="number" value={form.landArea} onChange={setFormValue('landArea')} placeholder="m²" />
            <FormInput label="Build Area" id="p-build" type="number" value={form.buildingArea} onChange={setFormValue('buildingArea')} placeholder="m²" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Contact Name" id="p-cname" value={form.contactName} onChange={setFormValue('contactName')} placeholder="Agent or owner name" />
            <FormInput label="Contact Phone" id="p-cphone" value={form.contactPhone} onChange={setFormValue('contactPhone')} placeholder="+62..." />
          </div>

          <FormInput label="Amenities" id="p-amenities" value={form.amenities} onChange={setFormValue('amenities')} placeholder="e.g. Infinity Pool, Smart Garage, 24/7 Security" />

          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
            </div>
            <ReactQuill theme="snow" value={form.description} onChange={(val) => setForm(p => ({ ...p, description: val }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5 px-2 mt-4">
            <button onClick={() => setModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
            {canEdit && <button onClick={saveProperty} disabled={savingProperty} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {savingProperty ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Property'}
            </button>}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title="Delete Property?" message={`Delete <strong>${confirm.item?.title}</strong>? This cannot be undone.`}
        confirmLabel="Yes, Delete" />

      {imageModal.open && imageModal.property && (
        <Modal open={imageModal.open} onClose={() => setImageModal({ open: false, property: null })} title="Manage Property Images" icon="image" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(imageModal.property.images || []).map((img: string, i: number) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800">
                  <img src={img} alt="Property" className="w-full h-full object-cover" />
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setDeleteImageConfirmUrl(img)} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors cursor-pointer">
                        <span className="material-icons text-sm">delete_outline</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {canEdit && (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="material-icons text-4xl text-slate-400 mb-2">{uploadingImage ? 'hourglass_empty' : 'cloud_upload'}</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed text-center">
                  JPG, PNG, WebP.<br/>Automatically compressed before upload.<br/>(Recommended: 1200x800)
                </p>
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage} />
              </label>
            )}
          </div>
          <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5 mt-6">
            <button onClick={() => setImageModal({ open: false, property: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Done</button>
          </div>
          <ConfirmModal
            open={!!deleteImageConfirmUrl}
            onClose={() => setDeleteImageConfirmUrl(null)}
            onConfirm={deleteImage}
            title="Delete Photo"
            message="Are you sure you want to delete this photo? This action cannot be undone."
          />
        </Modal>
      )}

      <SectionCard icon="home_work" iconBg="bg-teal-100 dark:bg-teal-900/30" iconColor="text-teal-500" title="Property Listings" subtitle="Manage available, sold, and rented properties" badge={data.length}>
        <SuccessBanner show={success === 'item'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder="Search title, location…" />
            <SelectFilter value={filters.status} onChange={(v) => setFilter('status', v)} options={PROPERTY_STATUS_OPTIONS} placeholder="All Status" />
            <button onClick={() => setFilters({ search: '', type: '', status: '', page: 1 })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> Clear
            </button>
            <div className="flex-grow"></div>
            {canEdit && <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> Add Property
            </button>}
          </FilterBar>

          <TableWrapper>
            {loading ? (
              <tbody><tr><td colSpan={5} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>Property</Th>
                    <Th className="text-right">Price</Th>
                    <Th>Status</Th>
                    <Th>Listed</Th>
                    <Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState icon="home_work" title="No properties found" subtitle="Add your first property listing" /></td></tr>
                  ) : data.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
                        {p.location && <p className="text-xs text-slate-400 mt-0.5">{p.location}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Rp {p.price.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setImageModal({ open: true, property: p })} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer">
                            <span className="material-icons text-lg">image</span>
                          </button>
                          {canEdit && <button onClick={() => openModal(p)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer">
                            <span className="material-icons text-lg">edit</span>
                          </button>}
                          {canEdit && <button onClick={() => setConfirm({ open: true, item: p, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer">
                            <span className="material-icons text-lg">delete_outline</span>
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {meta && meta.last_page > 1 && <tfoot><tr><td colSpan={6}><Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></td></tr></tfoot>}
              </>
            )}
          </TableWrapper>
        </div>
      </SectionCard>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 6: FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
function FooterTab({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get('/api/homepage/footer').then(r => setData(r.data || {})).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  
  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/homepage/footer', data);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  return (
    <SectionCard icon="web_asset" iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-500" title="Footer" subtitle="Manage footer content and links">
      <SuccessBanner show={success} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Brand Name" id="ft-brand" value={data.brand_name || ''} onChange={e => set('brand_name', e.target.value)} placeholder="e.g. Dwipapuri" />
          <FormInput label="Tagline" id="ft-tag" value={data.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Cultivating a better lifestyle..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Contact Email" id="ft-email" value={data.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder="e.g. hello@dwipapuri.com" />
          <FormInput label="Contact Phone" id="ft-phone" value={data.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} placeholder="e.g. +62 123 4567 890" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contact Information / Location</label>
          <ReactQuill theme="snow" value={data.location || ''} onChange={v => set('location', v)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg mb-4" />
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
      {canEdit && <SaveButton onClick={save} loading={saving} label="Save Footer" />}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 7: SEO & METADATA
   ═══════════════════════════════════════════════════════════════════════════ */
function MetadataTab({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ogFile, setOgFile] = useState(null);

  useEffect(() => {
    axios.get('/api/homepage/metadata').then(r => setData(r.data || {})).catch(() => { }).finally(() => setLoading(false));
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
    if (ogFile) fd.append('og_image', await compressImage(ogFile));
    try {
      await axios.put('/api/homepage/metadata', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      setOgFile(null);
    } catch { }
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
        <ImageUploadBox label="OG Image (optional)" currentUrl={data.og_image} file={ogFile} onFileChange={setOgFile} recommendedSize="1200x630" />
      </div>

      {canEdit && <SaveButton onClick={save} loading={saving} label="Save Metadata" />}
    </div>
  );
}

/* Main Component */
export default function AdminHomepage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { tab } = useParams();
  const activeTab = tab || 'hero';

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = "Bearer " + token;

  const renderTab = () => {
    const canEdit = can('homepage.edit');
    switch (activeTab) {
      case 'hero': return <HeroTab canEdit={canEdit} />;
      case 'events': return <EventsTab canEdit={canEdit} />;
      case 'gallery': return <GalleryTab canEdit={canEdit} />;
      case 'bulletin': return <BulletinTab canEdit={canEdit} />;
      case 'property': return <PropertyTab canEdit={canEdit} />;
      case 'navigation': return <NavigationTab />;
      case 'footer': return <FooterTab canEdit={canEdit} />;
      case 'metadata': return <MetadataTab canEdit={canEdit} />;
      default: return null;
    }
  };

  const tabLabel = TABS.find(function(tb) { return tb.key === activeTab; });
  const tabTitle = t("homepage.tab_" + activeTab, { defaultValue: tabLabel ? tabLabel.label : 'Homepage CMS' });

  return (
    <AdminLayout title={tabTitle}>
      <div className="w-[80%] mx-auto pb-12">
        <PageHeader title={tabTitle} subtitle={t('homepage.subtitle', { defaultValue: "Manage homepage content" })} />

        {!can('homepage.edit') && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <span className="material-icons text-amber-500">lock</span>
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">You have view-only access to this section.</p>
          </div>
        )}

        {renderTab()}
      </div>
    </AdminLayout>
  );
}
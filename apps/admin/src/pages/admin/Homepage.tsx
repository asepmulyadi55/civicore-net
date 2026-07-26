// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { compressImage } from '../../utils/imageCompressor';
import AdminLayout from '../../admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { PageHeader, Modal, ConfirmModal, FormInput, FormSelect, SearchInput, SelectFilter, FilterBar, Pagination, TableWrapper, Th, EmptyState, StatusBadge, ImageUploadBox } from '../../admin/components/ui';
import NavigationTab from '../../admin/homepage/Navigation';
import { usePermissions } from '../../admin/PermissionsContext';

/* ═══════════════════════════════════════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'hero', label: 'Hero Section', icon: 'star' },
  { key: 'news', label: 'News', icon: 'newspaper' },
  { key: 'events', label: 'News / Events', icon: 'newspaper' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
  { key: 'bulletin', label: 'Bulletin', icon: 'article' },
  { key: 'properties', label: 'Properties', icon: 'home_work' },
  { key: 'navigation', label: 'Navigation', icon: 'menu' },
  { key: 'footer', label: 'Footer', icon: 'web_asset' },
  { key: 'emergency', label: 'Kontak Darurat', icon: 'emergency' },
  { key: 'visit', label: 'Jadwalkan Kunjungan', icon: 'calendar_month' },
  { key: 'metadata', label: 'SEO & Metadata', icon: 'manage_search' },
];

const CATEGORY_OPTIONS = [
  { value: 'media', label: 'Media' }, { value: 'religious', label: 'Religious' },
  { value: 'national', label: 'National' }, { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
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


function SuccessBanner({ show }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
      <span className="material-icons text-emerald-500">check_circle</span>
      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{t('homepage.msg_save_success', 'Changes saved successfully!')}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 1: FEATURED EVENT
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
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
    <SectionCard icon="star" iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-500" title={t('homepage.title_hero_section', 'Hero Section')} subtitle={t('homepage.subtitle_hero_section', 'The main header on the public homepage')}>
      <SuccessBanner show={success} />
      <div className="p-6 space-y-5">
        <FormInput label={t('homepage.label_main_title', 'Main Title')} id="hero-title" value={data.title || ''} onChange={e => set('title', e.target.value)} placeholder={t('homepage.placeholder_welcome', 'e.g. Welcome to Dwipapuri Residence')} />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.label_subtitle', 'Subtitle')}</label>
          <textarea value={data.subtitle || ''} onChange={e => set('subtitle', e.target.value)} rows={3} placeholder={t('homepage.placeholder_modern_living', 'e.g. Modern Living in Harmony...')}
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none resize-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label={t('homepage.label_cta_text', 'CTA Button Text')} id="hero-cta" value={data.cta_label || ''} onChange={e => set('cta_label', e.target.value)} placeholder={t('homepage.placeholder_schedule_visit', 'e.g. Schedule a Visit')} />
          <FormInput label={t('homepage.label_cta_url', 'CTA Button URL')} id="hero-cta-url" value={data.cta_url || ''} onChange={e => set('cta_url', e.target.value)} placeholder={t('homepage.placeholder_schedule_url', 'e.g. /schedule-visit')} />
        </div>
        <ImageUploadBox label={t('homepage.label_background_image', 'Background Image')} currentUrl={data.background_image_url} file={bgImage} onFileChange={setBgImage} recommendedSize="1920x1080" />
      </div>
      {canEdit && <SaveButton onClick={save} loading={saving} label={t('homepage.btn_save_hero', 'Save Hero Section')} />}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 2: NEWS
   ═══════════════════════════════════════════════════════════════════════════ */
function NewsTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState({ eyebrow: '', title: '', subtitle: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get('/api/homepage/news'); setEvents(r.data || []); } catch { setEvents([]); }
    finally { setLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try { const r = await axios.get('/api/homepage/news-settings'); setSettings(r.data); } catch { }
  }, []);

  useEffect(() => { fetchEvents(); fetchSettings(); }, [fetchEvents, fetchSettings]);

  const saveSettings = async () => {
    setSavingSettings(true);
    const fd = new FormData();
    fd.append('eyebrow', settings.eyebrow || '');
    fd.append('title', settings.title || '');
    fd.append('subtitle', settings.subtitle || '');
    try {
      await axios.put('/api/homepage/news-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  const deleteEvent = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try { await axios.delete(`/api/homepage/news/${deleteModal.id}`); fetchEvents(); } catch { }
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  const catLabel = (c) => CATEGORY_OPTIONS.find(o => o.value === c)?.label || c || '—';

  const [simplePhotosModal, setSimplePhotosModal] = useState<{ open: boolean; item: any; type: string }>({ open: false, item: null, type: 'news' });

  return (
    <>
      <ManageSimplePhotosModal
        open={simplePhotosModal.open}
        item={simplePhotosModal.item}
        itemType={simplePhotosModal.type}
        onClose={() => setSimplePhotosModal({ open: false, item: null, type: 'news' })}
        onRefresh={fetchEvents}
        canEdit={canEdit}
      />
      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteEvent} loading={deleteModal.loading} icon="delete_outline"
        title={t('homepage.title_delete_news', 'Delete News Article?')} message={<>{t('homepage.text_delete_before', 'Delete')} <strong>{deleteModal.title}</strong>? {t('homepage.text_delete_after', 'This cannot be undone.')}</>} confirmLabel={t('homepage.btn_yes_delete', 'Yes, Delete')} />

      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title={t('homepage.title_news_settings', 'News Settings')} subtitle={t('homepage.subtitle_news_settings', 'Configure the main news header')}>
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label={t('homepage.label_eyebrow', 'Eyebrow Label')} id="e-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder={t('homepage.placeholder_discover_more', 'e.g. Discover More')} />
            <FormInput label={t('homepage.label_section_title', 'Section Title')} id="e-title" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder={t('homepage.placeholder_news', 'e.g. News')} />
            <div className="md:col-span-2"><FormInput label={t('homepage.label_subtitle', 'Subtitle')} id="e-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder={t('homepage.placeholder_explore', 'Explore...')} /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label={t('homepage.btn_save_settings', 'Save Settings')} />}
      </SectionCard>

      <div className="h-6"></div>

      <SectionCard icon="newspaper" iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-500" title={t('homepage.title_news', 'News Articles')} subtitle={t('homepage.subtitle_news', 'Manage news articles displayed on the homepage')} badge={events.length}>
        <SuccessBanner show={success === 'event'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={t('homepage.placeholder_search_news', 'Search news...')} />
            <SelectFilter value={catFilter} onChange={v => { setCatFilter(v); setPage(1); }} options={CATEGORY_OPTIONS} placeholder={t('homepage.placeholder_all_categories', 'All Categories')} />
            <div className="flex-grow"></div>
            {canEdit && <Link to="/homepage/news/new" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> {t('homepage.btn_add_news', 'Add Article')}
            </Link>}
          </FilterBar>

          <TableWrapper footer={!loading && meta.last_page > 1 && <Pagination meta={meta} onChange={p => setPage(p)} />}>
            {loading ? (
              <tbody><tr><td colSpan={6} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <Th>{t('homepage.table_title', 'TITLE')}</Th><Th>{t('homepage.table_category', 'CATEGORY')}</Th><Th>{t('homepage.table_date', 'DATE')}</Th><Th>{t('homepage.table_time', 'TIME')}</Th><Th>{t('homepage.table_location', 'LOCATION')}</Th><Th className="text-center">{t('homepage.table_actions', 'ACTIONS')}</Th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState icon="newspaper" title={t('homepage.empty_news_title', 'No news found')} subtitle={t('homepage.empty_news_subtitle', 'Try adjusting your filters or add your first news article above')} /></td></tr>
                  ) : paged.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {ev.image_url ? <img src={ev.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" /> : (
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"><span className="material-icons text-emerald-500 text-[15px]">newspaper</span></div>
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{ev.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{ev.category ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">{catLabel(ev.category)}</span> : <span className="text-slate-400 text-xs">—</span>}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{ev.date ? new Date(ev.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{ev.date && ev.date.includes('T') ? new Date(ev.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{ev.location || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit && <button onClick={() => setSimplePhotosModal({ open: true, item: ev, type: 'news' })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer" title={t('homepage.btn_manage_photos', 'Manage Photos')}><span className="material-icons text-lg">collections</span></button>}
                          {canEdit && <Link to={`/homepage/news/${ev.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer block"><span className="material-icons text-lg block">edit</span></Link>}
                          {canEdit && <button onClick={() => setDeleteModal({ open: true, id: ev.id, title: ev.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </TableWrapper>
        </div>
      </SectionCard>
    </>
  );
}

export function ManageSimplePhotosModal({ open, item, itemType = 'news', onClose, onRefresh, canEdit }: any) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const fetchPhotos = useCallback(async () => {
    if (!item?.id) return;
    setLoading(true);
    try {
      const endpoint = itemType === 'bulletin' ? `/api/homepage/bulletin/${item.id}` : `/api/homepage/news/${item.id}`;
      const res = await axios.get(endpoint);
      setPhotos(res.data?.photos || []);
    } catch { }
    setLoading(false);
  }, [item?.id, itemType]);

  useEffect(() => {
    if (open) {
      setFiles([]);
      fetchPhotos();
    }
  }, [open, fetchPhotos]);

  const uploadPhoto = async () => {
    if (files.length === 0 || !item?.id) return;
    setUploading(true);
    
    try {
      const uploadEndpoint = itemType === 'bulletin' ? `/api/homepage/bulletin/${item.id}/photos` : `/api/homepage/news/${item.id}/photos`;
      for (const file of files) {
        const fd = new FormData();
        fd.append('image_file', await compressImage(file));
        await axios.post(uploadEndpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setFiles([]);
      await fetchPhotos();
      if (onRefresh) onRefresh();
    } catch { }
    setUploading(false);
  };

  const deletePhoto = async () => {
    if (!item?.id || !deleteConfirmId) return;
    setDeleting(deleteConfirmId);
    try {
      const deleteEndpoint = itemType === 'bulletin' ? `/api/homepage/bulletin/${item.id}/photos/${deleteConfirmId}` : `/api/homepage/news/${item.id}/photos/${deleteConfirmId}`;
      await axios.delete(deleteEndpoint);
      await fetchPhotos();
      if (onRefresh) onRefresh();
    } catch { }
    setDeleting(null);
    setDeleteConfirmId(null);
  };

  const modalTitle = itemType === 'bulletin'
    ? `${t('homepage.title_manage_bulletin_photos', 'Manage Bulletin Photos')} - ${item?.title || ''}`
    : `${t('homepage.title_manage_news_photos', 'Manage News Photos')} - ${item?.title || ''}`;

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="xl">
      <div className="space-y-6">
        {canEdit && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('homepage.title_upload_new_photo', 'Upload New Photo')}</h4>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative h-[100px]" onClick={() => document.getElementById(`simple-multiple-file-upload-${itemType}`)?.click()}>
                  <input id={`simple-multiple-file-upload-${itemType}`} type="file" multiple accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }} />
                  <span className="material-icons text-slate-400 mb-1">cloud_upload</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select multiple images'}
                  </p>
                </div>
              </div>
              <button onClick={uploadPhoto} disabled={files.length === 0 || uploading} className="px-5 h-[100px] rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1">
                {uploading ? <span className="material-icons animate-spin">autorenew</span> : <span className="material-icons">cloud_upload</span>}
                {uploading ? t('homepage.text_uploading', 'Uploading...') : t('homepage.text_upload', 'Upload')}
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('homepage.text_album_photos', 'Photos')} ({photos.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8"><span className="material-icons animate-spin text-primary text-3xl">autorenew</span></div>
          ) : photos.length === 0 ? (
            <EmptyState icon="photo_library" title={t('homepage.title_no_photos', 'No photos yet')} subtitle={t('homepage.subtitle_no_photos', 'Upload your first photo above')} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {photos.map(p => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 dark:border-slate-700">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
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
        title={t('homepage.title_delete_photo', 'Delete Photo')}
        message={t('homepage.text_delete_photo_confirm', 'Are you sure you want to delete this photo? This action cannot be undone.')}
        loading={!!deleting}
      />
    </Modal>
  );
}

function ManagePhotosModal({ open, album, onClose, onRefresh, canEdit }: any) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
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
      setFiles([]);
      setTitle('');
      setDescription('');
      fetchPhotos();
    }
  }, [open, fetchPhotos]);

  const uploadPhoto = async () => {
    if (files.length === 0 || !album?.id) return;
    setUploading(true);
    
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('image_file', await compressImage(file));
        if (title) fd.append('title', title);
        if (description) fd.append('description', description);
        await axios.post(`/api/homepage/gallery/${album.id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setFiles([]);
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
    <Modal open={open} onClose={onClose} title={`${t('homepage.title_manage_photos', 'Manage Photos')} - ${album?.title}`} size="xl">
      <div className="space-y-6">
        {canEdit && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('homepage.title_upload_new_photo', 'Upload New Photo')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormInput label={t('homepage.label_title_optional', 'Title (Optional)')} id="p-title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('homepage.placeholder_title', 'e.g. Pool Area')} />
              <FormInput label={t('homepage.label_description_optional', 'Description (Optional)')} id="p-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('homepage.placeholder_desc', 'e.g. Enjoying the sunset...')} />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative h-[100px]" onClick={() => document.getElementById('multiple-file-upload')?.click()}>
                  <input id="multiple-file-upload" type="file" multiple accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }} />
                  <span className="material-icons text-slate-400 mb-1">cloud_upload</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select multiple images'}
                  </p>
                </div>
              </div>
              <button onClick={uploadPhoto} disabled={files.length === 0 || uploading} className="px-5 h-[100px] rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1">
                {uploading ? <span className="material-icons animate-spin">autorenew</span> : <span className="material-icons">cloud_upload</span>}
                {uploading ? t('homepage.text_uploading', 'Uploading...') : t('homepage.text_upload', 'Upload')}
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('homepage.text_album_photos', 'Album Photos')} ({photos.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8"><span className="material-icons animate-spin text-primary text-3xl">autorenew</span></div>
          ) : photos.length === 0 ? (
            <EmptyState icon="photo_library" title={t('homepage.title_no_photos', 'No photos yet')} subtitle={t('homepage.subtitle_no_photos', 'Upload your first photo above')} />
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
        title={t('homepage.title_delete_photo', 'Delete Photo')}
            message={t('homepage.text_delete_photo_confirm', 'Are you sure you want to delete this photo? This action cannot be undone.')}
        loading={!!deleting}
      />
    </Modal>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   TAB 3: GALLERY
   ═══════════════════════════════════════════════════════════════════════════ */
function GalleryTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
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
  const [albumErrors, setAlbumErrors] = useState<Record<string, string>>({});
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
      setAlbumErrors({});
    } else {
      setForm({ title: '', description: '' });
      setAlbumErrors({});
    }
    setImage(null);
  };

  const saveAlbum = async () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = t('homepage.error_album_title_required', 'Album title is required.');
    if (Object.keys(errs).length > 0) { setAlbumErrors(errs); return; }
    setAlbumErrors({});
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
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? t('homepage.text_edit_album', 'Edit Album') : t('homepage.text_add_album', 'Add Album')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <FormInput label={t('homepage.label_album_title', 'Album Title')} id="a-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required error={albumErrors.title} placeholder={t('homepage.placeholder_e_g_clubhouse_inauguration', 'e.g. Clubhouse Inauguration')} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.label_description', 'Description')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder={t('homepage.placeholder_album_description', 'Album description...')}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none resize-none" />
          </div>
          <ImageUploadBox label={t('homepage.label_cover_image', 'Cover Image')} currentUrl={modal.data?.image_url} file={image} onFileChange={setImage} recommendedSize="1000x800" />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button onClick={() => setModal({ open: false, data: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">{t('homepage.label_cancel', 'Cancel')}</button>
            {canEdit && <button onClick={saveAlbum} disabled={savingAlbum} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
              {savingAlbum ? t('homepage.btn_saving', 'Saving...') : t('homepage.btn_save_changes', 'Save Changes')}
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
        title={t('homepage.title_delete_album', 'Delete Album?')} message={<>{t('homepage.text_delete_before', 'Delete')} <strong>{deleteModal.title}</strong>? {t('homepage.text_delete_after', 'This cannot be undone.')}</>} confirmLabel={t('homepage.btn_yes_delete', 'Yes, Delete')} />

      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title={t('homepage.title_gallery_settings', 'Gallery Settings')} subtitle={t('homepage.subtitle_gallery_settings', 'Configure the main gallery header')}>
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label={t('homepage.label_eyebrow', 'Eyebrow Label')} id="g-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder={t('homepage.placeholder_visual_tour', 'e.g. Visual Tour')} />
            <FormInput label={t('homepage.label_section_title', 'Section Title')} id="g-title" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder={t('homepage.placeholder_gallery', 'e.g. Gallery')} />
            <div className="md:col-span-2"><FormInput label={t('homepage.label_subtitle', 'Subtitle')} id="g-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder={t('homepage.placeholder_explore', 'Explore...')} /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label={t('homepage.btn_save_settings', 'Save Settings')} />}
      </SectionCard>

      <div className="h-6"></div>

      <SectionCard icon="photo_library" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title={t('homepage.title_albums', 'Albums')} subtitle={t('homepage.subtitle_albums', 'Manage gallery albums')} badge={albums.length}>
        <SuccessBanner show={success === 'album'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={t('homepage.placeholder_search_albums', 'Search albums...')} />
            <div className="flex-grow"></div>
            {canEdit && <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> {t('homepage.text_add_album', 'Add Album')}
            </button>}
          </FilterBar>

          <TableWrapper footer={!loading && meta.last_page > 1 && <Pagination meta={meta} onChange={p => setPage(p)} />}>
            {loading ? (
              <tbody><tr><td colSpan={4} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>{t('homepage.label_title', 'TITLE')}</Th><Th>{t('homepage.table_description', 'DESCRIPTION')}</Th><Th>{t('homepage.table_photos', 'PHOTOS')}</Th><Th className="text-center">{t('homepage.table_actions', 'ACTIONS')}</Th>
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
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const [simplePhotosModal, setSimplePhotosModal] = useState<{ open: boolean; item: any; type: string }>({ open: false, item: null, type: 'bulletin' });

  return (
    <>
      <ManageSimplePhotosModal
        open={simplePhotosModal.open}
        item={simplePhotosModal.item}
        itemType={simplePhotosModal.type}
        onClose={() => setSimplePhotosModal({ open: false, item: null, type: 'bulletin' })}
        onRefresh={fetch}
        canEdit={canEdit}
      />
      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title={t('homepage.title_bulletin_settings', 'Bulletin Settings')} subtitle={t('homepage.subtitle_bulletin_settings', 'Configure the main bulletin header')}>
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label={t('homepage.label_eyebrow', 'Eyebrow Label')} id="b-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder="e.g. Informasi" />
            <FormInput label={t('homepage.label_section_title', 'Section Title')} id="b-title" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Buletin" />
            <div className="md:col-span-2"><FormInput label={t('homepage.label_subtitle', 'Subtitle')} id="b-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder={t('homepage.placeholder_explore_bulletins', 'Explore our bulletins...')} /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label={t('homepage.btn_save_settings', 'Save Settings')} />}
      </SectionCard>

      <div className="h-6"></div>

      <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={deleteBulletin} loading={deleteModal.loading} icon="delete_outline"
        title={t('homepage.title_delete_bulletin', 'Delete Bulletin?')} message={<>{t('homepage.text_delete_before', 'Delete')} <strong>{deleteModal.title}</strong>? {t('homepage.text_delete_after', 'This cannot be undone.')}</>} confirmLabel={t('homepage.btn_yes_delete', 'Yes, Delete')} />

      <SectionCard icon="article" iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-500" title="Bulletin" subtitle="Manage information bulletins" badge={items.length}>
        <SuccessBanner show={success === 'item'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={t('homepage.placeholder_search_bulletins', 'Search bulletins...')} />
            <div className="flex-grow"></div>
            {canEdit && <Link to="/homepage/bulletin/new" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> {t('homepage.text_add_bulletin', 'Add Bulletin')}
            </Link>}
          </FilterBar>

          <TableWrapper footer={!loading && meta.last_page > 1 && <Pagination meta={meta} onChange={(p: any) => setPage(p)} />}>
            {loading ? (
              <tbody><tr><td colSpan={3} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>{t('homepage.label_title', 'TITLE')}</Th><Th>{t('homepage.table_date', 'DATE')}</Th><Th className="text-center">{t('homepage.table_actions', 'ACTIONS')}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.length === 0 ? (
                    <tr><td colSpan={3}><EmptyState icon="article" title={t('homepage.empty_bulletins_title', 'No bulletins found')} subtitle={t('homepage.empty_bulletins_subtitle', 'Try adjusting your search or add your first bulletin above')} /></td></tr>
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
                          {canEdit && <button onClick={() => setSimplePhotosModal({ open: true, item: b, type: 'bulletin' })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer" title={t('homepage.btn_manage_photos', 'Manage Photos')}><span className="material-icons text-lg">collections</span></button>}
                          {canEdit && <Link to={`/homepage/bulletin/${b.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer block"><span className="material-icons text-lg block">edit</span></Link>}
                          {canEdit && <button onClick={() => setDeleteModal({ open: true, id: b.id, title: b.title, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"><span className="material-icons text-lg">delete_outline</span></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', page: 1 });
  const [confirm, setConfirm] = useState<{ open: boolean; item: any; loading: boolean }>({ open: false, item: null, loading: false });
  const [settings, setSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [success, setSuccess] = useState<string | false>(false);
  
  const [imageModal, setImageModal] = useState<{ open: boolean; property: any }>({ open: false, property: null });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteImageConfirmUrl, setDeleteImageConfirmUrl] = useState<string | null>(null);

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


  return (
    <>
      <SectionCard icon="settings" iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-500" title={t('homepage.title_property_settings', 'Property Settings')} subtitle={t('homepage.subtitle_property_settings', 'Configure the main properties header')}>
        <SuccessBanner show={success === 'settings'} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label={t('homepage.label_eyebrow', 'Eyebrow Label')} id="p-ey" value={settings.eyebrow || ''} onChange={e => setSettings(d => ({ ...d, eyebrow: e.target.value }))} placeholder={t('homepage.placeholder_properties', 'e.g. Properties')} />
            <FormInput label={t('homepage.label_section_title', 'Section Title')} id="p-title-set" value={settings.title || ''} onChange={e => setSettings(d => ({ ...d, title: e.target.value }))} placeholder={t('homepage.placeholder_featured_listings', 'e.g. Featured Listings')} />
            <div className="md:col-span-2"><FormInput label={t('homepage.label_subtitle', 'Subtitle')} id="p-sub" value={settings.subtitle || ''} onChange={e => setSettings(d => ({ ...d, subtitle: e.target.value }))} placeholder={t('homepage.placeholder_explore_properties', 'Explore available properties...')} /></div>
          </div>
        </div>
        {canEdit && <SaveButton onClick={saveSettings} loading={savingSettings} label={t('homepage.btn_save_settings', 'Save Settings')} />}
      </SectionCard>



      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title={t('homepage.title_delete_property', 'Delete Property?')} message={<>{t('homepage.text_delete_before', 'Delete')} <strong>{confirm.item?.title}</strong>? {t('homepage.text_delete_after', 'This cannot be undone.')}</>} confirmLabel={t('homepage.btn_yes_delete', 'Yes, Delete')} />

      {imageModal.open && imageModal.property && (
        <Modal open={imageModal.open} onClose={() => setImageModal({ open: false, property: null })} title={t('homepage.title_manage_property_images', 'Manage Property Images')} icon="image" size="lg">
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
                  {uploadingImage ? t('homepage.text_uploading', 'Uploading...') : t('homepage.text_click_to_upload', 'Click to upload image')}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed text-center">
                  JPG, PNG, WebP.<br/>Automatically compressed before upload.<br/>(Recommended: 1200x800)
                </p>
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage} />
              </label>
            )}
          </div>
          <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5 mt-6">
            <button onClick={() => setImageModal({ open: false, property: null })} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">{t('homepage.btn_done', 'Done')}</button>
          </div>
          <ConfirmModal
            open={!!deleteImageConfirmUrl}
            onClose={() => setDeleteImageConfirmUrl(null)}
            onConfirm={deleteImage}
            title={t('homepage.title_delete_photo', 'Delete Photo')}
            message={t('homepage.text_delete_photo_confirm', 'Are you sure you want to delete this photo? This action cannot be undone.')}
          />
        </Modal>
      )}

      <SectionCard icon="home_work" iconBg="bg-teal-100 dark:bg-teal-900/30" iconColor="text-teal-500" title={t('homepage.title_property_listings', 'Property Listings')} subtitle={t('homepage.subtitle_property_listings', 'Manage available, sold, and rented properties')} badge={data.length}>
        <SuccessBanner show={success === 'item'} />

        <div className="p-6">
          <FilterBar>
            <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder={t('homepage.placeholder_search_property', 'Search title, location…')} />
            <SelectFilter value={filters.status} onChange={(v) => setFilter('status', v)} options={PROPERTY_STATUS_OPTIONS} placeholder={t('homepage.placeholder_all_status', 'All Status')} />
            <button onClick={() => setFilters({ search: '', type: '', status: '', page: 1 })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> Clear
            </button>
            <div className="flex-grow"></div>
            {canEdit && <Link to="/homepage/properties/new" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap">
              <span className="material-icons text-[18px]">add</span> {t('homepage.text_add_property', 'Add Property')}
            </Link>}
          </FilterBar>

          <TableWrapper footer={!loading && meta && meta.last_page > 1 && <Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />}>
            {loading ? (
              <tbody><tr><td colSpan={5} className="text-center py-16"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></td></tr></tbody>
            ) : (
              <>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <Th>{t('homepage.table_property', 'PROPERTY')}</Th>
                    <Th className="text-right">{t('homepage.table_price', 'PRICE')}</Th>
                    <Th>{t('homepage.table_status', 'STATUS')}</Th>
                    <Th>{t('homepage.table_listed', 'LISTED')}</Th>
                    <Th className="text-center">{t('homepage.table_actions', 'ACTIONS')}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState icon="home_work" title={t('homepage.empty_properties_title', 'No properties found')} subtitle={t('homepage.empty_properties_subtitle', 'Add your first property listing')} /></td></tr>
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
                          {canEdit && <Link to={`/homepage/properties/${p.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer block">
                            <span className="material-icons text-lg block">edit</span>
                          </Link>}
                          {canEdit && <button onClick={() => setConfirm({ open: true, item: p, loading: false })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer">
                            <span className="material-icons text-lg">delete_outline</span>
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
  const { t } = useTranslation();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    axios.get('/api/homepage/footer').then(r => setData(r.data || {})).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  
  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v as string));
    if (logo) fd.append('logo', await compressImage(logo));
    try {
      await axios.put('/api/homepage/footer', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  return (
    <SectionCard icon="web_asset" iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-500" title={t('homepage.title_footer', 'Footer')} subtitle={t('homepage.subtitle_footer', 'Manage footer content and links')}>
      <SuccessBanner show={success} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t('homepage.label_brand_name', 'Brand Name')} id="ft-brand" value={data.brand_name || ''} onChange={e => set('brand_name', e.target.value)} placeholder={t('homepage.placeholder_brand_name', 'e.g. Dwipapuri')} />
          <FormInput label={t('homepage.label_tagline', 'Tagline')} id="ft-tag" value={data.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder={t('homepage.placeholder_tagline', 'e.g. Cultivating a better lifestyle...')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t('homepage.label_contact_email', 'Contact Email')} id="ft-email" value={data.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder={t('homepage.placeholder_contact_email', 'e.g. hello@dwipapuri.com')} />
          <FormInput label={t('homepage.label_contact_phone', 'Contact Phone')} id="ft-phone" value={data.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} placeholder={t('homepage.placeholder_contact_phone', 'e.g. +62 123 4567 890')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.label_contact_info', 'Contact Information / Location')}</label>
          <ReactQuill theme="snow" value={data.location || ''} onChange={v => set('location', v)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg mb-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormInput label={t('homepage.label_copyright', 'Copyright')} id="ft-copy" value={data.copyright || ''} onChange={e => set('copyright', e.target.value)} placeholder={t('homepage.placeholder_copyright', 'e.g. © 2025 Dwipapuri. All rights reserved.')} />
            <p className="text-xs text-slate-400 mt-1">{t('homepage.hint_copyright', 'Shown at the bottom of the footer.')}</p>
          </div>
          <div>
            <FormInput label={t('homepage.label_bottom_note', 'Bottom Note')} id="ft-note" value={data.bottom_note || ''} onChange={e => set('bottom_note', e.target.value)} placeholder={t('homepage.placeholder_bottom_note', 'e.g. Built for a better community experience.')} />
            <p className="text-xs text-slate-400 mt-1">{t('homepage.hint_bottom_note', 'Small note below the copyright text.')}</p>
          </div>
        </div>
      </div>
      {canEdit && <SaveButton onClick={save} loading={saving} label={t('homepage.btn_save_footer', 'Save Footer')} />}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 7: SEO & METADATA
   ═══════════════════════════════════════════════════════════════════════════ */
function MetadataTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
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
    fd.append('org_name', data.org_name || '');
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
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('homepage.title_seo', 'SEO & Metadata')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('homepage.subtitle_seo', 'Control how the homepage appears in search engines and social media shares.')}</p>
        </div>
      </div>

      <SuccessBanner show={success} />

      {/* Basic SEO */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="material-icons text-[16px] text-slate-400">search</span> {t('homepage.heading_seo_basic', 'Search Engine Optimisation (SEO)')}
        </h3>
        <div>
          <FormInput label={t('homepage.label_page_title', 'Page Title')} id="seo-title" value={data.page_title || ''} onChange={e => set('page_title', e.target.value)} placeholder={t('homepage.placeholder_page_title', 'e.g. Dwipapuri – Residential Community')} />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-400">{t('homepage.hint_page_title', 'Recommended: 50–60 characters for optimal display.')}</p>
            <span className={`text-xs tabular-nums ${titleLen > 60 ? 'text-amber-500' : 'text-slate-400'}`}>{titleLen} / 60 {t('homepage.text_recommended', 'recommended')}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.label_meta_description', 'Meta Description')}</label>
          <textarea value={data.meta_description || ''} onChange={e => set('meta_description', e.target.value)} rows={3} maxLength={300} placeholder={t('homepage.placeholder_meta_desc', 'e.g. Official portal of Dwipapuri Residential Community...')}
            className="block w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-400">{t('homepage.hint_meta_desc', 'Recommended: 120–160 characters.')}</p>
            <span className={`text-xs tabular-nums ${descLen > 160 ? 'text-amber-500' : 'text-slate-400'}`}>{descLen} / 160 {t('homepage.text_recommended', 'recommended')}</span>
          </div>
        </div>
        <div>
          <FormInput label={t('homepage.label_meta_keywords', 'Meta Keywords (optional)')} id="seo-kw" value={data.meta_keywords || ''} onChange={e => set('meta_keywords', e.target.value)} placeholder={t('homepage.placeholder_meta_kw', 'e.g. perumahan, iuran warga, komunitas, dwipapuri')} />
          <p className="text-xs text-slate-400 mt-1">{t('homepage.hint_meta_keywords', 'Comma-separated keywords. Mostly ignored by Google but used by some search engines.')}</p>
        </div>
        <div>
          <FormInput label={t('homepage.label_org_name', 'Organisation Name (JSON-LD)')} id="seo-org" value={data.org_name || ''} onChange={e => set('org_name', e.target.value)} placeholder={t('homepage.placeholder_org_name', 'e.g. Dwipapuri Residence')} />
          <p className="text-xs text-slate-400 mt-1">{t('homepage.hint_org_name', 'Used by Google to display your organisation logo in search results. Leave blank to disable.')}</p>
        </div>
      </div>

      {/* Open Graph */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="material-icons text-[16px] text-slate-400">share</span> {t('homepage.heading_og', 'Open Graph — Social Share Preview')}
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

        <FormInput label={t('homepage.label_og_title', 'OG Title (optional)')} id="og-title" value={data.og_title || ''} onChange={e => set('og_title', e.target.value)} placeholder={data.page_title || t('homepage.placeholder_default_page_title', 'Defaults to Page Title')} />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.label_og_desc', 'OG Description (optional)')}</label>
          <textarea value={data.og_description || ''} onChange={e => set('og_description', e.target.value)} rows={2} maxLength={300} placeholder={data.meta_description || t('homepage.placeholder_default_meta_desc', 'Defaults to Meta Description')}
            className="block w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
        </div>
        <ImageUploadBox label={t('homepage.label_og_image', 'OG Image (optional)')} currentUrl={data.og_image} file={ogFile} onFileChange={setOgFile} recommendedSize="1200x630" />
      </div>

      {canEdit && <SaveButton onClick={save} loading={saving} label={t('homepage.btn_save_metadata', 'Save Metadata')} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 8: EMERGENCY CONTACTS
   ═══════════════════════════════════════════════════════════════════════════ */
const ICON_OPTIONS = [
  { value: 'local_police', label: 'Keamanan' },
  { value: 'local_hospital', label: 'Klinik/RS' },
  { value: 'local_fire_department', label: 'Pemadam' },
  { value: 'support_agent', label: 'Manajemen' },
  { value: 'ambulance', label: 'Ambulans' },
  { value: 'emergency', label: 'Darurat' },
  { value: 'phone', label: 'Telepon' },
];

function EmergencyTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, index: -1, label: '' });

  useEffect(() => {
    axios.get('/api/homepage/emergency-contacts')
      .then(r => setContacts(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addContact = () => {
    setContacts(prev => [...prev, { label: '', phone: '', icon: 'phone' }]);
  };

  const updateContact = (idx: number, key: string, value: string) => {
    setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));
  };

  const removeContact = (idx: number) => {
    setContacts(prev => prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setContacts(prev => { const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; });
  };

  const moveDown = (idx: number) => {
    setContacts(prev => { if (idx === prev.length - 1) return prev; const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next; });
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/homepage/emergency-contacts', contacts);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  return (
    <SectionCard icon="emergency" iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500" title={t('homepage.title_emergency', 'Kontak Darurat')} subtitle={t('homepage.subtitle_emergency', 'Emergency contact numbers shown on the Laporan Warga page')} badge={contacts.length}>
      <SuccessBanner show={success} />
      <div className="p-4 sm:p-6 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('homepage.hint_emergency', 'These contacts appear in the red "Kontak Darurat" card on the resident report form page. Keep these up to date.')}
        </p>

        {contacts.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="material-icons text-4xl text-slate-300 dark:text-slate-600 mb-2 block">emergency</span>
            <p className="text-sm text-slate-500">{t('homepage.empty_emergency', 'No contacts yet. Click "Add Contact" to get started.')}</p>
          </div>
        )}

        <div className="space-y-3">
          {contacts.map((contact, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              {/* On mobile these controls share one row above the inputs; `sm:contents`
                  dissolves the wrapper on desktop so they sit inline as before. */}
              <div className="flex items-center gap-3 sm:contents">
                {/* Move buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0 || !canEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <span className="material-icons text-sm text-slate-500">arrow_upward</span>
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === contacts.length - 1 || !canEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <span className="material-icons text-sm text-slate-500">arrow_downward</span>
                  </button>
                </div>

                {/* Icon selector */}
                <div className="flex-1 min-w-0 sm:flex-none sm:shrink-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('homepage.label_icon', 'Icon')}</label>
                  <select value={contact.icon || 'phone'} disabled={!canEdit}
                    onChange={e => updateContact(idx, 'icon', e.target.value)}
                    className="w-full sm:w-auto text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60">
                    {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Preview icon */}
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <span className="material-icons text-red-500 text-[18px]">{contact.icon || 'phone'}</span>
                </div>

                {/* Delete — trails the controls row on mobile, far right on desktop */}
                {canEdit && (
                  <button onClick={() => setDeleteModal({ open: true, index: idx, label: contact.label })}
                    className="shrink-0 ml-auto sm:ml-0 sm:order-last w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                )}
              </div>

              {/* Label & Phone */}
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('homepage.label_contact_name', 'Nama / Label')}</label>
                  <input value={contact.label} disabled={!canEdit} onChange={e => updateContact(idx, 'label', e.target.value)}
                    placeholder="e.g. Pos Keamanan"
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('homepage.label_phone', 'Nomor Telepon')}</label>
                  <input value={contact.phone} disabled={!canEdit} onChange={e => updateContact(idx, 'phone', e.target.value)}
                    placeholder="e.g. +62 123 4567 890"
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <button onClick={addContact}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors w-full justify-center text-sm font-semibold cursor-pointer">
            <span className="material-icons text-[18px]">add</span>
            {t('homepage.btn_add_contact', 'Add Contact')}
          </button>
        )}
      </div>

      {canEdit && <SaveButton onClick={save} loading={saving} label={t('homepage.btn_save_emergency', 'Save Contacts')} />}

      <ConfirmModal 
        open={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, index: -1, label: '' })}
        onConfirm={() => {
          removeContact(deleteModal.index);
          setDeleteModal({ open: false, index: -1, label: '' });
        }}
        icon="delete_outline"
        title={t('homepage.label_delete_contact', 'Delete Contact?')} 
        message={<>{t('homepage.text_are_you_sure_you_want_to_delete', 'Are you sure you want to delete')} <strong>{deleteModal.label || t('homepage.text_this_contact', 'this contact')}</strong>? {t('homepage.msg_cannot_be_undone', 'This cannot be undone.')}</>} 
        confirmLabel={t('homepage.text_yes_delete', 'Yes, Delete')} 
      />
    </SectionCard>
  );
}

const VISIT_ICON_OPTIONS = [
  { value: 'person_check', label: 'Person Check' },
  { value: 'pool', label: 'Pool' },
  { value: 'handshake', label: 'Handshake' },
  { value: 'home', label: 'Home' },
  { value: 'star', label: 'Star' },
  { value: 'calendar_month', label: 'Calendar' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'groups', label: 'Groups' },
  { value: 'park', label: 'Park' },
  { value: 'verified', label: 'Verified' },
];

function VisitTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, index: -1, title: '' });

  useEffect(() => {
    axios.get('/api/homepage/visit-settings')
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => setItems(prev => [...prev, { icon: 'star', title: '', description: '' }]);

  const updateItem = (idx: number, key: string, value: string) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: value } : it));

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setItems(prev => { const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; });
  };

  const moveDown = (idx: number) => {
    setItems(prev => { if (idx === prev.length - 1) return prev; const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next; });
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/homepage/visit-settings', items);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>;

  return (
    <SectionCard icon="calendar_month" iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" title={t('homepage.title_visit', 'Jadwalkan Kunjungan — Sidebar')} subtitle={t('homepage.subtitle_visit', 'Selling points shown in the green sidebar on the Schedule Visit page')} badge={items.length}>
      <SuccessBanner show={success} />
      <div className="p-4 sm:p-6 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('homepage.hint_visit', 'These items appear in the "Mengapa Harus Berkunjung?" card on the visit scheduling page.')}
        </p>

        {items.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="material-icons text-4xl text-slate-300 dark:text-slate-600 mb-2 block">calendar_month</span>
            <p className="text-sm text-slate-500">{t('homepage.empty_visit', 'No items yet. Click "Add Item" to get started.')}</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3 sm:contents">
                {/* Move buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0 || !canEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <span className="material-icons text-sm text-slate-500">arrow_upward</span>
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1 || !canEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <span className="material-icons text-sm text-slate-500">arrow_downward</span>
                  </button>
                </div>

                {/* Icon selector */}
                <div className="flex-1 min-w-0 sm:flex-none sm:shrink-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('homepage.label_icon', 'Icon')}</label>
                  <select value={item.icon || 'star'} disabled={!canEdit}
                    onChange={e => updateItem(idx, 'icon', e.target.value)}
                    className="w-full sm:w-auto text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60">
                    {VISIT_ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Preview icon */}
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">{item.icon || 'star'}</span>
                </div>

                {/* Delete */}
                {canEdit && (
                  <button onClick={() => setDeleteModal({ open: true, index: idx, title: item.title })}
                    className="shrink-0 ml-auto sm:ml-0 sm:order-last w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('homepage.label_title', 'Judul')}</label>
                  <input value={item.title} disabled={!canEdit} onChange={e => updateItem(idx, 'title', e.target.value)}
                    placeholder="e.g. Tur Dipandu oleh Ahli"
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('homepage.label_description', 'Deskripsi')}</label>
                  <textarea value={item.description} disabled={!canEdit} onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="e.g. Spesialis properti kami akan memandu..."
                    rows={2}
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none resize-none disabled:opacity-60" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <button onClick={addItem}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors w-full justify-center text-sm font-semibold cursor-pointer">
            <span className="material-icons text-[18px]">add</span>
            {t('homepage.btn_add_item', 'Add Item')}
          </button>
        )}
      </div>

      {canEdit && <SaveButton onClick={save} loading={saving} label={t('homepage.btn_save_visit', 'Save Settings')} />}

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, index: -1, title: '' })}
        onConfirm={() => { removeItem(deleteModal.index); setDeleteModal({ open: false, index: -1, title: '' }); }}
        icon="delete_outline"
        title={t('homepage.label_delete_item', 'Delete Item?')}
        message={<>{t('homepage.text_are_you_sure_you_want_to_delete', 'Are you sure you want to delete')} <strong>{deleteModal.title || t('homepage.text_this_item', 'this item')}</strong>? {t('homepage.msg_cannot_be_undone', 'This cannot be undone.')}</>}
        confirmLabel={t('homepage.text_yes_delete', 'Yes, Delete')}
      />
    </SectionCard>
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
      case 'news':
      case 'events': return <NewsTab canEdit={canEdit} />;
      case 'gallery': return <GalleryTab canEdit={canEdit} />;
      case 'bulletin': return <BulletinTab canEdit={canEdit} />;
      case 'properties': return <PropertyTab canEdit={canEdit} />;
      case 'navigation': return <NavigationTab />;
      case 'footer': return <FooterTab canEdit={canEdit} />;
      case 'emergency': return <EmergencyTab canEdit={canEdit} />;
      case 'visit': return <VisitTab canEdit={canEdit} />;
      case 'metadata': return <MetadataTab canEdit={canEdit} />;
      default: return null;
    }
  };

  const tabLabel = TABS.find(function(tb) { return tb.key === activeTab; });
  const tabTitle = t("homepage.tab_" + activeTab, { defaultValue: tabLabel ? tabLabel.label : 'Homepage CMS' });

  return (
    <AdminLayout title={tabTitle}>
      <div className="w-full lg:w-[80%] mx-auto pb-12">
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
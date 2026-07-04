// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, SearchInput, SelectFilter, EmptyState, Pagination, Modal, ConfirmModal, FormInput, FormSelect, SearchableSelect, SecureImage } from '../../admin/components/ui';
import { compressImage } from '../../utils/imageCompressor';
import { useTranslation, Trans } from 'react-i18next';
import { usePermissions } from '../../admin/PermissionsContext';

interface Meeting {
  id: number;
  title: string;
  description?: string;
  meeting_date: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  attendees?: { id: string; name: string; type: string; photoPath?: string }[];
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  total: number;
}

function MeetingModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Meeting | null }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ title: '', meeting_date: '', location: '', status: 'scheduled' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const STATUS_OPTIONS = [
    { value: 'scheduled', label: t('meetings.status_scheduled') },
    { value: 'completed', label: t('meetings.status_completed') },
    { value: 'cancelled', label: t('meetings.status_cancelled') },
  ];

  useEffect(() => {
    if (data) {
      setForm({ title: data.title, meeting_date: data.meeting_date?.slice(0, 16) || '', location: data.location || '', status: data.status });
    } else {
      setForm({ title: '', meeting_date: '', location: '', status: 'scheduled' });
    }
    setErrors({});
  }, [data, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/meetings/${data!.id}`, { ...data, ...form });
      else await axios.post('/api/meetings', form);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('meetings.edit_meeting') : t('meetings.add_meeting')} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label={t('meetings.modal_title')} id="m-title" value={form.title} onChange={set('title')} error={errors.title} required placeholder={t('meetings.modal_title_placeholder')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="m-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('meetings.modal_date')} <span className="text-rose-500">*</span></label>
            <input id="m-date" type="datetime-local" value={form.meeting_date} onChange={set('meeting_date')}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white dark:[color-scheme:dark] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" />
            {errors.meeting_date && <p className="mt-1.5 text-xs text-rose-600">{errors.meeting_date}</p>}
          </div>
          <FormSelect label={t('meetings.modal_status')} id="m-status" value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />
        </div>
        <FormInput label={t('meetings.modal_location')} id="m-location" value={form.location} onChange={set('location')} error={errors.location} placeholder={t('meetings.modal_location_placeholder')} />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('meetings.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('meetings.saving') : isEdit ? t('meetings.btn_save_changes') : t('meetings.add_meeting')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MeetingDescriptionModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: Meeting | null }) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setDescription(data.description || '');
  }, [data, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch(`/api/meetings/${data!.id}/description`, { description });
      onSaved(); onClose();
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('meetings.desc_modal_title')} size="md">
      <div className="space-y-4">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} placeholder={t('meetings.desc_modal_placeholder')}
          className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('meetings.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('meetings.saving') : t('meetings.btn_save_description')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MeetingImageModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: Meeting | null }) {
  const { t } = useTranslation();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!data) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/meetings/${data.id}/images`);
      setImages(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [data]);

  useEffect(() => {
    if (open) fetchImages();
  }, [open, fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    
    setUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      await axios.post(`/api/meetings/${data.id}/images`, formData);
      fetchImages();
    } catch (err) { console.error(err); } finally { setUploading(false); }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await axios.delete(`/api/meetings/images/${imageId}`);
      fetchImages();
    } catch (err) { console.error(err); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('meetings.img_modal_title')} size="lg">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('meetings.img_modal_info')}</p>
          <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-bold transition-all cursor-pointer">
            <span className="material-icons text-sm">upload</span> {uploading ? t('meetings.uploading') : t('meetings.btn_upload_image')}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8"><span className="material-icons text-primary animate-spin">autorenew</span></div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">{t('meetings.no_images')}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
                <SecureImage src={`/api/media/path/${img.imagePath}`} alt="Meeting" className="w-full h-full object-cover" />
                <button onClick={() => setDeleteConfirm(img.id)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <span className="material-icons text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal open={!!deleteConfirm} title={t('meetings.delete_image_title')} message={t('meetings.delete_image_message')} onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }} onCancel={() => setDeleteConfirm(null)} confirmLabel={t('meetings.btn_delete_confirm')} />
    </Modal>
  );
}

function MeetingAttendanceModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: Meeting | null }) {
  const { t } = useTranslation();
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!data) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/meetings/${data.id}/attendance`);
      setAttendees(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [data]);

  useEffect(() => {
    if (open) fetchAttendance();
  }, [open, fetchAttendance]);

  const togglePresence = (id: string) => {
    setAttendees(prev => prev.map(a => a.id === id ? { ...a, isPresent: !a.isPresent } : a));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/meetings/${data!.id}/attendance`, { records: attendees });
      onClose();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('meetings.att_modal_title')} size="md">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><span className="material-icons text-primary animate-spin">autorenew</span></div>
        ) : (
          <>
            <div className="mb-4">
              <SearchableSelect 
                placeholder={t('meetings.att_search_placeholder')}
                value=""
                onChange={(id) => {
                  if (id) togglePresence(id);
                }}
                options={attendees.filter(a => !a.isPresent).map(a => ({ value: a.id, label: `${a.name} (${a.type.toUpperCase()})` }))}
              />
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2">
              {attendees.filter(a => a.isPresent).length === 0 ? (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm italic">
                  {t('meetings.att_no_attendees')}
                </div>
              ) : (
                attendees.filter(a => a.isPresent).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/50 bg-primary/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{a.name}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${a.type === 'householder' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {a.type}
                        </span>
                      </div>
                      {a.email && <p className="text-xs text-slate-500 mt-0.5">{a.email}</p>}
                    </div>
                    <button onClick={() => togglePresence(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer">
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('meetings.btn_cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {saving ? t('meetings.saving') : t('meetings.btn_save_attendance')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Meetings() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [data, setData] = useState<Meeting[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', month: '', year: '', page: 1 });
  const [modal, setModal] = useState<{ open: boolean; data: Meeting | null }>({ open: false, data: null });
  const [descModal, setDescModal] = useState<{ open: boolean; data: Meeting | null }>({ open: false, data: null });
  const [imgModal, setImgModal] = useState<{ open: boolean; data: Meeting | null }>({ open: false, data: null });
  const [attModal, setAttModal] = useState<{ open: boolean; data: Meeting | null }>({ open: false, data: null });
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
    <AdminLayout title={t('meetings.title')}>
      <MeetingModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} />
      <MeetingDescriptionModal open={descModal.open} onClose={() => setDescModal({ open: false, data: null })} onSaved={fetchData} data={descModal.data} />
      <MeetingImageModal open={imgModal.open} onClose={() => setImgModal({ open: false, data: null })} data={imgModal.data} />
      <MeetingAttendanceModal open={attModal.open} onClose={() => setAttModal({ open: false, data: null })} data={attModal.data} />
      
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="event_busy"
        title={t('meetings.delete_title')} message={<Trans i18nKey="meetings.delete_message" values={{ topic: confirm.item?.title || '' }} components={{ strong: <strong /> }} />}
        confirmLabel={t('meetings.btn_delete_confirm')} />

      <PageHeader
        title={t('meetings.title')} subtitle={t('meetings.subtitle')}
        actions={
          can('meetings.create') && (
            <button onClick={() => setModal({ open: true, data: null })}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="material-icons text-sm">add</span> {t('meetings.add_meeting')}
            </button>
          )
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder={t('meetings.search_placeholder')} />
        <SelectFilter 
          value={filters.month || ''} 
          onChange={(v) => setFilter('month', v)} 
          options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({ value: String(i+1), label: m }))} 
          placeholder={t('meetings.all_months')} 
        />
        <SelectFilter 
          value={filters.year || ''} 
          onChange={(v) => setFilter('year', v)} 
          options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
          placeholder={t('meetings.all_years')} 
        />
        <button onClick={() => setFilters({ search: '', month: '', year: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> {t('meetings.clear')}
        </button>
      </div>

      <div className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {t('meetings.showing', { count: data.length, total: meta?.total || data.length })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : data.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1F36] border border-slate-200 dark:border-white/5 rounded-xl p-12 shadow-sm text-center">
          <EmptyState icon="event_note" title={t('meetings.no_meetings_title')} subtitle={t('meetings.no_meetings_subtitle')} />
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(m => {
            const d = m.meeting_date ? new Date(m.meeting_date) : new Date();
            const monthStr = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const dateNum = d.getDate();
            const timeStr = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const fullDateStr = d.toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
             
            return (
              <div key={m.id} className="bg-white dark:bg-[#1A1F36] border border-slate-200 dark:border-white/5 rounded-xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-all shadow-sm group">
                <div className="flex items-center gap-5">
                  <div className="bg-primary text-white dark:text-[#0D1A17] flex flex-col items-center justify-center rounded-lg w-14 h-14 shrink-0 shadow-md">
                    <span className="text-[10px] font-bold tracking-wider leading-none mt-1">{monthStr}</span>
                    <span className="text-xl font-extrabold leading-tight mt-0.5">{dateNum}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{m.title}</h3>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><span className="material-icons text-[15px] opacity-70">schedule</span> {timeStr}</span>
                      <span className="flex items-center gap-1.5"><span className="material-icons text-[15px] opacity-70">event</span> {fullDateStr}</span>
                      {m.location && <span className="flex items-center gap-1.5"><span className="material-icons text-[15px] opacity-70">location_on</span> {m.location}</span>}
                    </div>
                    {m.attendees && m.attendees.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {m.attendees.map(a => (
                          <div key={a.id} className="flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm" title={`${a.name} (${a.type})`}>
                            {a.photoPath ? (
                               <SecureImage src={`/api/media/path/${a.photoPath}`} alt={a.name} className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                            ) : (
                               <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                                 {a.name.charAt(0).toUpperCase()}
                               </div>
                            )}
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{a.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                  {can('meetings.edit') && (
                    <>
                      <button onClick={() => setImgModal({ open: true, data: m })} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer" title="Images">
                        <span className="material-icons text-[20px]">image</span>
                      </button>
                      <button onClick={() => setDescModal({ open: true, data: m })} className="p-2 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" title="Description">
                        <span className="material-icons text-[18px]">description</span>
                      </button>
                      <button onClick={() => setAttModal({ open: true, data: m })} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer" title="Attendance">
                        <span className="material-icons text-[18px]">how_to_reg</span>
                      </button>
                      <button onClick={() => setModal({ open: true, data: m })} className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit">
                        <span className="material-icons text-[18px]">edit</span>
                      </button>
                    </>
                  )}
                  {can('meetings.delete') && (
                    <button onClick={() => setConfirm({ open: true, item: m, loading: false })} className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title="Delete">
                      <span className="material-icons text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {meta && meta.last_page > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

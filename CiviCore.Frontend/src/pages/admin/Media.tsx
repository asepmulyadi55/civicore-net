// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, EmptyState, Modal, FormInput } from '../../admin/components/ui';

interface MediaFile {
  id: number;
  name: string;
  url: string;
  mime_type: string;
  size: number;
  created_at: string;
}

function MediaCard({ file, onDelete }: { file: MediaFile; onDelete: (f: MediaFile) => void }) {
  const { t } = useTranslation();
  const isImage = file.mime_type?.startsWith('image/');
  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const sizeLabel = file.size > 1024 * 1024
    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(file.size / 1024)} KB`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md hover:border-primary/20 transition-all">
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <span className="material-icons text-4xl">insert_drive_file</span>
            <span className="text-xs font-bold">{ext}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sizeLabel}</p>
        <div className="flex items-center justify-between mt-3">
          <a href={file.url} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span className="material-icons text-sm">open_in_new</span> {t('media.view')}
          </a>
          <button onClick={() => onDelete(file)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
            <span className="material-icons text-lg">delete_outline</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Media() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaFile | null>(null);
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/media', { params: { search } });
      setFiles(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setFiles([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append('files[]', f));
      await axios.post('/api/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData();
    } catch {} finally { setUploading(false); e.target.value = ''; }
  };

  const doDelete = async () => {
    if (!deleteConfirm) return;
    try { await axios.delete(`/api/media/${deleteConfirm.id}`); fetchData(); setDeleteConfirm(null); }
    catch {}
  };

  return (
    <AdminLayout title={t('media.title')}>
      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <span className="material-icons text-rose-600 text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('media.delete_title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1"><Trans i18nKey="media.delete_message" values={{ name: deleteConfirm.name }}>Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</Trans></p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">{t('media.btn_cancel')}</button>
                <button onClick={doDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all">{t('media.btn_delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={t('media.title')}
        subtitle={t('media.subtitle')}
        actions={
          <label className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all cursor-pointer">
            <span className="material-icons text-sm">{uploading ? 'hourglass_top' : 'upload'}</span>
            {uploading ? t('media.uploading') : t('media.upload_files')}
            <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        }
      />

      <div className="mb-6">
        <div className="relative w-full sm:max-w-sm">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('media.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : files.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="perm_media" title={t('media.empty_title')} subtitle={t('media.empty_subtitle')} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map((f) => (
            <MediaCard key={f.id} file={f} onDelete={setDeleteConfirm} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

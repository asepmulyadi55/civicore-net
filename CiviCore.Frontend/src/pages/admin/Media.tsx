// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, EmptyState } from '../../admin/components/ui';
import { usePermissions } from '../../admin/PermissionsContext';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  mime_type: string;
  size: number;
  created_at: string;
}

// Mirror Laravel MediaController::FOLDERS — folder key derived from FilePath prefix
const FOLDERS = [
  { key: '__all__', label: 'All Files', icon: 'perm_media', prefix: '', readonly: false },
  { key: 'users', label: 'Users', icon: 'person', prefix: 'avatars/', readonly: false },
  { key: 'payments', label: 'Payments', icon: 'receipt_long', prefix: 'proofs/', readonly: false },
  { key: 'homepage', label: 'Homepage', icon: 'home', prefix: 'homepage/', readonly: false },
  { key: 'householders', label: 'Householders', icon: 'people', prefix: 'householders/', readonly: true },
  { key: 'residents', label: 'Residents', icon: 'family_restroom', prefix: 'residents/', readonly: true },
  { key: 'meetings', label: 'Meetings', icon: 'event_note', prefix: 'meetings/', readonly: true },
  { key: 'uploads', label: 'Uploads', icon: 'upload_file', prefix: 'uploads/', readonly: false },
];

function getFolderKey(file) {
  // Prefer the raw file_path returned by the API (added in latest .NET controller)
  // Fallback: strip the API prefix from the url
  const rawPath = file.file_path
    ?? file.url.replace('/api/media/path/', '').replace('/public-media/', '');
  for (const f of FOLDERS) {
    if (f.prefix && rawPath.startsWith(f.prefix)) return f.key;
  }
  return 'uploads';
}

function isPublicUrl(url) {
  return url.startsWith('/public-media/') || url.startsWith('http');
}

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// Renders a media image.
// - Public files (/public-media/) → plain <img>, no auth needed.
// - Private files (/api/media/path/) → axios blob fetch with Bearer token.
// - On 404/error → calls onError() so parent can show a delete button.
function MediaImage({ src, alt, className, onError }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    setError(false);
    let mounted = true;
    let blobUrl = '';

    if (isPublicUrl(src)) {
      setObjectUrl(src);
      return;
    }

    const token = localStorage.getItem('admin_token');
    axios.get(src, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (mounted) {
          blobUrl = URL.createObjectURL(res.data);
          setObjectUrl(blobUrl);
        }
      })
      .catch(() => {
        if (mounted) { setError(true); onError?.(); }
      });

    return () => {
      mounted = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (error)
    return (
      <div className={`flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/30 gap-1 ${className}`}>
        <span className="material-icons text-rose-300 dark:text-rose-700 text-3xl">broken_image</span>
        <span className="text-[10px] text-rose-400 font-semibold">Not found</span>
      </div>
    );

  if (!objectUrl)
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`}>
        <span className="material-icons text-slate-300 dark:text-slate-600">image</span>
      </div>
    );

  return <img src={objectUrl} alt={alt} className={className} />;
}

function MediaCard({ file, onDelete, canDelete, folderReadonly }) {
  const { t } = useTranslation();
  const [isBroken, setIsBroken] = useState(false);
  const isImage = file.mime_type?.startsWith('image/');
  const isPublic = isPublicUrl(file.url);
  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

  // Broken cards always get a delete button — they're ghost records that need cleanup
  const showDelete = canDelete && (isBroken || !folderReadonly);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${isBroken
      ? 'border-rose-300 dark:border-rose-800 hover:border-rose-400'
      : 'border-slate-200 dark:border-slate-800 hover:border-primary/20'
      }`}>
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
        {isImage ? (
          <MediaImage
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setIsBroken(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <span className="material-icons text-4xl">insert_drive_file</span>
            <span className="text-xs font-bold">{ext}</span>
          </div>
        )}

        {/* Lock badge for private files */}
        {!isPublic && !isBroken && (
          <span
            title="Private file — served via authenticated proxy"
            className="absolute top-1.5 right-1.5 material-icons text-sm text-white bg-slate-700/70 rounded p-0.5"
          >lock</span>
        )}

        {/* Broken: prominent delete overlay in the thumbnail */}
        {isBroken && canDelete && (
          <button
            onClick={() => onDelete(file)}
            title="File missing on disk — click to delete this record"
            className="absolute inset-0 flex flex-col items-center justify-center bg-rose-900/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
          >
            <span className="material-icons text-white text-3xl group-hover:scale-110 transition-transform">delete_forever</span>
            <span className="text-white text-[11px] font-bold mt-1">Delete record</span>
          </button>
        )}
      </div>

      <div className="p-3">
        <p className={`text-sm font-semibold truncate ${isBroken ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`} title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{isBroken ? <span className="text-rose-400 font-semibold">Missing file</span> : formatSize(file.size)}</p>

        <div className="flex items-center justify-between mt-3">
          {!isBroken && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <span className="material-icons text-sm">open_in_new</span>
              <span className="hover:underline">{t('media.view')}</span>
            </a>
          )}

          {isBroken && <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Ghost record</span>}

          {showDelete && (
            <button
              onClick={() => onDelete(file)}
              className={`p-1 rounded transition-colors cursor-pointer ${isBroken
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                }`}
              title={t('media.btn_delete')}
            >
              <span className="material-icons text-lg">delete_outline</span>
            </button>
          )}

          {!isBroken && folderReadonly && (
            <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {t('media.readonly')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


const PAGE_SIZE = 24;

export default function Media() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canUpload = can('media.create');
  const canDelete = can('media.delete');

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('__all__');
  const [pruning, setPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/media', { params: search ? { search } : {} });
      setFiles(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append('files', f));
      await axios.post('/api/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData();
    } catch { }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const doDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`/api/media/${deleteConfirm.id}`);
      fetchData();
      setDeleteConfirm(null);
    } catch { }
  };

  const pruneOrphans = async () => {
    setPruning(true);
    setPruneResult(null);
    try {
      const res = await axios.post('/api/media/cleanup-orphans');
      setPruneResult({ removed: res.data.removed });
      fetchData();
    } catch {
      setPruneResult({ error: true });
    } finally {
      setPruning(false);
    }
  };

  // Build per-folder counts
  const folderCounts = FOLDERS.reduce((acc, f) => {
    if (f.key === '__all__') { acc[f.key] = files.length; return acc; }
    acc[f.key] = files.filter(file => getFolderKey(file) === f.key).length;
    return acc;
  }, {});

  // Only render folder tabs that actually have content
  const visibleFolders = FOLDERS.filter(f => f.key === '__all__' || folderCounts[f.key] > 0);

  const currentFolderMeta = FOLDERS.find(f => f.key === activeFolder) ?? FOLDERS[0];

  const filteredFiles = activeFolder === '__all__'
    ? files
    : files.filter(f => getFolderKey(f) === activeFolder);

  const searchFiltered = search
    ? filteredFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : filteredFiles;

  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const displayFiles = searchFiltered.slice(pageStart, pageStart + PAGE_SIZE);

  // Reset to page 1 when folder or search changes
  const handleFolderChange = (key) => { setActiveFolder(key); setPage(1); };
  const handleSearchChange = (val) => { setSearch(val); setPage(1); };

  return (
    <AdminLayout title={t('media.title')}>
      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <span className="material-icons text-rose-600 text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('media.delete_title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <Trans i18nKey="media.delete_message" values={{ name: deleteConfirm.name }}>
                    Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
                  </Trans>
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {t('media.btn_cancel')}
                </button>
                <button
                  onClick={doDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  {t('media.btn_delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <PageHeader
        title={t('media.title')}
        subtitle={t('media.subtitle')}
        actions={
          canUpload ? (
            <>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <span className="material-icons text-sm">{uploading ? 'hourglass_top' : 'upload'}</span>
                {uploading ? t('media.uploading') : t('media.upload_files')}
              </button>
            </>
          ) : null
        }
      />

      {/* Prune result toast */}
      {pruneResult && (
        <div className={`mb-5 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${pruneResult.error
          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
          }`}>
          <span className="material-icons text-sm">{pruneResult.error ? 'error' : 'check_circle'}</span>
          <span className="flex-1">
            {pruneResult.error
              ? t('media.prune_error')
              : t('media.prune_success', { count: pruneResult.removed ?? 0 })}
          </span>
          <button onClick={() => setPruneResult(null)} className="material-icons text-sm opacity-60 hover:opacity-100 cursor-pointer">close</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">search</span>
          <input
            type="text"
            placeholder={t('media.search_placeholder')}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
          />
        </div>
        <button
          onClick={pruneOrphans}
          disabled={pruning}
          title="Remove files and database records that are no longer in use"
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <span className={`material-icons text-sm ${pruning ? 'animate-spin' : ''}`}>
            {pruning ? 'autorenew' : 'cleaning_services'}
          </span>
          <span className="hidden sm:inline">{pruning ? t('media.pruning') : t('media.prune_unused')}</span>
        </button>
      </div>

      {/* Folder tabs (mirrors Laravel's virtual folder sidebar) */}
      {!loading && files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {visibleFolders.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFolderChange(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${activeFolder === f.key
                ? 'bg-primary border-primary text-white dark:text-surface shadow-lg shadow-primary/20 hover:opacity-90 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40 hover:text-primary dark:hover:text-primary'
                }`}
            >
              <span className="material-icons text-[14px]">{f.icon}</span>
              {f.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === f.key ? 'bg-black/10 dark:bg-black/20 text-white dark:text-surface' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                {folderCounts[f.key] ?? 0}
              </span>
              {f.readonly && <span className="material-icons text-[11px] opacity-60">lock</span>}
            </button>
          ))}
        </div>
      )}

      {/* Readonly notice for virtual folders */}
      {currentFolderMeta.readonly && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          <span className="material-icons text-sm flex-shrink-0 mt-0.5">info</span>
          <span>{t('media.readonly_notice', { folder: currentFolderMeta.label })}</span>
        </div>
      )}

      {/* File grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      ) : searchFiltered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="perm_media" title={t('media.empty_title')} subtitle={t('media.empty_subtitle')} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayFiles.map((f) => (
              <MediaCard
                key={f.id}
                file={f}
                onDelete={setDeleteConfirm}
                canDelete={canDelete}
                folderReadonly={currentFolderMeta.readonly}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('media.pagination_info', {
                  from: pageStart + 1,
                  to: Math.min(pageStart + PAGE_SIZE, searchFiltered.length),
                  total: searchFiltered.length,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`dot-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${safePage === p
                          ? 'bg-primary border-primary text-white dark:text-surface shadow-sm shadow-primary/20 cursor-default'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:border-primary/30 hover:text-primary'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Pagination, Modal, ConfirmModal,
  Avatar, PageHeader, FilterBar, SearchInput, SelectFilter,
  BulkActionBar, TableWrapper, Th, FormInput, FormSelect, SecureImage,
  SearchableSelect, CustomSelect
} from '../../admin/components/ui';
import { usePermissions } from '../../admin/PermissionsContext';
import { formatApiErrors } from '../../utils/formatErrors';

const HOUSE_STATUS_OPTIONS = [
  { value: 'owner_occupied', label: 'Owner Occupied' },
  { value: 'rented', label: 'Rented' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'public_facility', label: 'Public Facility' },
  { value: 'developer', label: 'Developer' },
];

function HouseholderModal({ open, onClose, onSaved, data, blocks }) {
  const { t } = useTranslation();
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
    const errs: Record<string, string> = {};
    if (!form.fullname.trim()) errs.fullname = t('householders.error_fullname_required', 'Full name is required.');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/householders/${data.id}`, form);
      else await axios.post('/api/householders', form);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrors(formatApiErrors(err));
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('householders.modal_edit_title') : t('householders.modal_add_title')} size="lg">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t('householders.full_name')} id="h-fullname" value={form.fullname} onChange={set('fullname')} error={errors.fullname} required />
          <SearchableSelect label={t('householders.block')} value={form.blockId} onChange={v => setForm(p => ({ ...p, blockId: v, unitId: '' }))} error={errors.blockId}
            options={(blocks || []).map(b => ({ value: String(b.id), label: b.name }))} placeholder={t('householders.search_block')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect label={t('householders.unit_number')} value={form.unitId} onChange={v => setForm(p => ({ ...p, unitId: v }))} error={errors.unitId}
            options={(blocks.find(b => String(b.id) === String(form.blockId))?.units || []).filter(u => !u.isAssigned || String(u.id) === String(data?.unitId)).map(u => ({ value: String(u.id), label: String(u.unitNumber) }))} placeholder={t('householders.search_unit')} />
          <CustomSelect label={t('householders.house_status_override')} value={String(form.houseStatus)} onChange={v => setForm(p => ({ ...p, houseStatus: Number(v) }))} error={errors.houseStatus}
            options={[
              { value: '0', label: t('householders.owner_occupied') },
              { value: '1', label: t('householders.rented') },
              { value: '2', label: t('householders.vacant') },
              { value: '3', label: t('householders.public_facility') },
              { value: '4', label: t('householders.developer') }
            ]} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={t('householders.phone')} id="h-phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <FormInput label={t('householders.email')} id="h-email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input type="checkbox" id="h-active" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="h-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('householders.active_householder')}</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('householders.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('householders.saving') : isEdit ? t('householders.btn_save') : t('householders.btn_add')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Householders() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [data, setData] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', block_id: '', status: '', page: 1 });
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null, loading: false });

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [importing, setImporting] = useState(false);
  const [importJob, setImportJob] = useState(null);
  const [importResult, setImportResult] = useState({ open: false, success: true, message: '' });
  const fileInputRef = React.useRef(null);

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

  useEffect(() => {
    let interval: any;
    if (importJob && (importJob.status === 'Pending' || importJob.status === 'Processing')) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/householders/import-status/${importJob.jobId}`);
          setImportJob(res.data);
          if (res.data.status === 'Completed') {
            setImporting(false);
            setImportResult({ open: true, success: true, message: res.data.message || 'Import completed!' });
            fetchData();
          } else if (res.data.status === 'Failed') {
            setImporting(false);
            setImportResult({ open: true, success: false, message: res.data.message || 'Import failed.' });
          }
        } catch (err) { }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [importJob, fetchData]);

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

  const handleImportSubmit = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert("Please select a file.");
      return;
    }
    setImportModalOpen(false);
    setImporting(true);
    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('year', importYear.toString());

    try {
      const res = await axios.post('/api/householders/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.status === 202 && res.data.jobId) {
        setImportJob({ jobId: res.data.jobId, status: 'Pending', totalRows: 0, processedRows: 0, message: '' });
      } else {
        setImportResult({ open: true, success: true, message: res.data.message || 'Import successful!' });
        setImporting(false);
        fetchData();
      }
    } catch (err: any) {
      setImporting(false);
      setImportResult({ open: true, success: false, message: err.response?.data?.message || 'Failed to start import.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const blockOptions = blocks.map(b => ({ value: String(b.id), label: b.name }));

  return (
    <AdminLayout title={t('householders.title')}>
      {importing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center w-[400px]">
            <span className="material-icons text-primary text-5xl animate-spin mb-4">autorenew</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('householders.importing_data')}</h3>
            
            {importJob ? (
              <div className="w-full">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>{t('householders.progress')}</span>
                  <span>{importJob.processedRows} / {importJob.totalRows || '?'} rows</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="bg-primary h-3 rounded-full transition-all duration-300" 
                       style={{ width: `${importJob.totalRows ? Math.min(100, (importJob.processedRows / importJob.totalRows) * 100) : 0}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 text-center">{importJob.status}...</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('householders.uploading_file')}</p>
            )}
            
            <button onClick={() => setImporting(false)} className="mt-6 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer">{t('householders.run_in_background')}</button>
          </div>
        </div>
      )}

      {!importing && importJob && (importJob.status === 'Pending' || importJob.status === 'Processing') && (
        <div 
          className="fixed bottom-6 right-6 z-[90] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-primary/10 rounded-2xl p-4 w-80 cursor-pointer transition-all hover:-translate-y-1" 
           tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setImporting(true)}
          title="Click to view details"
        >
          <div className="flex items-center gap-3 mb-3">
             <span className="material-icons text-primary animate-spin text-xl">autorenew</span>
             <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('householders.importing_householders')}</h4>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1.5 overflow-hidden">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${importJob.totalRows ? Math.min(100, (importJob.processedRows / importJob.totalRows) * 100) : 0}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>{Math.round(importJob.totalRows ? (importJob.processedRows / importJob.totalRows) * 100 : 0)}%</span>
            <span>{importJob.processedRows} / {importJob.totalRows || '?'} rows</span>
          </div>
        </div>
      )}
      
      <Modal open={importResult.open} onClose={() => setImportResult(prev => ({ ...prev, open: false }))} title={importResult.success ? t('householders.import_successful') : t('householders.import_failed')} size="sm">
        <div className="flex flex-col items-center pt-2 pb-4 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${importResult.success ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
            <span className="material-icons text-3xl">{importResult.success ? 'check_circle' : 'error'}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{importResult.message}</p>
          <button onClick={() => setImportResult(prev => ({ ...prev, open: false }))} className="mt-6 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold w-full transition-all cursor-pointer">{t('householders.btn_close')}</button>
        </div>
      </Modal>

      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)} title={t('householders.import_title')} size="md">
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('householders.effective_year')}</label>
            <FormInput type="number" value={importYear} onChange={e => setImportYear(parseInt(e.target.value) || 2026)} placeholder="2026" min={2020} max={2035} />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('householders.effective_year_hint')}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('householders.excel_file')}</label>
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white dark:file:text-surface hover:file:opacity-90 file:shadow-lg file:shadow-primary/20 file:transition-all file:cursor-pointer cursor-pointer" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('householders.excel_file_hint')}</p>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setImportModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-all cursor-pointer">{t('householders.btn_cancel')}</button>
            <button onClick={handleImportSubmit} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md hover:opacity-90 transition-all cursor-pointer">{t('householders.btn_import')}</button>
          </div>
        </div>
      </Modal>

      <HouseholderModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} blocks={blocks} />
      <ConfirmModal
        open={confirm.open} onClose={closeConfirm} onConfirm={doConfirm} loading={confirm.loading}
        icon={confirm.type === 'delete' || confirm.type === 'bulk' ? 'delete_forever' : 'person_off'}
        title={confirm.type === 'delete' ? t('householders.delete_title') : confirm.type === 'bulk' ? t('householders.delete_bulk_title') : t('householders.deactivate_title')}
        message={confirm.type === 'bulk' ? <Trans i18nKey="householders.delete_bulk_message" values={{ count: selected.length }}>Delete <strong>{selected.length}</strong> selected householders permanently?</Trans> : <Trans i18nKey="householders.delete_message" values={{ name: confirm.item?.fullname }}>Permanently delete <strong>{confirm.item?.fullname}</strong>? This cannot be undone.</Trans>}
        confirmLabel={confirm.type === 'deactivate' ? t('householders.btn_deactivate') : t('householders.btn_delete')}
        confirmClass={confirm.type === 'deactivate' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
      />

      <PageHeader
        title={t('householders.title')}
        subtitle={t('householders.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {can('householders.create') && (
              <>
                <button onClick={() => setImportModalOpen(true)} disabled={importing}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50">
                  <span className="material-icons text-sm">{importing ? 'hourglass_empty' : 'upload_file'}</span> {importing ? t('householders.importing_data') : t('householders.btn_import_excel')}
                </button>
                <button onClick={() => setModal({ open: true, data: null })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
                  <span className="material-icons text-sm">add</span> {t('householders.btn_add_householder')}
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder={t('householders.search_placeholder')} />
        <SelectFilter value={filters.block_id} onChange={v => setFilter('block_id', v)} options={blockOptions} placeholder={t('householders.all_blocks')} />
        <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
          options={[{ value: 'active', label: t('householders.status_active') }, { value: 'inactive', label: t('householders.status_inactive') }]} placeholder={t('householders.all_status')} />
        <button onClick={() => setFilters({ search: '', block_id: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> {t('householders.btn_clear')}
        </button>
      </div>

      {can('householders.delete') && selected.length > 0 && (
        <BulkActionBar
          count={selected.length}
          onClear={() => setSelected([])}
          actions={[{ label: t('householders.btn_delete_selected'), icon: 'delete', onClick: () => setConfirm({ open: true, type: 'bulk', item: null, loading: false }), variant: 'danger' }]}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="w-12 px-6 py-4 text-center">
                {can('householders.delete') && (
                  <input type="checkbox" checked={data.length > 0 && selected.length === data.length} onChange={toggleAll} className="w-4 h-4 rounded bg-transparent border-slate-400 dark:border-slate-600 text-primary focus:ring-primary/30 cursor-pointer" />
                )}
              </th>
              <Th>{t('householders.th_householder')}</Th>
              <Th className="hidden sm:table-cell">{t('householders.th_house_status')}</Th>
              <Th>{t('householders.th_monthly_fee')}</Th>
              <Th>{t('householders.th_status')}</Th>
              <Th className="text-right pr-6">{t('householders.th_actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon="people_outline" title={t('householders.empty_title')} subtitle={t('householders.empty_subtitle')} /></td></tr>
            ) : data.map(h => {
              const initials = h.fullname?.split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
              const blockLabel = h.block && h.unit ? `${h.block.name} - ${h.unit.unitNumber}` : t('householders.unassigned');
              return (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/30 last:border-0">
                  <td className="w-12 px-6 py-4 text-center">
                    {can('householders.delete') && (
                      <input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggleOne(h.id)} className="w-4 h-4 rounded bg-transparent border-slate-400 dark:border-slate-600 text-primary focus:ring-primary/30 cursor-pointer" />
                    )}
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
                      {can('householders.edit') && (
                        <>
                          <Link to={`/admin/householders/${h.id}/edit`} className="text-slate-400 hover:text-primary transition-colors cursor-pointer" title={t('householders.tooltip_edit')}>
                            <span className="material-icons text-[18px]">edit</span>
                          </Link>
                          {h.is_active && (
                            <button onClick={() => openConfirm('deactivate', h)} className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" title={t('householders.tooltip_deactivate')}>
                              <span className="material-icons text-[18px]">visibility_off</span>
                            </button>
                          )}
                        </>
                      )}
                      {can('householders.delete') && (
                        <button onClick={() => openConfirm('delete', h)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title={t('householders.tooltip_delete')}>
                          <span className="material-icons text-[18px]">delete</span>
                        </button>
                      )}
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

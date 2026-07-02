// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Modal, ConfirmModal,
  PageHeader, FilterBar, SearchInput,
  TableWrapper, Th, FormInput, FormSelect, SearchableSelect, CustomSelect,
  BulkActionBar
} from '../../admin/components/ui';

function BlockModal({ open, onClose, onSaved, data, residents, householders }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ name: '', description: '', is_active: true, coordinators: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [personType, setPersonType] = useState('resident');
  const [personId, setPersonId] = useState('');

  useEffect(() => {
    if (data) setForm({ name: data.name || '', description: data.description || '', is_active: data.is_active !== false, coordinators: data.coordinators || [] });
    else setForm({ name: '', description: '', is_active: true, coordinators: [] });
    setErrors({});
    setPersonType('resident');
    setPersonId('');
  }, [data, open]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleAddCoord = () => {
    if (!personId) return;
    const exists = form.coordinators.find(c => c.id === personId);
    if (!exists) {
      const personObj = personType === 'resident' ? residents.find(r => String(r.id) === personId) : householders.find(h => String(h.id) === personId);
      const name = personObj ? (personObj.fullname || personObj.name) : 'Unknown';
      setForm(p => ({ ...p, coordinators: [...p.coordinators, { type: personType, id: personId, name }] }));
    }
    setPersonId('');
  };

  const handleRemoveCoord = (id) => {
    setForm(p => ({ ...p, coordinators: p.coordinators.filter(c => c.id !== id) }));
  };

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/blocks/${data.id}`, form);
      else await axios.post('/api/blocks', form);
      onSaved(); onClose();
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('common.edit') : t('common.add')} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Block Name" id="b-name" value={form.name} onChange={set('name')} error={errors.name} required placeholder="e.g. Block A" />
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Optional description..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none text-sm" />
        </div>
        
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Assign Coordinators</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="w-full sm:w-1/3">
                <CustomSelect value={personType} onChange={v => { setPersonType(v); setPersonId(''); }} options={[
                { value: 'resident', label: 'Resident' },
                { value: 'householder', label: 'Householder' }
                ]} />
            </div>
            <div className="w-full sm:flex-1">
              {personType === 'resident' ? (
                <SearchableSelect value={personId} onChange={setPersonId} options={residents.map(r => ({ value: String(r.id), label: r.fullname }))} placeholder="Search Resident..." />
              ) : (
                <SearchableSelect value={personId} onChange={setPersonId} options={householders.map(h => ({ value: String(h.id), label: h.fullname }))} placeholder="Search Householder..." />
              )}
            </div>
            <button type="button" onClick={handleAddCoord} disabled={!personId} className="w-full sm:w-auto px-4 py-2.5 sm:py-0 bg-primary text-white rounded-lg disabled:opacity-50 cursor-pointer flex items-center justify-center transition-all hover:opacity-90">
                <span className="material-icons">add</span>
                <span className="ml-1 sm:hidden font-bold">Add Coordinator</span>
            </button>
          </div>
          
          {form.coordinators.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.coordinators.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-primary font-bold">{c.type === 'resident' ? 'R' : 'H'}</span>
                  <span className="text-slate-800 dark:text-slate-200">{c.name}</span>
                  <button type="button" onClick={() => handleRemoveCoord(c.id)} className="material-icons text-[14px] text-slate-400 hover:text-rose-500 cursor-pointer ml-1">close</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mt-2">No coordinators assigned.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="b-active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
          <label htmlFor="b-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active block</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Block'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BlockCard({ block, onEdit, onDelete, onManageUnits, isSelected, onToggleSelect }) {
  const stats = [
    { label: 'Units', value: block.units_count ?? 0, cls: 'bg-slate-50 dark:bg-slate-800', valCls: 'text-slate-900 dark:text-white' },
    { label: 'Occupied', value: block.owner_occupied_units_count ?? 0, cls: 'bg-emerald-50 dark:bg-emerald-900/10', valCls: 'text-emerald-500' },
    { label: 'Rented', value: block.rented_units_count ?? 0, cls: 'bg-amber-50 dark:bg-amber-900/10', valCls: 'text-amber-500' },
    { label: 'Vacant', value: block.vacant_units_count ?? 0, cls: 'bg-slate-50 dark:bg-slate-800', valCls: 'text-slate-900 dark:text-white' },
    { label: 'Public', value: block.public_facility_units_count ?? 0, cls: 'bg-teal-50 dark:bg-teal-900/10', valCls: 'text-teal-500' },
    { label: 'Developer', value: block.developer_units_count ?? 0, cls: 'bg-indigo-50 dark:bg-indigo-900/10', valCls: 'text-indigo-500' },
  ];
  return (
    <div className={`relative bg-white dark:bg-slate-900 rounded-xl border ${isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-slate-200 dark:border-slate-800'} shadow-sm p-6 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all`}>
      <div className="absolute top-4 right-4 z-10">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => onToggleSelect(block.id, e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
        />
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-icons text-2xl">apartment</span>
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-bold text-slate-900 dark:text-white truncate">{block.name}</h3>
          {block.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{block.description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className={`${s.cls} rounded-lg p-2 text-center`}>
            <p className={`text-xl font-bold ${s.valCls}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="py-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="material-icons text-sm text-slate-400 flex-shrink-0">manage_accounts</span>
          {(block.coordinators || []).length === 0 ? (
            <span className="text-xs text-slate-400 italic">No coordinator assigned</span>
          ) : block.coordinators.map(c => (
            <div key={c.id} className="flex items-center gap-1 bg-primary/5 rounded-full px-2 py-0.5" title={c.type === 'resident' ? 'Resident' : 'Householder'}>
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                {c.type === 'resident' ? 'R' : 'H'}
              </div>
              <span className="text-[10px] font-medium text-primary truncate max-w-[80px]">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <StatusBadge status={block.is_active ? 'active' : 'inactive'} />
        <div className="flex gap-1">
          <button onClick={() => onManageUnits(block)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Manage Units">
            <span className="material-icons text-sm">home_work</span>
          </button>
          <button onClick={() => onEdit(block)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Edit">
            <span className="material-icons text-sm">edit</span>
          </button>
          <button onClick={() => onDelete(block)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer" title="Delete">
            <span className="material-icons text-sm">delete_outline</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Blocks() {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState([]);
  const [residents, setResidents] = useState([]);
  const [householders, setHouseholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, type: 'delete', item: null, loading: false });
  const [importing, setImporting] = useState(false);
  const [importJob, setImportJob] = useState<any>(null);
  const [importResult, setImportResult] = useState({ open: false, success: true, title: '', message: '' });
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, resRes, hhRes] = await Promise.all([
        axios.get('/api/blocks', { params: { search } }),
        axios.get('/api/residents?per_page=1000').catch(() => ({ data: [] })),
        axios.get('/api/householders?per_page=1000').catch(() => ({ data: [] })),
      ]);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
      setResidents(Array.isArray(resRes.data) ? resRes.data : (resRes.data?.data || []));
      setHouseholders(Array.isArray(hhRes.data) ? hhRes.data : (hhRes.data?.data || []));
    } catch { setBlocks([]); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let interval: any;
    if (importJob && (importJob.status === 'Pending' || importJob.status === 'Processing')) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/blocks/import-status/${importJob.jobId}`);
          setImportJob(res.data);
          if (res.data.status === 'Completed') {
            setImporting(false);
            setImportResult({ open: true, success: true, title: 'Import Successful', message: res.data.message || 'Import completed!' });
            fetchData();
          } else if (res.data.status === 'Failed') {
            setImporting(false);
            setImportResult({ open: true, success: false, title: 'Import Failed', message: res.data.message || 'Import failed.' });
          }
        } catch (err) { }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [importJob, fetchData]);

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      if (confirm.type === 'bulk') {
        await axios.delete('/api/blocks/bulk', { data: { ids: selected } });
        setSelected([]);
      } else {
        await axios.delete(`/api/blocks/${confirm.item.id}`);
      }
      fetchData(); 
      setConfirm({ open: false, type: 'delete', item: null, loading: false }); 
    }
    catch (err: any) { 
      setConfirm(c => ({ ...c, loading: false, open: false })); 
      setImportResult({ open: true, success: false, title: 'Delete Failed', message: err.response?.data?.message || 'Delete failed.' });
      fetchData();
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('excel_file', file);

    try {
      const res = await axios.post('/api/blocks/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.status === 202 && res.data.jobId) {
        setImportJob({ jobId: res.data.jobId, status: 'Pending', totalRows: 0, processedRows: 0, message: '' });
      } else {
        setImportResult({ open: true, success: true, title: 'Import Successful', message: res.data.message || 'Import successful!' });
        setImporting(false);
        fetchData();
      }
    } catch (err: any) {
      setImporting(false);
      setImportResult({ open: true, success: false, title: 'Import Failed', message: err.response?.data?.message || 'Import failed.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = blocks.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase()));

  const allChecked = filtered.length > 0 && selected.length === filtered.length;
  const toggleAll = (e) => {
    if (e.target.checked) setSelected(filtered.map(b => b.id));
    else setSelected([]);
  };

  return (
    <AdminLayout title={t('blocks.title')}>
      {importing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center w-[400px]">
            <span className="material-icons text-primary text-5xl animate-spin mb-4">autorenew</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Importing Data...</h3>
            
            {importJob ? (
              <div className="w-full">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{importJob.processedRows} / {importJob.totalRows || '?'} rows</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="bg-primary h-3 rounded-full transition-all duration-300" 
                       style={{ width: `${importJob.totalRows ? Math.min(100, (importJob.processedRows / importJob.totalRows) * 100) : 0}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 text-center">{importJob.status}...</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Uploading file to server...</p>
            )}
            
            <button onClick={() => setImporting(false)} className="mt-6 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer">Run in Background</button>
          </div>
        </div>
      )}

      {!importing && importJob && (importJob.status === 'Pending' || importJob.status === 'Processing') && (
        <div 
          className="fixed bottom-6 right-6 z-[90] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-primary/10 rounded-2xl p-4 w-80 cursor-pointer transition-all hover:-translate-y-1" 
          onClick={() => setImporting(true)}
          title="Click to view details"
        >
          <div className="flex items-center gap-3 mb-3">
             <span className="material-icons text-primary animate-spin text-xl">autorenew</span>
             <h4 className="text-sm font-bold text-slate-800 dark:text-white">Importing Blocks...</h4>
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
      
      <Modal open={importResult.open} onClose={() => setImportResult(prev => ({ ...prev, open: false }))} title={importResult.title} size="sm">
        <div className="flex flex-col items-center pt-2 pb-4 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${importResult.success ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
            <span className="material-icons text-3xl">{importResult.success ? 'check_circle' : 'error'}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-center">{importResult.message}</p>
          <button onClick={() => setImportResult(prev => ({ ...prev, open: false }))} className="mt-6 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold w-full transition-all cursor-pointer">Close</button>
        </div>
      </Modal>

      <BlockModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} residents={residents} householders={householders} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, type: 'delete', item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title={confirm.type === 'bulk' ? 'Delete Selected?' : 'Delete Block?'} 
        message={confirm.type === 'bulk' ? `Delete <strong>${selected.length}</strong> selected blocks permanently?` : `Permanently delete block <strong>${confirm.item?.name}</strong>? This cannot be undone.`}
        confirmLabel="Yes, Delete" />

      <PageHeader
        title={t('blocks.title')}
        subtitle={t('blocks.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleImportExcel} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50">
              <span className="material-icons text-sm">{importing ? 'hourglass_empty' : 'upload_file'}</span> {importing ? 'Importing...' : t('common.import')}
            </button>
            <button onClick={() => setModal({ open: true, data: null })}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="material-icons text-sm">add</span> {t('blocks.add_block')}
            </button>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} />
      </FilterBar>

      <div className="mb-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 pl-2">
           <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-transparent text-primary focus:ring-primary/30 cursor-pointer" />
           <span className="text-sm font-bold text-slate-700 dark:text-white border-r border-slate-200 dark:border-slate-700 pr-3">Select All</span>
           <span className={`text-sm font-semibold transition-opacity duration-200 ${selected.length > 0 ? 'opacity-100 text-slate-500 dark:text-slate-400' : 'opacity-0'}`}>
             {selected.length} selected
           </span>
        </div>
        {selected.length > 0 && (
          <button onClick={() => setConfirm({ open: true, type: 'bulk', item: null, loading: false })} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
            <span className="material-icons text-sm">delete</span> Delete Selected
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="apartment" title="No blocks yet" subtitle="Add your first block to get started" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(block => (
            <BlockCard key={block.id} block={block}
              isSelected={selected.includes(block.id)}
              onToggleSelect={(id, checked) => setSelected(prev => checked ? [...prev, id] : prev.filter(s => s !== id))}
              onEdit={b => setModal({ open: true, data: b })}
              onDelete={b => setConfirm({ open: true, type: 'delete', item: b, loading: false })}
              onManageUnits={b => window.location.href = `/admin/blocks/${b.id}/units`}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

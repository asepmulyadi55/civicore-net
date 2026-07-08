// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Modal, ConfirmModal,
  PageHeader, FilterBar, SearchInput,
  TableWrapper, Th, FormInput, FormSelect, CustomSelect
} from '../../admin/components/ui';
import { usePermissions } from '../../admin/PermissionsContext';
import { formatApiErrors } from '../../utils/formatErrors';

function UnitModal({ open, onClose, onSaved, data, blockId }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ unit_number: '', house_status: 0 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ unit_number: data.unitNumber || data.unit_number || '', house_status: data.houseStatus ?? data.house_status ?? 0 });
    else setForm({ unit_number: '', house_status: 0 });
    setErrors({});
  }, [data, open]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.unit_number.trim()) errs.unitNumber = t('units.error_unit_number_required', 'Unit number is required.');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true); setErrors({});
    try {
      const payload = {
        unitNumber: form.unit_number,
        houseStatus: Number(form.house_status),
        blockId: blockId
      };
      
      if (isEdit) await axios.put(`/api/units/${data.id}`, payload);
      else await axios.post('/api/units', payload);
      
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(formatApiErrors(err));
    } finally { setLoading(false); }
  };

  const statusOptions = [
    { value: 0, label: t('units.status_owner') },
    { value: 1, label: t('units.status_rented') },
    { value: 2, label: t('units.status_vacant') },
    { value: 3, label: t('units.status_public') },
    { value: 4, label: t('units.status_developer') },
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('units.modal_title_edit') : t('units.modal_title_add')} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label={t('units.unit_number')} id="u-number" value={form.unit_number} onChange={set('unit_number')} error={errors.unitNumber} required placeholder={t('units.unit_number_placeholder')} />
        
        <CustomSelect 
          label={t('units.house_status')}
          value={String(form.house_status)} 
          onChange={val => setForm(p => ({ ...p, house_status: Number(val) }))} 
          options={statusOptions.map(o => ({ value: String(o.value), label: o.label }))} 
        />

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('units.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('units.btn_saving') : isEdit ? t('units.btn_save_changes') : t('units.btn_create')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Units() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { id } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null, loading: false });
  const [selected, setSelected] = useState([]);
  const [resultModal, setResultModal] = useState({ open: false, success: true, title: '', message: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/blocks/${id}`);
      setBlock(res.data);
      setUnits(res.data.units || []);
    } catch {
      navigate('/admin/blocks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try { 
      if (confirm.type === 'bulk') {
        await axios.delete('/api/units/bulk', { data: { ids: selected } });
        setSelected([]);
      } else {
        await axios.delete(`/api/units/${confirm.item.id}`); 
      }
      fetchData(); 
      setConfirm({ open: false, type: null, item: null, loading: false }); 
    }
    catch (err: any) { 
      setConfirm(c => ({ ...c, loading: false, open: false })); 
      setResultModal({ open: true, success: false, title: t('units.delete_failed'), message: err.response?.data?.message || 'Delete failed.' });
      fetchData();
    }
  };

  const filtered = units.filter(u => !search || (u.unitNumber || u.unit_number)?.toLowerCase().includes(search.toLowerCase()));

  const allChecked = filtered.length > 0 && selected.length === filtered.length;
  const toggleAll = () => setSelected(allChecked ? [] : filtered.map(u => u.id));
  const toggleOne = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const getStatusLabel = (statusVal) => {
    switch(statusVal) {
      case 0: return t('units.status_owner');
      case 1: return t('units.status_rented');
      case 2: return t('units.status_vacant');
      case 3: return t('units.status_public');
      case 4: return t('units.status_developer');
      default: return t('units.status_unknown');
    }
  };

  const stats = [
    { label: t('units.stat_units'), value: filtered.length, valCls: 'text-slate-900 dark:text-white' },
    { label: t('units.stat_owner'), value: filtered.filter(u => (u.houseStatus ?? u.house_status) === 0).length, valCls: 'text-amber-600 dark:text-amber-500' },
    { label: t('units.stat_rented'), value: filtered.filter(u => (u.houseStatus ?? u.house_status) === 1).length, valCls: 'text-orange-600 dark:text-orange-500' },
    { label: t('units.stat_vacant'), value: filtered.filter(u => (u.houseStatus ?? u.house_status) === 2).length, valCls: 'text-sky-500 dark:text-sky-400' },
  ];

  return (
    <AdminLayout title={t('units.title_manage', { block: block?.name || 'Block' })}>
      <UnitModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} blockId={id} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, type: null, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title={confirm.type === 'bulk' ? t('units.confirm_delete_bulk_title') : t('units.confirm_delete_title')} 
        message={confirm.type === 'bulk' ? <Trans i18nKey="units.confirm_delete_bulk_msg" count={selected.length}>Delete <strong>{{count: selected.length}}</strong> selected units permanently?</Trans> : <Trans i18nKey="units.confirm_delete_msg" values={{ unit: confirm.item?.unitNumber || confirm.item?.unit_number }}>Permanently delete unit <strong>{{unit: confirm.item?.unitNumber || confirm.item?.unit_number}}</strong>?</Trans>}
        confirmLabel={t('units.btn_confirm_delete')} />

      <PageHeader
        title={t('units.page_title', { block: block?.name || '...' })}
        subtitle={t('units.page_subtitle')}
        onBack={() => navigate('/admin/blocks')}
        actions={
          can('blocks.create') && (
            <button onClick={() => setModal({ open: true, data: null })}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="material-icons text-sm">add</span> {t('units.btn_add_unit')}
            </button>
          )
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder={t('units.search_placeholder')} />
      </FilterBar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${s.valCls}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="door_front" title={t('units.no_units_title')} subtitle={t('units.no_units_subtitle')} />
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 pl-2">
              {can('blocks.delete') && (
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-transparent text-primary focus:ring-primary/30 cursor-pointer" />
              )}
               <span className="text-sm font-bold text-slate-700 dark:text-white border-r border-slate-200 dark:border-slate-700 pr-3">{t('units.select_all')}</span>
               <span className={`text-sm font-semibold transition-opacity duration-200 ${selected.length > 0 ? 'opacity-100 text-slate-500 dark:text-slate-400' : 'opacity-0'}`}>
                 {t('units.selected', { count: selected.length })}
               </span>
            </div>
            {can('blocks.delete') && selected.length > 0 && (
              <button onClick={() => setConfirm({ open: true, type: 'bulk', item: null, loading: false })} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                <span className="material-icons text-sm">delete</span> {t('units.btn_delete_selected')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(unit => {
            const status = unit.houseStatus ?? unit.house_status;
            return (
              <div key={unit.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col hover:border-primary/30 dark:hover:border-slate-700 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <span className="material-icons text-[18px]">{status === 2 ? 'home' : 'person'}</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{unit.unitNumber || unit.unit_number}</div>
                      <div className={`text-[10px] mt-1.5 font-semibold uppercase tracking-wide ${
                        status === 0 ? 'text-amber-600 dark:text-amber-500' :
                        status === 1 ? 'text-orange-600 dark:text-orange-500' :
                        status === 2 ? 'text-sky-500 dark:text-sky-400' :
                        'text-slate-500 dark:text-slate-400'
                      }`}>
                        {getStatusLabel(status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">{t('units.active')}</span>
                    {can('blocks.delete') && (
                      <input type="checkbox" checked={selected.includes(unit.id)} onChange={() => toggleOne(unit.id)} className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-transparent text-primary focus:ring-primary/30 cursor-pointer" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs mb-5">
                  <span className="material-icons text-[16px]">person_outline</span>
                  <span className="truncate">{unit.householders?.[0]?.fullname || unit.current_householder?.fullname || '-'}</span>
                </div>

                <div className="flex gap-2 mt-auto">
                  {can('blocks.edit') && (
                    <button onClick={() => setModal({ open: true, data: unit })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <span className="material-icons text-[14px]">edit</span> {t('units.btn_edit')}
                    </button>
                  )}
                  {can('blocks.delete') && (
                    <button onClick={() => setConfirm({ open: true, type: 'delete', item: unit, loading: false })} className="w-9 h-9 flex shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer">
                      <span className="material-icons text-[14px]">delete_outline</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      <Modal open={resultModal.open} onClose={() => setResultModal({ ...resultModal, open: false })} title={resultModal.title} size="sm">
        <div className="p-4 text-center">
          <span className={`material-icons text-5xl mb-4 ${resultModal.success ? 'text-green-500' : 'text-rose-500'}`}>
            {resultModal.success ? 'check_circle' : 'error'}
          </span>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-center">{resultModal.message}</p>
          <div className="mt-6">
            <button onClick={() => setResultModal({ ...resultModal, open: false })} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors cursor-pointer">
              {t('units.btn_close')}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

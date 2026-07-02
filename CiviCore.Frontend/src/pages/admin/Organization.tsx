// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, EmptyState, Modal, ConfirmModal, FormInput, FormSelect, SecureImage, CustomSelect, SearchableSelect } from '../../admin/components/ui';
import { useTranslation } from 'react-i18next';

interface OrgPeriod {
  id: string;
  name: string;
  isActive: boolean;
  startYear: number;
  endYear: number;
}

interface OrgPosition {
  id: string;
  periodId: string;
  parentId: string | null;
  positionName: string;
  residentId: string | null;
  householderId: string | null;
  sortOrder: number;
  resident?: any;
  householder?: any;
  children?: OrgPosition[];
}

function PeriodModal({ open, onClose, onSaved, data }: { open: boolean; onClose: () => void; onSaved: () => void; data: OrgPeriod | null }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ name: '', startYear: currentYear, endYear: currentYear + 1 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name, startYear: data.startYear, endYear: data.endYear });
    else setForm({ name: '', startYear: currentYear, endYear: currentYear + 1 });
    setErrors({});
  }, [data, open, currentYear]);

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/organization/periods/${data!.id}`, form);
      else await axios.post('/api/organization/periods', form);
      onSaved(); onClose();
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Save failed.';
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join(' ');
      }
      setErrors({ general: msg });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('organization.period_modal_edit') : t('organization.period_modal_add')} size="sm">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label={t('organization.period_name')} id="p-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} required placeholder={t('organization.period_name_placeholder')} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label={t('organization.start_year')} id="p-start" type="number" value={String(form.startYear)} onChange={e => setForm(p => ({ ...p, startYear: parseInt(e.target.value) || 0 }))} error={errors.startYear} required />
          <FormInput label={t('organization.end_year')} id="p-end" type="number" value={String(form.endYear)} onChange={e => setForm(p => ({ ...p, endYear: parseInt(e.target.value) || 0 }))} error={errors.endYear} required />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all text-sm font-semibold cursor-pointer">{t('organization.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary text-white dark:text-surface text-sm font-bold shadow-sm transition-all cursor-pointer">{loading ? t('organization.saving') : t('organization.btn_save_period')}</button>
        </div>
      </div>
    </Modal>
  );
}

function PositionModal({ open, onClose, onSaved, data, periodId, allPositions }: { open: boolean; onClose: () => void; onSaved: () => void; data: OrgPosition | null; periodId: string; allPositions: OrgPosition[] }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ positionName: '', parentId: '', residentId: '', householderId: '', sortOrder: 0 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // For resident assignment dropdown
  const [residents, setResidents] = useState([]);
  const [householders, setHouseholders] = useState([]);
  const [personType, setPersonType] = useState('none');

  useEffect(() => {
    if (open) {
      axios.get('/api/residents?per_page=1000').then(r => setResidents(Array.isArray(r.data) ? r.data : (r.data?.data || []))).catch(() => {});
      axios.get('/api/householders?per_page=1000').then(r => setHouseholders(Array.isArray(r.data) ? r.data : (r.data?.data || []))).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setForm({ positionName: data.positionName, parentId: data.parentId || '', residentId: data.residentId || '', householderId: data.householderId || '', sortOrder: data.sortOrder });
      if (data.residentId) setPersonType('resident');
      else if (data.householderId) setPersonType('householder');
      else setPersonType('none');
    } else {
      setForm({ positionName: '', parentId: '', residentId: '', householderId: '', sortOrder: 0 });
      setPersonType('none');
    }
    setErrors({});
  }, [data, open]);

  const handleSave = async () => {
    setLoading(true); setErrors({});
    const payload = {
      periodId,
      positionName: form.positionName,
      parentId: form.parentId || null,
      residentId: personType === 'resident' ? (form.residentId || null) : null,
      householderId: personType === 'householder' ? (form.householderId || null) : null,
      sortOrder: form.sortOrder
    };

    try {
      if (isEdit) await axios.put(`/api/organization/positions/${data!.id}`, payload);
      else await axios.post('/api/organization/positions', payload);
      onSaved(); onClose();
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Save failed.';
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join(' ');
      }
      setErrors({ general: msg });
    } finally { setLoading(false); }
  };

  const parentOptions = allPositions.filter(p => p.id !== data?.id).map(p => ({ value: p.id, label: p.positionName }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('organization.pos_modal_edit') : t('organization.pos_modal_add')} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label={t('organization.pos_name')} id="pos-name" value={form.positionName} onChange={e => setForm(p => ({ ...p, positionName: e.target.value }))} error={errors.positionName} required placeholder={t('organization.pos_name_placeholder')} />
        <CustomSelect label={t('organization.parent_pos')} value={form.parentId} onChange={v => setForm(p => ({ ...p, parentId: v }))} options={parentOptions} placeholder={t('organization.parent_none')} />
        <FormInput label={t('organization.sort_order')} id="pos-sort" type="number" value={String(form.sortOrder)} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} />
        
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('organization.assign_person')}</p>
          <CustomSelect label={t('organization.person_type')} value={personType} onChange={v => setPersonType(v)} options={[
            { value: 'none', label: t('organization.type_unassigned') },
            { value: 'resident', label: t('organization.type_resident') },
            { value: 'householder', label: t('organization.type_householder') }
          ]} />
          
          {personType === 'resident' && (
            <div className="mt-3">
              <SearchableSelect label={t('organization.select_resident')} value={form.residentId} onChange={v => setForm(p => ({ ...p, residentId: v }))} options={residents.map(r => ({ value: r.id, label: r.fullname }))} placeholder={t('organization.search_resident')} />
            </div>
          )}
          {personType === 'householder' && (
            <div className="mt-3">
              <SearchableSelect label={t('organization.select_householder')} value={form.householderId} onChange={v => setForm(p => ({ ...p, householderId: v }))} options={householders.map(r => ({ value: r.id, label: r.fullname }))} placeholder={t('organization.search_householder')} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all text-sm font-semibold cursor-pointer">{t('organization.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary text-white dark:text-surface text-sm font-bold shadow-sm transition-all cursor-pointer">{loading ? t('organization.saving') : t('organization.btn_save_position')}</button>
        </div>
      </div>
    </Modal>
  );
}

function OrgHeroCard({ node, onEdit, onDelete }: { node: OrgPosition; onEdit: (n: OrgPosition) => void; onDelete: (n: OrgPosition) => void }) {
  const { t } = useTranslation();
  const personName = node.resident?.fullname || node.householder?.fullname || t('organization.unassigned');
  const initials = personName !== t('organization.unassigned') ? personName.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?';
  const photoUrl = node.resident?.photoPath || node.householder?.photoPath;

  return (
    <div className="flex justify-center mb-4">
    <div className="flex justify-center mb-4">
      <div className="group relative w-64 text-center px-6 py-6 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent border-2 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
        <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => onEdit(node)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/50 shadow-sm transition-all cursor-pointer"><span className="material-icons text-slate-400 hover:text-primary text-sm">edit</span></button>
          <button onClick={() => onDelete(node)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-rose-400 shadow-sm transition-all cursor-pointer"><span className="material-icons text-slate-400 hover:text-rose-500 text-sm">close</span></button>
        </div>
        {photoUrl ? (
          <SecureImage src={`/api/media/path/${photoUrl}`} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md mx-auto mb-4" alt="" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl shadow-sm mx-auto mb-4 border-4 border-white dark:border-slate-800">{initials}</div>
        )}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-2">{node.positionName}</span>
        <p className={`font-bold text-base leading-tight ${personName !== t('organization.unassigned') ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>{personName}</p>
      </div>
    </div>
    </div>
  );
}

function OrgOfficerCard({ node, onEdit, onDelete }: { node: OrgPosition; onEdit: (n: OrgPosition) => void; onDelete: (n: OrgPosition) => void }) {
  const { t } = useTranslation();
  const personName = node.resident?.fullname || node.householder?.fullname || t('organization.unassigned');
  const initials = personName !== t('organization.unassigned') ? personName.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?';
  const photoUrl = node.resident?.photoPath || node.householder?.photoPath;

  return (
    <div className="flex justify-center">
      <div className="group relative w-48 text-center px-4 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => onEdit(node)} className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/50 shadow-sm transition-all cursor-pointer"><span className="material-icons text-slate-400 hover:text-primary text-[13px]">edit</span></button>
          <button onClick={() => onDelete(node)} className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-rose-400 shadow-sm transition-all cursor-pointer"><span className="material-icons text-slate-400 hover:text-rose-500 text-[13px]">close</span></button>
        </div>
        {photoUrl ? (
          <SecureImage src={`/api/media/path/${photoUrl}`} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm mx-auto mb-2" alt="" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center text-base shadow-sm mx-auto mb-2 border-2 border-white dark:border-slate-800">{initials}</div>
        )}
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 mb-1">{node.positionName}</span>
        <p className={`font-semibold text-sm leading-tight truncate px-1 ${personName !== t('organization.unassigned') ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>{personName}</p>
      </div>
    </div>
  );
}

function OrgSectionNode({ node, onEdit, onDelete }: { node: OrgPosition; onEdit: (n: OrgPosition) => void; onDelete: (n: OrgPosition) => void }) {
  const { t } = useTranslation();
  const personName = node.resident?.fullname || node.householder?.fullname || t('organization.unassigned');
  const initials = personName !== t('organization.unassigned') ? personName.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?';
  const photoUrl = node.resident?.photoPath || node.householder?.photoPath;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700 group relative">
        <div className="absolute top-0 right-0 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(node)} className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/50 transition-all cursor-pointer"><span className="material-icons text-slate-400 hover:text-primary text-[13px]">edit</span></button>
          <button onClick={() => onDelete(node)} className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-rose-400 transition-all cursor-pointer"><span className="material-icons text-slate-400 hover:text-rose-500 text-[13px]">close</span></button>
        </div>
        {photoUrl ? (
          <SecureImage src={`/api/media/path/${photoUrl}`} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shadow-sm border-2 border-white dark:border-slate-800">{initials}</div>
        )}
        <div className="flex-1 pr-14">
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mb-0.5">{node.positionName}</span>
          <p className={`font-semibold text-sm ${personName !== t('organization.unassigned') ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>{personName}</p>
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-5 mt-2">
          {node.children.map(child => {
            const cName = child.resident?.fullname || child.householder?.fullname || t('organization.unassigned');
            return (
              <div key={child.id} className="group relative flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all">
                <div className="absolute right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 pl-2">
                  <button onClick={() => onEdit(child)} className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/50 cursor-pointer"><span className="material-icons text-slate-400 hover:text-primary text-[13px]">edit</span></button>
                  <button onClick={() => onDelete(child)} className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-rose-400 cursor-pointer"><span className="material-icons text-slate-400 hover:text-rose-500 text-[13px]">close</span></button>
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">{child.positionName}</span>
                  <span className={`text-xs block truncate ${cName !== t('organization.unassigned') ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 italic'}`}>{cName}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrgChart({ tree, onEdit, onDelete }: { tree: OrgPosition[]; onEdit: (n: OrgPosition) => void; onDelete: (n: OrgPosition) => void }) {
  const { t } = useTranslation();
  if (tree.length === 1) {
    const rootItem = tree[0];
    const rootChildren = rootItem.children || [];
    const officers = rootChildren.filter(c => !c.children || c.children.length === 0);
    const sections = rootChildren.filter(c => c.children && c.children.length > 0);

    return (
      <div className="max-w-5xl mx-auto py-4">
        <OrgHeroCard node={rootItem} onEdit={onEdit} onDelete={onDelete} />
        
        {rootChildren.length > 0 && (
          <div className="flex justify-center mb-4"><div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div></div>
        )}

        {officers.length > 0 && (
          <div className="flex justify-center mb-5">
            <div className="flex flex-wrap justify-center gap-4">
              {officers.map(officer => <OrgOfficerCard key={officer.id} node={officer} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <>
            {officers.length > 0 && <div className="flex justify-center mb-6"><div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div></div>}
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">{t('organization.divisions_committees')}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections.map(section => <OrgSectionNode key={section.id} node={section} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          </>
        )}
      </div>
    );
  }

  // Multiple roots fallback
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {tree.map(node => (
        <OrgSectionNode key={node.id} node={node} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function Organization() {
  const { t } = useTranslation();
  const [periods, setPeriods] = useState<OrgPeriod[]>([]);
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [periodModal, setPeriodModal] = useState({ open: false, data: null as OrgPeriod | null });
  const [posModal, setPosModal] = useState({ open: false, data: null as OrgPosition | null });
  const [confirm, setConfirm] = useState({ open: false, item: null as any, type: '', loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await axios.get('/api/organization/periods');
      setPeriods(res.data);
      if (res.data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(res.data.find(p => p.isActive)?.id || res.data[0].id);
      }
    } catch {}
  }, [selectedPeriod]);

  const fetchPositions = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/organization/positions?periodId=${selectedPeriod}`);
      setPositions(res.data);
    } catch {} finally { setLoading(false); }
  }, [selectedPeriod]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);
  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const activatePeriod = async (id: string) => {
    await axios.patch(`/api/organization/periods/${id}/activate`);
    fetchPeriods();
  };

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      if (confirm.type === 'period') await axios.delete(`/api/organization/periods/${confirm.item.id}`);
      else await axios.delete(`/api/organization/positions/${confirm.item.id}`);
      if (confirm.type === 'period') fetchPeriods();
      else fetchPositions();
      setConfirm({ open: false, item: null, type: '', loading: false });
    } catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  // Build tree
  const tree: OrgPosition[] = [];
  const map = new Map<string, OrgPosition>();
  positions.forEach(p => { map.set(p.id, { ...p, children: [] }); });
  positions.forEach(p => {
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children!.push(map.get(p.id)!);
    } else {
      tree.push(map.get(p.id)!);
    }
  });

  return (
    <AdminLayout title={t('organization.title')}>
      <PeriodModal open={periodModal.open} onClose={() => setPeriodModal({ open: false, data: null })} onSaved={fetchPeriods} data={periodModal.data} />
      {selectedPeriod && <PositionModal open={posModal.open} onClose={() => setPosModal({ open: false, data: null })} onSaved={fetchPositions} data={posModal.data} periodId={selectedPeriod} allPositions={positions} />}
      
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, type: '', loading: false })} onConfirm={doDelete} loading={confirm.loading} icon="delete_forever" title={confirm.type === 'period' ? t('organization.delete_period_title') : t('organization.delete_pos_title')} message={t('organization.delete_message')} confirmLabel={t('organization.btn_delete_confirm')} />

      <PageHeader
        title={t('organization.title')}
        subtitle={t('organization.subtitle')}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setPeriodModal({ open: true, data: null })} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-sm font-bold rounded-lg transition-all cursor-pointer">
              {t('organization.btn_manage_periods')}
            </button>
            {selectedPeriod && (
              <button onClick={() => setPosModal({ open: true, data: null })} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all cursor-pointer">
                <span className="material-icons text-sm">account_tree</span> {t('organization.btn_add_position')}
              </button>
            )}
          </div>
        }
      />

      {periods.length > 0 ? (
        <div className="flex items-center gap-3 flex-wrap mb-8">
          <span className="text-sm font-semibold text-slate-500">{t('organization.period_label')}</span>
          <div className="flex flex-wrap gap-2">
            {periods.map(p => (
              <div key={p.id} className="relative group">
                <button onClick={() => setSelectedPeriod(p.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${selectedPeriod === p.id ? 'bg-primary text-white dark:text-surface border-primary' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {p.name}
                  {p.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
                {/* Fixed Hover Gap: Removed mt-1, replaced with invisible padding wrapper to bridge the gap */}
                <div className="absolute top-full pt-1 hidden group-hover:block z-10 w-32 left-0">
                  <div className="flex flex-col bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg rounded-lg overflow-hidden">
                    {!p.isActive && <button onClick={() => activatePeriod(p.id)} className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-300">{t('organization.set_active')}</button>}
                    <button onClick={() => setPeriodModal({ open: true, data: p })} className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-300">{t('organization.edit')}</button>
                    {!p.isActive && <button onClick={() => setConfirm({ open: true, item: p, type: 'period', loading: false })} className="px-3 py-2 text-xs text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer">{t('organization.delete')}</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6"><EmptyState icon="event" title={t('organization.no_periods_title')} subtitle={t('organization.no_periods_subtitle')} /></div>
      )}

      {selectedPeriod && (
        loading ? (
          <div className="flex justify-center py-12"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
        ) : tree.length === 0 ? (
          <EmptyState icon="account_tree" title={t('organization.empty_org_title')} subtitle={t('organization.empty_org_subtitle')} />
        ) : (
          <OrgChart tree={tree} onEdit={n => setPosModal({ open: true, data: n })} onDelete={n => setConfirm({ open: true, item: n, type: 'position', loading: false })} />
        )
      )}
    </AdminLayout>
  );
}

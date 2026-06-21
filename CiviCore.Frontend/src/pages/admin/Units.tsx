// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Modal, ConfirmModal,
  PageHeader, FilterBar, SearchInput,
  TableWrapper, Th, FormInput, FormSelect
} from '../../admin/components/ui';

function UnitModal({ open, onClose, onSaved, data, blockId }) {
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
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  const statusOptions = [
    { value: 0, label: 'Owner Occupied' },
    { value: 1, label: 'Rented' },
    { value: 2, label: 'Vacant' },
    { value: 3, label: 'Public Facility' },
    { value: 4, label: 'Developer' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Unit' : 'Add New Unit'} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Unit Number" id="u-number" value={form.unit_number} onChange={set('unit_number')} error={errors.unit_number} required placeholder="e.g. 101, A-12" />
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">House Status</label>
          <select value={form.house_status} onChange={set('house_status')} className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none">
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm shadow-primary/20 disabled:opacity-60 transition-all">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Unit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Units() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, item: null, loading: false });

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
      await axios.delete(`/api/units/${confirm.item.id}`); 
      fetchData(); 
      setConfirm({ open: false, item: null, loading: false }); 
    }
    catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  const filtered = units.filter(u => !search || (u.unitNumber || u.unit_number)?.toLowerCase().includes(search.toLowerCase()));

  const getStatusLabel = (statusVal) => {
    switch(statusVal) {
      case 0: return 'Owner Occupied';
      case 1: return 'Rented';
      case 2: return 'Vacant';
      case 3: return 'Public Facility';
      case 4: return 'Developer';
      default: return 'Unknown';
    }
  };

  return (
    <AdminLayout title={`Manage Units - ${block?.name || 'Block'}`}>
      <UnitModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} blockId={id} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title="Delete Unit?" message={`Permanently delete unit <strong>${confirm.item?.unitNumber || confirm.item?.unit_number}</strong>?`}
        confirmLabel="Yes, Delete" />

      <PageHeader
        title={`Units in ${block?.name || '...'}`}
        subtitle="Manage the individual residential units for this block"
        onBack={() => navigate('/admin/blocks')}
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Add Unit
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search unit number…" />
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="door_front" title="No units found" subtitle="Add the first unit for this block" />
        </div>
      ) : (
        <TableWrapper>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <Th>UNIT NUMBER</Th>
                <Th>STATUS</Th>
                <Th className="text-right">ACTIONS</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(unit => (
                <tr key={unit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{unit.unitNumber || unit.unit_number}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700">
                      {getStatusLabel(unit.houseStatus ?? unit.house_status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setModal({ open: true, data: unit })} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <button onClick={() => setConfirm({ open: true, item: unit, loading: false })} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                        <span className="material-icons text-sm">delete_outline</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

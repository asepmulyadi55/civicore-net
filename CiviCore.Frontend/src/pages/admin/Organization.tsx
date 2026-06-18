// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, EmptyState, Modal, ConfirmModal, FormInput, FormSelect } from '../../admin/components/ui';

interface OrgMember {
  id: number;
  name: string;
  position: string;
  photo_url?: string;
  period_id: number;
}

interface OrgPeriod {
  id: number;
  name: string;
  is_active: boolean;
  start_year: number;
  end_year: number;
}

function MemberCard({ member, onEdit, onDelete }: { member: OrgMember; onEdit: (m: OrgMember) => void; onDelete: (m: OrgMember) => void }) {
  const initials = member.name.split(' ').map((w) => w[0]?.toUpperCase()).slice(0, 2).join('');
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-primary/20 transition-all">
      {member.photo_url ? (
        <img src={member.photo_url} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center">{initials}</div>
      )}
      <div>
        <p className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{member.position}</p>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(member)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
          <span className="material-icons text-lg">edit</span>
        </button>
        <button onClick={() => onDelete(member)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
          <span className="material-icons text-lg">delete_outline</span>
        </button>
      </div>
    </div>
  );
}

function MemberModal({ open, onClose, onSaved, data, periods }: { open: boolean; onClose: () => void; onSaved: () => void; data: OrgMember | null; periods: OrgPeriod[] }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState({ name: '', position: '', period_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name, position: data.position, period_id: String(data.period_id) });
    else setForm({ name: '', position: '', period_id: '' });
    setErrors({});
  }, [data, open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      if (isEdit) await axios.put(`/api/organization/${data!.id}`, form);
      else await axios.post('/api/organization', form);
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  const periodOptions = periods.map((p) => ({ value: String(p.id), label: `${p.name}${p.is_active ? ' (Active)' : ''}` }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Member' : 'Add Member'} size="sm">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <FormInput label="Full Name" id="org-name" value={form.name} onChange={set('name')} error={errors.name} required />
        <FormInput label="Position/Role" id="org-pos" value={form.position} onChange={set('position')} error={errors.position} required placeholder="e.g. Ketua RT" />
        <FormSelect label="Period" id="org-period" value={form.period_id} onChange={set('period_id')} options={periodOptions} error={errors.period_id} required placeholder="Select Period" />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Organization() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [periods, setPeriods] = useState<OrgPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; data: OrgMember | null }>({ open: false, data: null });
  const [confirm, setConfirm] = useState<{ open: boolean; item: OrgMember | null; loading: boolean }>({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        axios.get('/api/organization', { params: { period_id: selectedPeriod } }),
        axios.get('/api/organization/periods').catch(() => ({ data: [] })),
      ]);
      setMembers(Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data || []));
      const pData: OrgPeriod[] = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []);
      setPeriods(pData);
      if (!selectedPeriod && pData.length > 0) {
        setSelectedPeriod(pData.find((p) => p.is_active)?.id || pData[0].id);
      }
    } catch { setMembers([]); } finally { setLoading(false); }
  }, [selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try { await axios.delete(`/api/organization/${confirm.item!.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm((c) => ({ ...c, loading: false })); }
  };

  return (
    <AdminLayout title="Organization">
      <MemberModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSaved={fetchData} data={modal.data} periods={periods} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="person_remove"
        title="Remove Member?" message={`Remove <strong>${confirm.item?.name}</strong> from the organization?`}
        confirmLabel="Yes, Remove" />

      <PageHeader
        title="Organization Structure"
        subtitle="Manage community leadership and committee members"
        actions={
          <button onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">person_add</span> Add Member
          </button>
        }
      />

      {/* Period selector */}
      {periods.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Period:</span>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button key={p.id} onClick={() => setSelectedPeriod(p.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                }`}>
                {p.name}
                {p.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : members.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="account_tree" title="No members yet" subtitle="Add your first organization member" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {members.map((m) => (
            <MemberCard key={m.id} member={m}
              onEdit={(mem) => setModal({ open: true, data: mem })}
              onDelete={(mem) => setConfirm({ open: true, item: mem, loading: false })}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

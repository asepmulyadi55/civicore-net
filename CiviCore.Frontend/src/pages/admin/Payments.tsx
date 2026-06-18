// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  StatusBadge, EmptyState, Pagination, Modal, ConfirmModal,
  Avatar, PageHeader, FilterBar, SearchInput, SelectFilter,
  BulkActionBar, TableWrapper, Th, FormInput, FormSelect
} from '../../admin/components/ui';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function PaymentStatusBadge({ status }) {
  const map = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    unpaid:   'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  };
  const labels = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected', unpaid: 'Unpaid' };
  const s = status?.toLowerCase() || 'unpaid';
  return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${map[s] || map.unpaid}`}>{labels[s] || s}</span>;
}

function ReviewModal({ open, onClose, payment, onApprove, onReject }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState('');

  useEffect(() => { if (open) setReason(''); }, [open]);

  const handle = async (action) => {
    setLoading(action);
    try {
      if (action === 'approve') await axios.post(`/api/payments/${payment.id}/approve`);
      else await axios.post(`/api/payments/${payment.id}/reject`, { reason });
      onApprove(); onClose();
    } catch {} finally { setLoading(''); }
  };

  if (!payment) return null;
  return (
    <Modal open={open} onClose={onClose} title="Review Payment" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Resident</span><span className="font-semibold">{payment.householderName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-primary">Rp {(payment.amount || 0).toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Month</span><span>{payment.paymentMonth ? new Date(payment.paymentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span></div>
          {payment.notes && <div className="flex justify-between"><span className="text-slate-500">Notes</span><span className="text-right max-w-[200px]">{payment.notes}</span></div>}
        </div>
        {payment.proofPath && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-2">Payment Proof</p>
            <img src={payment.proofPath} alt="Payment proof" className="rounded-lg max-h-48 object-contain w-full" onError={e => e.target.style.display = 'none'} />
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rejection Reason (if rejecting)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Enter reason for rejection..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={() => handle('reject')} disabled={!!loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-bold transition-all disabled:opacity-60">
            {loading === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
          <button onClick={() => handle('approve')} disabled={!!loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all">
            {loading === 'approve' ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ householderId: '', amount: 0, notes: '', year: new Date().getFullYear() });
  const [householders, setHouseholders] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(new Set());

  useEffect(() => {
    if (open) {
      setForm({ householderId: '', amount: 0, notes: '', year: new Date().getFullYear() });
      setSelectedMonths(new Set());
      setErrors({});
      axios.get('/api/householders').then(res => setHouseholders(res.data.data || res.data)).catch(() => {});
    }
  }, [open]);

  const toggleMonth = (m) => {
    const next = new Set(selectedMonths);
    if (next.has(m)) next.delete(m); else next.add(m);
    setSelectedMonths(next);
  };

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      const selectedResident = householders.find(h => h.id === form.householderId);
      const payload = {
        householderId: form.householderId,
        blockId: selectedResident?.blockId || "00000000-0000-0000-0000-000000000000",
        amountPerMonth: Number(form.amount),
        months: Array.from(selectedMonths).map(m => `${form.year}-${String(m).padStart(2, '0')}-01T00:00:00Z`),
        notes: form.notes,
        paymentMethodId: null
      };
      await axios.post('/api/payments', payload);
      onSaved(); onClose();
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Failed to save payment.' });
    } finally { setLoading(false); }
  };

  const totalAmount = form.amount * selectedMonths.size;

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" size="lg">
      <div className="space-y-6">
        {errors.general && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-1 gap-4">
          <FormSelect label="Resident" id="pm-res" value={form.householderId} onChange={e => {
            const hId = e.target.value;
            const res = householders.find(h => h.id === hId);
            const amount = res?.currentFee?.amount || res?.fee || 0; // fallback logic
            setForm(f => ({ ...f, householderId: hId, amount }));
          }}
            options={householders.map(h => ({ value: h.id, label: `${h.fullname} (Unit ${h.unit?.unitNumber || h.unit_number || '?'})` }))} required placeholder="Select Resident" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-slate-700">Select Months</label>
            <select value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
              {[0, 1, 2].map(i => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MONTH_NAMES.map((name, idx) => {
              const m = idx + 1;
              const sel = selectedMonths.has(m);
              return (
                <button key={m} onClick={() => toggleMonth(m)}
                  className={`py-3 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${sel ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                  <span className="text-xs font-bold text-slate-700">{name.substring(0, 3)}</span>
                  <span className={`text-[10px] font-bold uppercase mt-1 ${sel ? 'text-primary' : 'text-slate-400'}`}>{sel ? 'Selected' : 'Unpaid'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Amount per Month (Rp)" id="pm-amt" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0" />
          <FormInput label="Notes" id="pm-not" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Paid in cash" />
        </div>

        {selectedMonths.size > 0 && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-primary uppercase">Total Calculated</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">Rp {totalAmount.toLocaleString('id-ID')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{selectedMonths.size} Months Selected</p>
              <p className="text-[11px] text-slate-500">{Array.from(selectedMonths).sort((a,b)=>a-b).map(m => MONTH_NAMES[m-1].substring(0,3)).join(', ')}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={loading || !form.householderId || !form.amount || selectedMonths.size === 0} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2">
            <span className="material-icons text-sm">verified</span> {loading ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Payments() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [selected, setSelected] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        axios.get('/api/payments', { params: filters }),
        axios.get('/api/payments/stats').catch(() => ({ data: {} })),
      ]);
      const p = pRes.data;
      setData(Array.isArray(p) ? p : (p.data || []));
      setMeta(p.meta || null);
      setStats(sRes.data);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const allChecked = data.length > 0 && selected.length === data.length;
  const toggleAll = () => setSelected(allChecked ? [] : data.map(p => p.id));
  const toggleOne = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try { await axios.delete(`/api/payments/${confirm.item.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  const statCards = [
    { label: 'Total Payments', value: stats?.total ?? 0, icon: 'receipt_long', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Pending Review', value: stats?.pending ?? 0, icon: 'pending_actions', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: 'check_circle', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: 'cancel', iconBg: 'bg-rose-100 dark:bg-rose-500/10', iconColor: 'text-rose-500' },
  ];

  return (
    <AdminLayout title="Payments">
      <PaymentModal open={addModal} onClose={() => setAddModal(false)} onSaved={fetchData} />
      <ReviewModal open={!!reviewItem} onClose={() => setReviewItem(null)} payment={reviewItem} onApprove={fetchData} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, item: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title="Delete Payment?" message={`Delete this payment record? This <strong>cannot</strong> be undone.`}
        confirmLabel="Yes, Delete" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${s.iconBg}`}><span className={`material-icons ${s.iconColor}`}>{s.icon}</span></div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <PageHeader 
        title="Payment Records" 
        subtitle="Manage and review resident payment submissions" 
        actions={
          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Record Payment
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder="Search resident, block…" />
        <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]} placeholder="All Status" />
        <button onClick={() => setFilters({ search: '', status: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </FilterBar>

      <BulkActionBar count={selected.length} onDelete={async () => {
        try { await axios.delete('/api/payments/bulk', { data: { ids: selected } }); setSelected([]); fetchData(); } catch {}
      }} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="w-12 px-6 py-4 text-center">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer" />
              </th>
              <Th>Resident</Th>
              <Th>Block / Unit</Th>
              <Th>Month</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Recorded</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={8}><EmptyState icon="receipt_long" title="No payments found" subtitle="Try adjusting your filters" /></td></tr>
            ) : data.map(p => {
              const name = p.householderName || p.householder?.fullname || '—';
              const initials = name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') || '?';
              const status = p.status?.toLowerCase() || 'unpaid';
              const isApproved = status === 'approved';
              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="w-12 px-6 py-4 text-center">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{initials}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                        <p className="text-xs text-slate-500">Unit {p.unit || p.householder?.unit_number || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {p.blockName || p.householder?.block?.name || '—'}
                    <span className="text-slate-400 font-normal ml-1">Â· {p.unit || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {p.allMonths && p.allMonths.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.allMonths.map(m => MONTH_NAMES[new Date(m).getMonth()].substring(0, 3)).join(', ')}
                        </span>
                        <span className="text-[11px] text-slate-400">{new Date(p.allMonths[0]).getFullYear()}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.paymentMonth ? MONTH_NAMES[new Date(p.paymentMonth).getMonth()].substring(0, 3) : '—'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {p.paymentMonth ? new Date(p.paymentMonth).getFullYear() : '—'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                    Rp {(p.amount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4"><PaymentStatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                      <span className="text-xs text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {status === 'pending' && (
                        <button onClick={() => setReviewItem(p)}
                          className="text-amber-600 border border-amber-500/40 bg-amber-50/60 hover:bg-amber-500 hover:text-white dark:bg-amber-500/10 dark:text-amber-400 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all">
                          Review
                        </button>
                      )}
                      {isApproved && <span className="text-xs text-slate-400 px-2">Approved {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : ''}</span>}
                      {status === 'rejected' && <span className="text-xs text-rose-400 px-2" title={p.rejectionReason}>Rejected</span>}
                      {!isApproved && (
                        <button onClick={() => setConfirm({ open: true, item: p, loading: false })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Delete">
                          <span className="material-icons text-lg">delete_outline</span>
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
              <tr><td colSpan={8}><Pagination meta={meta} onChange={p => setFilters(f => ({ ...f, page: p }))} /></td></tr>
            </tfoot>
          )}
        </TableWrapper>
      )}
    </AdminLayout>
  );
}

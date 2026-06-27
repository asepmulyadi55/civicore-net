// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
          <div className="flex justify-between"><span className="text-slate-500">Resident</span><span className="font-semibold text-slate-900 dark:text-white">{payment.householderName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-primary">Rp {(payment.amount || 0).toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Month</span><span className="text-slate-900 dark:text-white">{payment.paymentMonth ? new Date(payment.paymentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span></div>
          {payment.monthCount > 1 && <div className="flex justify-between"><span className="text-slate-500">Months</span><span className="font-semibold text-slate-900 dark:text-white">{payment.monthCount} months</span></div>}
          {payment.notes && <div className="flex justify-between"><span className="text-slate-500">Notes</span><span className="text-right max-w-[200px] text-slate-900 dark:text-white">{payment.notes}</span></div>}
        </div>
        {payment.proofPath && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-2">Payment Proof</p>
            {payment.proofPath.startsWith('/') || payment.proofPath.startsWith('http') ? (
              <img src={payment.proofPath} alt="Payment proof" className="rounded-lg max-h-48 object-contain w-full" onError={e => e.target.style.display = 'none'} />
            ) : (
              <p className="text-xs text-rose-500 italic">Image unavailable (uploaded before migration).</p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rejection Reason (if rejecting)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Enter reason for rejection..."
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
          <button onClick={() => handle('reject')} disabled={!!loading || reason.trim().length === 0}
            className="flex-1 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            {loading === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
          <button onClick={() => handle('approve')} disabled={!!loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            {loading === 'approve' ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({ open, onClose, onSaved, editData = null }) {
  const [form, setForm] = useState({ householderId: '', amount: 0, notes: '', year: new Date().getFullYear(), paymentMethodId: '' });
  const [householders, setHouseholders] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(new Set());
  const [existingPayments, setExistingPayments] = useState({});
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    if (!dropdownOpen) {
      setSearchQuery('');
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (open && form.householderId && form.year) {
      setLoadingPayments(true);
      axios.get(`/api/payments?householderId=${form.householderId}&per_page=100`)
        .then(res => {
          const payments = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const statusMap = {};
          const pendingToAdd = [];
          
          payments.forEach(p => {
            const yearStr = String(form.year);
            const months = p.allMonths || (p.paymentMonth ? [p.paymentMonth] : []);
            months.forEach(mStr => {
              if (mStr.startsWith(yearStr)) {
                const mInt = new Date(mStr).getMonth() + 1;
                statusMap[mInt] = p.status;
                
                // If editing, we want to pre-select any pending payments from the DB
                // so the user can edit them all at once.
                if (editData && p.status === 'pending') {
                    pendingToAdd.push(mInt);
                }
              }
            });
          });
          
          if (pendingToAdd.length > 0) {
              setSelectedMonths(prev => {
                  const next = new Set(prev);
                  pendingToAdd.forEach(m => next.add(m));
                  return next;
              });
          }
          
          setExistingPayments(statusMap);
        })
        .catch(() => setExistingPayments({}))
        .finally(() => setLoadingPayments(false));
    } else {
      setExistingPayments({});
    }
  }, [open, form.householderId, form.year, editData]);

  useEffect(() => {
    if (open) {
      if (editData) {
        const year = new Date(editData.allMonths?.[0] || editData.paymentMonth || new Date()).getFullYear();
        setForm({
          householderId: editData.householderId || '',
          amount: (editData.amount || 0) / (editData.monthCount || 1),
          notes: editData.notes || '',
          year: year,
          paymentMethodId: editData.paymentMethodId || ''
        });
        const selected = new Set();
        (editData.allMonths || (editData.paymentMonth ? [editData.paymentMonth] : [])).forEach(mStr => {
           if (mStr) selected.add(new Date(mStr).getMonth() + 1);
        });
        setSelectedMonths(selected);
      } else {
        setForm({ householderId: '', amount: 0, notes: '', year: new Date().getFullYear(), paymentMethodId: '' });
        setSelectedMonths(new Set());
      }
      setProofFile(null);
      setErrors({});
      axios.get('/api/householders').then(res => setHouseholders(res.data.data || res.data)).catch(() => {});
      axios.get('/api/payments/methods').then(res => setPaymentMethods(res.data)).catch(() => {});
    }
  }, [open, editData]);

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
        paymentMethodId: form.paymentMethodId || null
      };
      
      let batchId;
      if (editData) {
        const res = await axios.put(`/api/payments/${editData.id}`, payload);
        batchId = res.data?.batchId;
      } else {
        const res = await axios.post('/api/payments', payload);
        batchId = res.data?.batchId;
      }
      
      if (proofFile && batchId) {
        const formData = new FormData();
        formData.append('file', proofFile);
        await axios.post(`/api/payments/${batchId}/proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      onSaved(); onClose();
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Failed to save payment.' });
    } finally { setLoading(false); }
  };

  const totalAmount = form.amount * selectedMonths.size;

  const selectedResident = householders.find(h => h.id === form.householderId);
  const filteredHouseholders = householders.filter(h => {
    const term = searchQuery.toLowerCase();
    const name = h.fullname?.toLowerCase() || '';
    const unit = (h.unit?.unitNumber || h.unit_number || '').toLowerCase();
    const block = (h.block?.name || '').toLowerCase();
    return name.includes(term) || unit.includes(term) || block.includes(term);
  });

  return (
    <Modal open={open} onClose={onClose} title={editData ? "Edit Payment" : "Record Payment"} subtitle="Select a householder to continue" size="lg">
      <div className="space-y-6 -m-2">
        {errors.general && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg mx-2">{errors.general}</div>}
        {editData && editData.status === 'rejected' && editData.rejectionReason && (
          <div className="p-4 mx-2 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-start gap-3">
            <span className="material-icons text-rose-500 text-xl">error_outline</span>
            <div>
              <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">Payment Rejected</h4>
              <p className="text-sm text-rose-600 dark:text-rose-500 mt-1">{editData.rejectionReason}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {/* Householder */}
          <div ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">HOUSEHOLDER <span className="text-rose-500">*</span></label>
            <div className="relative">
               <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
               <input 
                 type="text"
                 placeholder="Search householder name or unit..."
                 value={dropdownOpen ? searchQuery : (selectedResident ? `${selectedResident.fullname} — ${selectedResident.block?.name || ''} Unit ${selectedResident.unit?.unitNumber || selectedResident.unit_number || '?'}` : '')}
                 disabled={!!editData}
                 onChange={e => {
                   setSearchQuery(e.target.value);
                   setDropdownOpen(true);
                 }}
                 onFocus={() => { if (!editData) setDropdownOpen(true); }}
                 className={`w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-500 ${!!editData ? 'opacity-70 cursor-not-allowed' : ''}`}
               />
               <span className={`material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
               
               {dropdownOpen && (
                 <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden py-1">
                   {filteredHouseholders.length === 0 ? (
                     <div className="p-4 text-center text-sm text-slate-500">No householder found.</div>
                   ) : (
                     filteredHouseholders.map(h => (
                       <div key={h.id} 
                         onClick={() => {
                           const amount = h.monthlyFee || 0;
                           setForm(f => ({ ...f, householderId: h.id, amount }));
                           setDropdownOpen(false);
                           setSearchQuery('');
                         }}
                         className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors flex items-center ${form.householderId === h.id ? 'bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                         <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis mr-2">{h.fullname}</span>
                         <span className="text-slate-500 dark:text-slate-400 text-[13px] whitespace-nowrap">— {h.block?.name || ''} Unit {h.unit?.unitNumber || h.unit_number || '?'}</span>
                       </div>
                     ))
                   )}
                 </div>
               )}
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">YEAR</label>
            <div className="relative">
               <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
               <select disabled={!!editData} value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className={`w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-white appearance-none outline-none focus:border-primary transition-all ${!!editData ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                 {[0, 1, 2].map(i => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
               </select>
               <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        {/* Months */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-6 px-2 relative">
          {loadingPayments && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center rounded-xl">
              <span className="material-icons text-primary animate-spin">autorenew</span>
            </div>
          )}
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">SELECT MONTHS ({form.year}) <span className="text-slate-400 dark:text-slate-500 normal-case lowercase font-medium tracking-normal">— select at least one</span></p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {MONTH_NAMES.map((name, idx) => {
              const m = idx + 1;
              const status = existingPayments[m];
              const isApproved = status === 'approved';
              const isPending = status === 'pending';
              const isLocked = isApproved || (isPending && !editData);
              const sel = selectedMonths.has(m);
              
              let statusLabel = sel ? 'Selected' : 'Unpaid';
              let btnClass = sel ? 'border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 cursor-pointer';
              let textClass = sel ? 'text-primary' : 'text-slate-400';
              
              if (isApproved) {
                statusLabel = 'Approved';
                btnClass = 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800/50 cursor-not-allowed opacity-70';
                textClass = 'text-emerald-500';
              } else if (isPending && !sel && !editData) {
                statusLabel = 'Pending';
                btnClass = 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/50 cursor-not-allowed opacity-70';
                textClass = 'text-amber-500';
              } else if (status === 'rejected' && !sel) {
                statusLabel = 'Rejected';
                btnClass = 'border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800/50 cursor-pointer hover:border-primary/50';
                textClass = 'text-rose-500';
              }

              return (
                <button key={m} onClick={() => !isLocked && toggleMonth(m)} type="button" disabled={isLocked}
                  className={`py-3 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${btnClass}`}>
                  <span className={`text-xs font-bold ${isLocked ? textClass : 'text-slate-700 dark:text-slate-300'}`}>{name.substring(0, 3)}</span>
                  <span className={`text-[10px] font-bold uppercase mt-1 tracking-wider ${textClass}`}>{statusLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method & Status and Proof & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 border-t border-slate-100 dark:border-white/5 pt-6 px-2">
          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">PAYMENT METHOD</label>
            <div className="relative">
               <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">account_balance</span>
               <select value={form.paymentMethodId} onChange={e => setForm(f => ({ ...f, paymentMethodId: e.target.value }))} className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-white appearance-none outline-none focus:border-primary transition-all cursor-pointer">
                 <option value="">— None —</option>
                 {paymentMethods.map(m => (
                   <option key={m.id} value={m.id}>{m.name}</option>
                 ))}
               </select>
               <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Proof of Payment */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">PROOF OF PAYMENT <span className="text-slate-400 dark:text-slate-500 normal-case lowercase tracking-normal font-medium">optional</span></label>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setProofFile(e.target.files?.[0] || null)} />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors h-[104px] overflow-hidden relative group">
              {proofFile ? (
                <>
                  <span className="material-icons text-emerald-500 mb-1.5 text-[24px]">check_circle</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-full px-2">{proofFile.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setProofFile(null); fileInputRef.current && (fileInputRef.current.value = ''); }} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1">
                    <span className="material-icons text-sm">close</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="material-icons text-amber-500 mb-1.5 text-[24px]">cloud_upload</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to upload receipt</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">PDF, JPG, PNG (MAX 5MB)</span>
                </>
              )}
            </div>
          </div>

          {/* Status Info */}
          <div className="flex flex-col">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">STATUS</label>
            <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-200 dark:bg-[#1B2236]/30 dark:border-amber-500/20 rounded-xl flex-1">
              <span className="material-icons text-amber-500 text-[20px] mt-0.5">hourglass_empty</span>
              <div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-500">Pending (awaiting review)</p>
                <p className="text-[11px] text-amber-600/70 dark:text-amber-500/70 font-medium mt-1 leading-relaxed">All payments require approval by an admin or treasurer.</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">NOTES <span className="text-slate-400 dark:text-slate-500 normal-case lowercase tracking-normal font-medium">optional</span></label>
            <textarea placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-white appearance-none outline-none focus:border-primary resize-none flex-1 transition-all min-h-[116px]"></textarea>
          </div>
        </div>

        {/* Amount */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-6 px-2">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">AMOUNT PER MONTH (RP) <span className="text-rose-500">*</span></label>
          <div className="relative">
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">payments</span>
            <input 
              type="text" 
              disabled 
              value={form.householderId ? form.amount.toLocaleString('id-ID') : ""} 
              placeholder="Select a resident first" 
              className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-[#1B2236]/40 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed transition-all" 
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">Auto-filled from resident's current monthly fee.</p>
        </div>

        {/* Footer */}
        {editData && (
          <p className="text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 mx-2 rounded-lg mt-2">
            <span className="font-bold">Note:</span> Saving changes will reset the payment status to <b>Pending</b> for re-review.
          </p>
        )}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5 px-2 mt-4">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading || !form.householderId || !form.amount || selectedMonths.size === 0} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            <span className="material-icons text-sm">verified</span> {loading ? 'Saving...' : (editData ? 'Save Changes' : 'Confirm Payment')}
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
  const [blocks, setBlocks] = useState([]);
  const [filters, setFilters] = useState({
    search: '', status: '', block_id: '', month: '',
    recorded_month: '', recorded_year: '', page: 1
  });
  const [selected, setSelected] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, item: null, loading: false });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Build params, omitting empty values
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.block_id) params.block_id = filters.block_id;
      if (filters.month) params.month = filters.month;
      if (filters.recorded_month) params.recorded_month = filters.recorded_month;
      if (filters.recorded_year) params.recorded_year = filters.recorded_year;

      const [pRes, sRes] = await Promise.all([
        axios.get('/api/payments', { params }),
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

  // Fetch blocks for filter
  useEffect(() => {
    axios.get('/api/payments/blocks').then(res => setBlocks(res.data || [])).catch(() => {});
  }, []);

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const clearFilters = () => setFilters({
    search: '', status: '', block_id: '', month: '',
    recorded_month: '', recorded_year: '', page: 1
  });

  const allChecked = data.length > 0 && selected.length === data.length;
  const toggleAll = () => setSelected(allChecked ? [] : data.map(p => p.id));
  const toggleOne = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const doDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try { await axios.delete(`/api/payments/${confirm.item.id}`); fetchData(); setConfirm({ open: false, item: null, loading: false }); }
    catch { setConfirm(c => ({ ...c, loading: false })); }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i)
  }));

  const monthOptions = MONTH_NAMES.map((name, idx) => ({
    value: String(idx + 1),
    label: name
  }));

  const statCards = [
    { label: 'Total Payments', value: stats?.total ?? 0, icon: 'receipt_long', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Pending Review', value: stats?.pending ?? 0, icon: 'pending_actions', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: 'check_circle', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: 'cancel', iconBg: 'bg-rose-100 dark:bg-rose-500/10', iconColor: 'text-rose-500' },
  ];

  return (
    <AdminLayout title="Payments">
      <PaymentModal open={addModal || !!editItem} onClose={() => { setAddModal(false); setEditItem(null); }} editData={editItem} onSaved={fetchData} />
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
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
            <span className="material-icons text-sm">add</span> Record Payment
          </button>
        }
      />

      {/* Enhanced Filter Bar matching Laravel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
          {/* Search */}
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
            <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder="Search householder name or unit…" />
          </div>

          {/* Block filter */}
          <div className="w-full sm:w-auto sm:min-w-[130px]">
            <SelectFilter value={filters.block_id} onChange={v => setFilter('block_id', v)}
              options={blocks.map(b => ({ value: b.id, label: b.name }))} placeholder="All Blocks" />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-auto sm:min-w-[130px]">
            <SelectFilter value={filters.status} onChange={v => setFilter('status', v)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]} placeholder="All Status" />
          </div>

          {/* Payment Month filter */}
          <div className="w-full sm:w-auto sm:min-w-[130px]">
            <SelectFilter value={filters.month} onChange={v => setFilter('month', v)}
              options={monthOptions.map(m => ({
                value: `${filters.recorded_year || currentYear}-${String(m.value).padStart(2, '0')}`,
                label: m.label
              }))} placeholder="All Months" />
          </div>

          {/* Separator label */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center px-1 w-full sm:w-auto mt-2 sm:mt-0">
            Recorded Date
          </div>

          {/* Recorded Month filter */}
          <div className="w-full sm:w-auto sm:min-w-[130px]">
            <SelectFilter value={filters.recorded_month} onChange={v => setFilter('recorded_month', v)}
              options={monthOptions} placeholder="All Months" />
          </div>

          {/* Recorded Year filter */}
          <div className="w-full sm:w-auto sm:min-w-[100px]">
            <SelectFilter value={filters.recorded_year} onChange={v => setFilter('recorded_year', v)}
              options={yearOptions} placeholder="All Years" />
          </div>

          {/* Clear */}
          <button onClick={clearFilters}
            className="flex items-center justify-center gap-1 px-3 py-3 sm:py-2 text-sm text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer w-full sm:w-auto">
            <span className="material-icons text-sm">close</span> Clear
          </button>
        </div>
      </div>

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
              <Th>Householder</Th>
              <Th>Block / Unit</Th>
              <Th>Month(s)</Th>
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
              const isPending = status === 'pending';
              const isRejected = status === 'rejected';
              const monthCount = p.monthCount || (p.allMonths?.length) || 1;
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
                    <span className="text-slate-400 font-normal ml-1">· {p.unit || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {p.allMonths && p.allMonths.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.allMonths.slice(0, 3).map(m => MONTH_NAMES[new Date(m).getMonth()]?.substring(0, 3)).join(', ')}
                          {p.allMonths.length > 3 && ', etc'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{new Date(p.allMonths[0]).getFullYear()}</span>
                          {monthCount > 1 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">{monthCount} months</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.paymentMonth ? MONTH_NAMES[new Date(p.paymentMonth).getMonth()]?.substring(0, 3) : '—'}
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
                      {/* Edit button — always visible */}
                      <button onClick={() => setEditItem(p)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <span className="material-icons text-lg">edit</span>
                      </button>

                      {/* Review button for pending payments */}
                      {isPending && (
                        <button onClick={() => setReviewItem(p)}
                          className="text-amber-600 border border-amber-500/40 bg-amber-50/60 hover:bg-amber-500 hover:text-white dark:bg-amber-500/10 dark:text-amber-400 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                          Review
                        </button>
                      )}

                      {/* Approved label */}
                      {isApproved && (
                        <span className="text-xs text-emerald-500 px-2 flex items-center gap-1">
                          <span className="material-icons text-[14px]">check_circle</span>
                          Approved {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      )}

                      {/* Rejected label */}
                      {isRejected && (
                        <span className="text-xs text-rose-400 px-2 flex items-center gap-1" title={p.rejectionReason}>
                          <span className="material-icons text-[14px]">cancel</span>
                          Rejected
                        </span>
                      )}

                      {/* Delete button */}
                      <button onClick={() => setConfirm({ open: true, item: p, loading: false })}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer" title="Delete">
                        <span className="material-icons text-lg">delete_outline</span>
                      </button>
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

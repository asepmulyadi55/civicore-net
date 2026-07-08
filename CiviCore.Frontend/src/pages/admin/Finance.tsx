// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, TableWrapper, Th, EmptyState, Pagination, FilterBar, SelectFilter, SearchInput, Modal, ConfirmModal, FormInput, FormSelect } from '../../admin/components/ui';
import { usePermissions } from '../../admin/PermissionsContext';
import { formatApiErrors } from '../../utils/formatErrors';

type FinanceTab = 'dashboard' | 'transactions' | 'reports';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface PaginationMeta { current_page: number; last_page: number; from: number; to: number; total: number; }

interface FinanceStats {
  balance: number;
  period_income: number;
  period_expense: number;
  pending_payments: number;
  trends: { month: string; income: number; expense: number }[];
  pending_approvals: any[];
}

function TransactionModal({ open, onClose, onSaved, initialData }: { open: boolean; onClose: () => void; onSaved: () => void; initialData?: Transaction | null }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ type: 'income', category: '', amount: '', description: '', date: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (initialData) {
      setForm({ 
        type: initialData.type, 
        category: initialData.category, 
        amount: initialData.amount.toString(), 
        description: initialData.description, 
        date: initialData.date.slice(0, 10) 
      });
    } else {
      setForm({ type: 'income', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); 
    }
    setErrors({}); 
  }, [open, initialData]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.category) errs.category = t('finance.error_category_required', 'Category is required.');
    if (!form.amount || Number(form.amount) <= 0) errs.amount = t('finance.error_amount_required', 'Amount must be greater than 0.');
    if (!form.date) errs.date = t('finance.error_date_required', 'Date is required.');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true); setErrors({});
    try {
      if (initialData) {
        await axios.put(`/api/finance/transactions/${initialData.id}`, { ...form, amount: Number(form.amount) });
      } else {
        await axios.post('/api/finance/transactions', { ...form, amount: Number(form.amount) });
      }
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(formatApiErrors(err));
    } finally { setLoading(false); }
  };

  const CATEGORY_OPTIONS = [
    { value: 'monthly_fee', label: t('finance.cat_monthly_fee') }, { value: 'donation', label: t('finance.cat_donation') },
    { value: 'maintenance', label: t('finance.cat_maintenance') }, { value: 'utilities', label: t('finance.cat_utilities') },
    { value: 'event', label: t('finance.cat_event') }, { value: 'other', label: t('finance.cat_other') },
  ];

  return (
    <Modal open={open} onClose={onClose} title={initialData ? t('finance.modal_edit_title', 'Edit Transaction') : t('finance.modal_record_title')} size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-2 gap-3">
          {(['income', 'expense'] as const).map((t_type) => (
            <button key={t_type} type="button" onClick={() => setForm((p) => ({ ...p, type: t_type }))}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all capitalize cursor-pointer ${form.type === t_type ? (t_type === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400') : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}>
              <span className="material-icons text-sm mr-1 align-text-bottom">{t_type === 'income' ? 'trending_up' : 'trending_down'}</span>
              {t(`finance.${t_type}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect label={t('finance.modal_cat')} id="ft-cat" value={form.category} onChange={set('category')} options={CATEGORY_OPTIONS} error={errors.category} required placeholder={t('finance.modal_cat_placeholder')} />
          <FormInput label={t('finance.modal_amount')} id="ft-amt" type="number" value={form.amount} onChange={set('amount')} error={errors.amount} required placeholder="0" />
        </div>
        <div>
          <label htmlFor="ft-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('finance.modal_date')} <span className="text-rose-500">*</span></label>
          <input id="ft-date" type="date" value={form.date} onChange={set('date')}
            className="w-full bg-slate-50 dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white outline-none focus:border-primary transition-all cursor-pointer dark:[color-scheme:dark]" />
        </div>
        <FormInput label={t('finance.modal_desc')} id="ft-desc" value={form.description} onChange={set('description')} error={errors.description} placeholder={t('finance.modal_desc_placeholder')} />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('finance.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('finance.btn_saving') : t('finance.btn_record_transaction')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GenerateReportModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      await axios.post('/api/finance/reports/generate', { month: Number(form.month), year: Number(form.year) });
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Generate failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" size="sm">
      <div className="space-y-4 min-h-[250px]">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Month"
            id="report-month"
            value={String(form.month)}
            onChange={(e) => setForm(p => ({ ...p, month: Number(e.target.value) }))}
            options={months.map((m, i) => ({ value: String(i + 1), label: m }))}
          />
          <FormSelect
            label="Year"
            id="report-year"
            value={String(form.year)}
            onChange={(e) => setForm(p => ({ ...p, year: Number(e.target.value) }))}
            options={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => ({ value: String(y), label: String(y) }))}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function OpeningBalanceModal({ open, onClose, onSaved, initialData }: { open: boolean; onClose: () => void; onSaved: () => void; initialData: any }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initialData) {
      setAmount(initialData.openingBalance || 0);
      setError('');
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!initialData) return;
    setLoading(true);
    setError('');
    try {
      await axios.patch(`/api/finance/reports/${initialData.id}/opening-balance`, { openingBalance: amount });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update opening balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('finance.fin_opening_balance', 'Opening Balance')} size="sm">
      <div className="space-y-4">
        {error && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{error}</div>}
        <FormInput
          label={t('finance.amount', 'Amount')}
          id="opening-balance-amount"
          type="number"
          value={String(amount)}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
        />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('finance.btn_cancel', 'Cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('finance.saving', 'Saving...') : t('finance.btn_save', 'Save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RejectReportModal({ open, onClose, onSaved, initialData }: { open: boolean; onClose: () => void; onSaved: () => void; initialData: any }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!initialData || !reason.trim()) {
      setError(t('finance.err_reason_required', 'Reason is required'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.patch(`/api/finance/reports/${initialData.id}/reject`, { reason });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('finance.reject_report', 'Reject Report')} size="sm">
      <div className="space-y-4">
        {error && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{error}</div>}
        <FormInput
          label={t('finance.reject_reason', 'Reason for rejection')}
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('finance.btn_cancel', 'Cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-rose-500 hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-rose-500/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('finance.saving', 'Saving...') : t('finance.btn_reject', 'Reject')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Finance() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', category: '', search: '', month: '', year: '', page: 1 });
  const [dashboardFilters, setDashboardFilters] = useState({ month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() });
  const [reportYear, setReportYear] = useState('');
  const [modal, setModal] = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [openingBalanceData, setOpeningBalanceData] = useState<any>(null);
  const [rejectData, setRejectData] = useState<any>(null);

  const [confirm, setConfirm] = useState<{ open: boolean; id: number | null; loading: boolean }>({ open: false, id: null, loading: false });

  const handleDeleteTransaction = (id: number) => {
    setConfirm({ open: true, id, loading: false });
  };

  const doDelete = async () => {
    if (!confirm.id) return;
    setConfirm(prev => ({ ...prev, loading: true }));
    try {
      await axios.delete(`/api/finance/transactions/${confirm.id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setConfirm({ open: false, id: null, loading: false });
    }
  };

  const [confirmReport, setConfirmReport] = useState<{ open: boolean; id: string | null; loading: boolean }>({ open: false, id: null, loading: false });

  const handleRegenerateReport = async (month: number, year: number) => {
    try {
      await axios.post('/api/finance/reports/generate', { month, year });
      fetchData();
    } catch (err) {
      alert('Failed to regenerate report.');
    }
  };

  const [confirmSubmit, setConfirmSubmit] = useState<{ open: boolean; id: string | null; loading: boolean }>({ open: false, id: null, loading: false });
  const [confirmApprove, setConfirmApprove] = useState<{ open: boolean; id: string | null; loading: boolean }>({ open: false, id: null, loading: false });

  const handleSubmitReport = async () => {
    if (!confirmSubmit.id) return;
    setConfirmSubmit(prev => ({ ...prev, loading: true }));
    try {
      await axios.patch(`/api/finance/reports/${confirmSubmit.id}/submit`);
      fetchData();
    } catch (err) {
      alert('Failed to submit report.');
    } finally {
      setConfirmSubmit({ open: false, id: null, loading: false });
    }
  };

  const handleApproveReport = async () => {
    if (!confirmApprove.id) return;
    setConfirmApprove(prev => ({ ...prev, loading: true }));
    try {
      await axios.patch(`/api/finance/reports/${confirmApprove.id}/approve`);
      fetchData();
    } catch (err) {
      alert('Failed to approve report.');
    } finally {
      setConfirmApprove({ open: false, id: null, loading: false });
    }
  };

  const doDeleteReport = async () => {
    if (!confirmReport.id) return;
    setConfirmReport(prev => ({ ...prev, loading: true }));
    try {
      await axios.delete(`/api/finance/reports/${confirmReport.id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setConfirmReport({ open: false, id: null, loading: false });
    }
  };

  const setFilter = (k: string, v: string | number) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes, rRes] = await Promise.all([
        axios.get('/api/finance/stats', { params: dashboardFilters }).catch(() => ({ data: {} })),
        axios.get('/api/finance/transactions', { params: activeTab === 'dashboard' ? { page: 1 } : filters }).catch(() => ({ data: [] })),
        axios.get('/api/finance/reports', { params: { year: reportYear } }).catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data);
      const t = tRes.data;
      setTransactions(Array.isArray(t) ? t : (t.data || []));
      setReports(rRes.data);
      setMeta(t.meta || null);
    } catch { setTransactions([]); } finally { setLoading(false); }
  }, [filters, dashboardFilters, reportYear, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const TABS: { key: FinanceTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: t('finance.tab_dashboard'), icon: 'dashboard' },
    { key: 'transactions', label: t('finance.tab_transactions'), icon: 'receipt_long' },
    { key: 'reports', label: t('finance.tab_reports'), icon: 'summarize' },
  ];

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = dashboardFilters.month ? t(`overview.months.${months[parseInt(dashboardFilters.month) - 1]}`) : "";
  const currentYear = dashboardFilters.year;

  return (
    <AdminLayout title={t('finance.title')}>
      <TransactionModal open={modal} onClose={() => { setModal(false); setEditingTransaction(null); }} onSaved={fetchData} initialData={editingTransaction} />
      <GenerateReportModal open={generateModal} onClose={() => setGenerateModal(false)} onSaved={fetchData} />
      <OpeningBalanceModal open={!!openingBalanceData} onClose={() => setOpeningBalanceData(null)} onSaved={fetchData} initialData={openingBalanceData} />
      <RejectReportModal open={!!rejectData} onClose={() => setRejectData(null)} onSaved={fetchData} initialData={rejectData} />
      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={doDelete} loading={confirm.loading} icon="delete_outline"
        title={t('finance.confirm_delete_title', 'Delete Transaction')} message={t('finance.confirm_delete_msg', 'Are you sure you want to delete this transaction?')}
        confirmLabel={t('finance.btn_delete', 'Delete')} />
      <ConfirmModal open={confirmReport.open} onClose={() => setConfirmReport({ open: false, id: null, loading: false })}
        onConfirm={doDeleteReport} loading={confirmReport.loading} icon="delete_outline"
        title={t('finance.confirm_delete_report_title', 'Delete Report')} message={t('finance.confirm_delete_report_msg', 'Are you sure you want to delete this report?')}
        confirmLabel={t('finance.btn_delete', 'Delete')} />
      <ConfirmModal open={confirmSubmit.open} onClose={() => setConfirmSubmit({ open: false, id: null, loading: false })}
        onConfirm={handleSubmitReport} loading={confirmSubmit.loading} icon="send"
        confirmClass="bg-indigo-600 hover:bg-indigo-700 text-white"
        title={t('finance.confirm_submit_report_title', 'Submit Report')} message={t('finance.confirm_submit_report_msg', 'Are you sure you want to submit this report for approval?')}
        confirmLabel={t('finance.btn_submit', 'Submit')} />
      <ConfirmModal open={confirmApprove.open} onClose={() => setConfirmApprove({ open: false, id: null, loading: false })}
        onConfirm={handleApproveReport} loading={confirmApprove.loading} icon="check_circle"
        confirmClass="bg-emerald-600 hover:bg-emerald-700 text-white"
        title={t('finance.confirm_approve_report_title', 'Approve Report')} message={t('finance.confirm_approve_report_msg', 'Are you sure you want to approve this report?')}
        confirmLabel={t('finance.btn_approve', 'Approve')} />

      <PageHeader
        title={t('finance.title')}
        subtitle={t('finance.subtitle')}
        actions={
          can('finance.create') && (
            <div className="flex gap-2">
              {activeTab === 'reports' && (
                <button onClick={() => setGenerateModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
                  <span className="material-icons text-sm">add_chart</span> Generate Report
                </button>
              )}
              <button onClick={() => setModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
                <span className="material-icons text-sm">add</span> {t('finance.btn_record_transaction')}
              </button>
            </div>
          )
        }
      />

      {/* Tab Nav */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <nav className="flex border-b border-slate-100 dark:border-slate-800 min-w-max">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${activeTab === t.key ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                <span className="material-icons text-[20px]">{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-slate-50 dark:bg-[#1B2236] p-3 rounded-lg border border-slate-200 dark:border-white/10">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-2 mr-2">{t('finance.viewing_period')}</span>
            <SelectFilter 
              value={dashboardFilters.month} 
              onChange={(v) => setDashboardFilters(p => ({ ...p, month: String(v) }))} 
              options={months.map((m, i) => ({ value: String(i+1), label: t(`overview.months.${m}`) }))} 
              placeholder={t('finance.select_month')} 
            />
            <SelectFilter 
              value={dashboardFilters.year} 
              onChange={(v) => setDashboardFilters(p => ({ ...p, year: String(v) }))} 
              options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
              placeholder={t('finance.all_years')} 
            />
            <button onClick={() => setDashboardFilters({ month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> {t('finance.btn_clear')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#242C44] rounded-xl p-5 border border-slate-200 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-emerald-400"><span className="material-icons">account_balance_wallet</span></div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t('finance.current_balance')}</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Rp {(stats?.balance || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">{t('finance.from_last_approved')}</p>
            </div>
            
            <div className="bg-white dark:bg-[#242C44] rounded-xl p-5 border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-emerald-400"><span className="material-icons text-[18px]">trending_up</span></div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t('finance.monthly_income')}</p>
              <h3 className="text-2xl font-bold text-emerald-400 mb-1">Rp {(stats?.period_income || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">{currentMonthName} {currentYear}</p>
            </div>
            
            <div className="bg-white dark:bg-[#242C44] rounded-xl p-5 border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-rose-400"><span className="material-icons text-[18px]">trending_down</span></div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t('finance.monthly_expense')}</p>
              <h3 className="text-2xl font-bold text-rose-400 mb-1">Rp {(stats?.period_expense || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">{currentMonthName} {currentYear}</p>
            </div>
            
            <div className="bg-white dark:bg-[#242C44] rounded-xl p-5 border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-amber-400"><span className="material-icons">pending_actions</span></div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t('finance.pending_payments')}</p>
              <h3 className="text-2xl font-bold text-amber-400 mb-1">Rp {(stats?.pending_payments || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">{t('finance.payments_awaiting', { count: 0 })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#242C44] rounded-xl p-6 border border-slate-200 dark:border-white/5 flex flex-col h-[300px]">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-6">{t('finance.monthly_trend')}</h3>
              <div className="flex-1 flex items-end justify-between gap-4 px-2 relative border-b border-slate-200 dark:border-white/10 pb-2">
                {stats?.trends?.map((tr: any, i: number) => {
                  const maxVal = Math.max(...(stats.trends.map((x: any) => Math.max(x.income, x.expense)) as number[]), 1);
                  const inH = (tr.income / maxVal) * 100;
                  const exH = (tr.expense / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex items-end justify-center gap-1 h-[180px]">
                        <div className="w-1/2 max-w-[12px] bg-emerald-400 rounded-t-sm transition-all duration-500" style={{ height: `${inH}%` }} title={`Income: Rp ${tr.income.toLocaleString()}`}></div>
                        <div className="w-1/2 max-w-[12px] bg-rose-400 rounded-t-sm transition-all duration-500" style={{ height: `${exH}%` }} title={`Expense: Rp ${tr.expense.toLocaleString()}`}></div>
                      </div>
                      <span className="text-[10px] text-slate-400">{tr.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 px-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> {t('finance.income')}</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded-sm bg-rose-400"></div> {t('finance.expense')}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#242C44] rounded-xl p-6 border border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">{t('finance.pending_approvals')}</h3>
              <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
                {t('finance.no_reports_awaiting')}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#242C44] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{t('finance.recent_transactions')}</h3>
              <button onClick={() => setActiveTab('transactions')} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">{t('finance.view_all')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {transactions.slice(0, 5).map(tr => (
                    <tr key={tr.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{new Date(tr.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                      <td className="p-4 text-sm font-medium text-slate-800 dark:text-white">{tr.description}</td>
                      <td className="p-4 text-xs text-slate-400 capitalize">{t(`finance.cat_${tr.category}`)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tr.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                          {t(`finance.${tr.type}`)}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-bold text-right ${tr.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tr.type === 'income' ? '+' : '-'}Rp {tr.amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">{t('finance.no_recent_transactions')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-slate-50 dark:bg-[#1B2236] p-3 rounded-lg border border-slate-200 dark:border-white/10">
            <SelectFilter 
              value={filters.type} 
              onChange={(v) => setFilter('type', v)}
              options={[{ value: 'income', label: t('finance.income') }, { value: 'expense', label: t('finance.expense') }]} 
              placeholder={t('finance.all_types')} 
            />
            <SearchInput 
              value={filters.search} 
              onChange={(v) => setFilter('search', v)} 
              placeholder={t('finance.search_transactions')} 
            />
            <SelectFilter 
              value={filters.month || ''} 
              onChange={(v) => setFilter('month', v)} 
              options={months.map((m, i) => ({ value: String(i+1), label: t(`overview.months.${m}`) }))} 
              placeholder={t('finance.all_months')} 
            />
            <SelectFilter 
              value={filters.year || ''} 
              onChange={(v) => setFilter('year', v)} 
              options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
              placeholder={t('finance.all_years')} 
            />
            <button onClick={() => setFilters({ type: '', category: '', search: '', month: '', year: '', page: 1 })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> {t('finance.btn_clear')}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><span className="material-icons text-emerald-400 text-4xl animate-spin">autorenew</span></div>
          ) : (
            <div className="bg-white dark:bg-[#242C44] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#1B2236] border-b border-slate-200 dark:border-white/10">
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_transaction_date')}</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_description')}</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_category')}</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_type')}</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_amount')}</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">{t('finance.th_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="p-12 text-center"><EmptyState icon="account_balance" title={t('finance.no_transactions_title')} subtitle={t('finance.no_transactions_subtitle')} /></td></tr>
                    ) : transactions.map((tr) => (
                      <tr key={tr.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{new Date(tr.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{tr.description}</p>
                        </td>
                        <td className="p-4 text-xs text-slate-400 capitalize">{t(`finance.cat_${tr.category}`)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider ${tr.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                            {t(`finance.${tr.type}`)}
                          </span>
                        </td>
                        <td className={`p-4 text-sm font-bold ${tr.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tr.type === 'income' ? '+' : '-'}Rp {tr.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-400">
                            {can('finance.edit') && <button onClick={() => { setEditingTransaction(tr); setModal(true); }} className="hover:text-emerald-400 transition-colors cursor-pointer"><span className="material-icons text-[18px]">edit</span></button>}
                            {can('finance.delete') && <button onClick={() => handleDeleteTransaction(tr.id)} className="hover:text-rose-400 transition-colors cursor-pointer"><span className="material-icons text-[18px]">delete</span></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && meta.last_page > 1 && <div className="p-4 border-t border-slate-200 dark:border-white/5 flex justify-center"><Pagination meta={meta} onChange={(p) => { setFilters((f) => ({ ...f, page: p })); fetchData(); }} /></div>}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-slate-50 dark:bg-[#1B2236] p-3 rounded-lg border border-slate-200 dark:border-white/10">
            <SelectFilter 
              value={reportYear} 
              onChange={(v) => setReportYear(String(v))} 
              options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
              placeholder="All Years" 
            />
            {reportYear && (
              <button onClick={() => setReportYear('')}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <span className="material-icons text-sm">close</span> {t('finance.btn_clear')}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-[#242C44] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1B2236] border-b border-slate-200 dark:border-white/10">
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_period')}</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_opening_balance')}</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_total_income')}</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_total_expense')}</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_closing_balance')}</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('finance.th_status')}</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">{t('finance.th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        <div className="mb-2">{t('finance.no_reports_generated')}</div>
                        {can('finance.create') && (
                          <button onClick={() => setGenerateModal(true)} className="inline-flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
                            <span className="material-icons text-[16px]">add_chart</span> Generate Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : reports.map((r: any) => (
                    <tr key={r.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">{new Date(r.periodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                      <td className="p-4 text-sm font-medium text-slate-400">Rp {(r.openingBalance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-bold text-emerald-400">Rp {(r.totalIncome || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-bold text-rose-400">Rp {(r.totalExpense || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">Rp {(r.closingBalance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider ${r.status === 0 ? 'bg-slate-500/20 text-slate-300' : r.status === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {r.status === 0 ? t('finance.status_draft') : r.status === 1 ? t('finance.status_pending') : t('finance.status_approved')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-400">
                          {can('finance.edit') && (r.status === 0 || r.status === 3) && <button onClick={() => handleRegenerateReport(new Date(r.periodStart).getMonth() + 1, new Date(r.periodStart).getFullYear())} className="hover:text-emerald-400 transition-colors cursor-pointer" title="Regenerate"><span className="material-icons text-[18px]">refresh</span></button>}
                          {can('finance.edit') && (r.status === 0 || r.status === 3) && <button onClick={() => setOpeningBalanceData(r)} className="hover:text-amber-400 transition-colors cursor-pointer" title="Edit Opening Balance"><span className="material-icons text-[18px]">edit_note</span></button>}
                          {can('finance.approve') && (r.status === 0 || r.status === 3) && <button onClick={() => setConfirmSubmit({ open: true, id: r.id, loading: false })} className="hover:text-indigo-400 transition-colors cursor-pointer" title="Send for Approval"><span className="material-icons text-[18px]">send</span></button>}
                          {can('finance.approve') && r.status === 1 && <button onClick={() => setConfirmApprove({ open: true, id: r.id, loading: false })} className="hover:text-emerald-400 transition-colors cursor-pointer" title="Approve"><span className="material-icons text-[18px]">check_circle</span></button>}
                          {can('finance.approve') && r.status === 1 && <button onClick={() => setRejectData(r)} className="hover:text-rose-400 transition-colors cursor-pointer" title="Reject"><span className="material-icons text-[18px]">cancel</span></button>}
                          {can('finance.delete') && (r.status === 0 || r.status === 3) && <button onClick={() => setConfirmReport({ open: true, id: r.id, loading: false })} className="hover:text-rose-400 transition-colors cursor-pointer" title="Delete"><span className="material-icons text-[18px]">delete</span></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

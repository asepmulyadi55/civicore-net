// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, TableWrapper, Th, EmptyState, Pagination, FilterBar, SelectFilter, SearchInput, Modal, FormInput, FormSelect } from '../../admin/components/ui';

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

function TransactionModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'income', category: '', amount: '', description: '', date: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm({ type: 'income', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); setErrors({}); }, [open]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErrors({});
    try {
      await axios.post('/api/finance/transactions', { ...form, amount: Number(form.amount) });
      onSaved(); onClose();
    } catch (err: any) {
      setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
    } finally { setLoading(false); }
  };

  const CATEGORY_OPTIONS = [
    { value: 'monthly_fee', label: 'Monthly Fee' }, { value: 'donation', label: 'Donation' },
    { value: 'maintenance', label: 'Maintenance' }, { value: 'utilities', label: 'Utilities' },
    { value: 'event', label: 'Event' }, { value: 'other', label: 'Other' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Record Transaction" size="md">
      <div className="space-y-4">
        {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
        <div className="grid grid-cols-2 gap-3">
          {(['income', 'expense'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, type: t }))}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all capitalize cursor-pointer ${form.type === t ? (t === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400') : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}>
              <span className="material-icons text-sm mr-1 align-text-bottom">{t === 'income' ? 'trending_up' : 'trending_down'}</span>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect label="Category" id="ft-cat" value={form.category} onChange={set('category')} options={CATEGORY_OPTIONS} error={errors.category} required placeholder="Select Category" />
          <FormInput label="Amount (Rp)" id="ft-amt" type="number" value={form.amount} onChange={set('amount')} error={errors.amount} required placeholder="0" />
        </div>
        <div>
          <label htmlFor="ft-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date <span className="text-rose-500">*</span></label>
          <input id="ft-date" type="date" value={form.date} onChange={set('date')}
            className="w-full bg-slate-50 dark:bg-[#1B2236] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white outline-none focus:border-primary transition-all cursor-pointer dark:[color-scheme:dark]" />
        </div>
        <FormInput label="Description" id="ft-desc" value={form.description} onChange={set('description')} error={errors.description} placeholder="e.g. Iuran bulanan RT" />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : 'Record Transaction'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Finance() {
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
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'transactions', label: 'Transactions', icon: 'receipt_long' },
    { key: 'reports', label: 'Reports', icon: 'summarize' },
  ];

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = dashboardFilters.month ? months[parseInt(dashboardFilters.month) - 1] : "";
  const currentYear = dashboardFilters.year;

  return (
    <AdminLayout title="Finance">
      <TransactionModal open={modal} onClose={() => setModal(false)} onSaved={fetchData} />

      <PageHeader
        title="Finance"
        subtitle="Income, expenses, and financial reporting"
        actions={
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
            <span className="material-icons text-sm">add</span> Record Transaction
          </button>
        }
      />

      {/* Tab Nav */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <nav className="flex border-b border-slate-100 dark:border-slate-800">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}>
              <span className="material-icons text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-[#1B2236] p-3 rounded-lg border border-white/10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2 mr-2">Viewing Period</span>
            <SelectFilter 
              value={dashboardFilters.month} 
              onChange={(v) => setDashboardFilters(p => ({ ...p, month: String(v) }))} 
              options={months.map((m, i) => ({ value: String(i+1), label: m }))} 
              placeholder="Select Month" 
            />
            <SelectFilter 
              value={dashboardFilters.year} 
              onChange={(v) => setDashboardFilters(p => ({ ...p, year: String(v) }))} 
              options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
              placeholder="All Years" 
            />
            <button onClick={() => setDashboardFilters({ month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#242C44] rounded-xl p-5 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-emerald-400"><span className="material-icons">account_balance_wallet</span></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Current Balance</p>
              <h3 className="text-2xl font-bold text-white mb-1">Rp {(stats?.balance || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">From last approved report</p>
            </div>
            
            <div className="bg-[#242C44] rounded-xl p-5 border border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-emerald-400"><span className="material-icons text-[18px]">trending_up</span></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Monthly Income</p>
              <h3 className="text-2xl font-bold text-emerald-400 mb-1">Rp {(stats?.period_income || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">{currentMonthName} {currentYear}</p>
            </div>
            
            <div className="bg-[#242C44] rounded-xl p-5 border border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-rose-400"><span className="material-icons text-[18px]">trending_down</span></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Monthly Expense</p>
              <h3 className="text-2xl font-bold text-rose-400 mb-1">Rp {(stats?.period_expense || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">{currentMonthName} {currentYear}</p>
            </div>
            
            <div className="bg-[#242C44] rounded-xl p-5 border border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-amber-400"><span className="material-icons">pending_actions</span></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pending Payments</p>
              <h3 className="text-2xl font-bold text-amber-400 mb-1">Rp {(stats?.pending_payments || 0).toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500">0 payments awaiting review</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#242C44] rounded-xl p-6 border border-white/5 flex flex-col h-[300px]">
              <h3 className="text-sm font-semibold text-white mb-6">Monthly Trend (6 Months)</h3>
              <div className="flex-1 flex items-end justify-between gap-4 px-2 relative border-b border-white/10 pb-2">
                {stats?.trends?.map((t: any, i: number) => {
                  const maxVal = Math.max(...(stats.trends.map((x: any) => Math.max(x.income, x.expense)) as number[]), 1);
                  const inH = (t.income / maxVal) * 100;
                  const exH = (t.expense / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex items-end justify-center gap-1 h-[180px]">
                        <div className="w-1/2 max-w-[12px] bg-emerald-400 rounded-t-sm transition-all duration-500" style={{ height: `${inH}%` }} title={`Income: Rp ${t.income.toLocaleString()}`}></div>
                        <div className="w-1/2 max-w-[12px] bg-rose-400 rounded-t-sm transition-all duration-500" style={{ height: `${exH}%` }} title={`Expense: Rp ${t.expense.toLocaleString()}`}></div>
                      </div>
                      <span className="text-[10px] text-slate-400">{t.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 px-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> Income</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded-sm bg-rose-400"></div> Expense</span>
              </div>
            </div>

            <div className="bg-[#242C44] rounded-xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold text-white mb-4">Pending Approvals</h3>
              <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
                No reports awaiting approval.
              </div>
            </div>
          </div>

          <div className="bg-[#242C44] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <button onClick={() => setActiveTab('transactions')} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {transactions.slice(0, 5).map(t => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-xs text-slate-400">{new Date(t.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                      <td className="p-4 text-sm font-medium text-white">{t.description}</td>
                      <td className="p-4 text-xs text-slate-400 capitalize">{t.category.replace('_', ' ')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No recent transactions.</td></tr>
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
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-[#1B2236] p-3 rounded-lg border border-white/10">
            <SelectFilter 
              value={filters.type} 
              onChange={(v) => setFilter('type', v)}
              options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} 
              placeholder="All Types" 
            />
            <SearchInput 
              value={filters.search} 
              onChange={(v) => setFilter('search', v)} 
              placeholder="e.g. Maintenance, Ut..." 
            />
            <SelectFilter 
              value={filters.month || ''} 
              onChange={(v) => setFilter('month', v)} 
              options={months.map((m, i) => ({ value: String(i+1), label: m }))} 
              placeholder="All Months" 
            />
            <SelectFilter 
              value={filters.year || ''} 
              onChange={(v) => setFilter('year', v)} 
              options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
              placeholder="All Years" 
            />
            <button onClick={() => setFilters({ type: '', category: '', search: '', month: '', year: '', page: 1 })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              <span className="material-icons text-sm">close</span> Clear
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><span className="material-icons text-emerald-400 text-4xl animate-spin">autorenew</span></div>
          ) : (
            <div className="bg-[#242C44] rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#1B2236] border-b border-white/10">
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Date</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="p-12 text-center"><EmptyState icon="account_balance" title="No transactions" subtitle="Adjust filters or record your first transaction" /></td></tr>
                    ) : transactions.map((t) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-white">{t.description}</p>
                        </td>
                        <td className="p-4 text-xs text-slate-400 capitalize">{t.category?.replace('_', ' ')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider ${t.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className={`p-4 text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-400">
                             <button className="hover:text-emerald-400 transition-colors cursor-pointer"><span className="material-icons text-[18px]">edit</span></button>
                             <button className="hover:text-rose-400 transition-colors cursor-pointer"><span className="material-icons text-[18px]">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && meta.last_page > 1 && <div className="p-4 border-t border-white/5 flex justify-center"><Pagination meta={meta} onChange={(p) => { setFilters((f) => ({ ...f, page: p })); fetchData(); }} /></div>}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-[#1B2236] p-3 rounded-lg border border-white/10">
            <SelectFilter 
              value={reportYear} 
              onChange={(v) => setReportYear(String(v))} 
              options={Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 2) }, (_, i) => new Date().getFullYear() + 1 - i).filter(y => y >= 2026).map(y => ({ value: String(y), label: String(y) }))} 
              placeholder="All Years" 
            />
            {reportYear && (
              <button onClick={() => setReportYear('')}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <span className="material-icons text-sm">close</span> Clear
              </button>
            )}
          </div>

          <div className="bg-[#242C44] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#1B2236] border-b border-white/10">
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening Balance</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Income</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expense</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Closing Balance</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan={7} className="p-12 text-center text-slate-500">No reports generated yet.</td></tr>
                  ) : reports.map((r: any) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-bold text-white whitespace-nowrap">{new Date(r.periodEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                      <td className="p-4 text-sm font-medium text-slate-400">Rp {(r.openingBalance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-bold text-emerald-400">Rp {(r.totalIncome || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-bold text-rose-400">Rp {(r.totalExpense || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-bold text-white">Rp {(r.closingBalance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider ${r.status === 0 ? 'bg-slate-500/20 text-slate-300' : r.status === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {r.status === 0 ? 'Draft' : r.status === 1 ? 'Pending' : 'Approved'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-400">
                           <button className="hover:text-emerald-400 transition-colors cursor-pointer" title="Regenerate"><span className="material-icons text-[18px]">refresh</span></button>
                           <button className="hover:text-white transition-colors cursor-pointer" title="Details"><span className="material-icons text-[18px]">notes</span></button>
                           <button className="hover:text-indigo-400 transition-colors cursor-pointer" title="Send for Approval"><span className="material-icons text-[18px]">send</span></button>
                           <button className="hover:text-rose-400 transition-colors cursor-pointer" title="Delete"><span className="material-icons text-[18px]">delete</span></button>
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

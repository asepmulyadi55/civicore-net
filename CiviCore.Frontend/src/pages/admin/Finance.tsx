// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, TableWrapper, Th, EmptyState, Pagination, FilterBar, SelectFilter, Modal, FormInput, FormSelect } from '../../admin/components/ui';

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
  total_income: number;
  total_expense: number;
  balance: number;
  this_month_income: number;
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
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all capitalize ${form.type === t ? (t === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400') : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}>
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
            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <FormInput label="Description" id="ft-desc" value={form.description} onChange={set('description')} error={errors.description} placeholder="e.g. Iuran bulanan RT" />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition-all">
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', category: '', page: 1 });
  const [modal, setModal] = useState(false);

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        axios.get('/api/finance/stats').catch(() => ({ data: {} })),
        axios.get('/api/finance/transactions', { params: filters }).catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data);
      const t = tRes.data;
      setTransactions(Array.isArray(t) ? t : (t.data || []));
      setMeta(t.meta || null);
    } catch { setTransactions([]); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const TABS: { key: FinanceTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'transactions', label: 'Transactions', icon: 'receipt_long' },
    { key: 'reports', label: 'Reports', icon: 'summarize' },
  ];

  const statCards = [
    { label: 'Total Income', value: `Rp ${(stats?.total_income || 0).toLocaleString('id-ID')}`, icon: 'trending_up', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Total Expense', value: `Rp ${(stats?.total_expense || 0).toLocaleString('id-ID')}`, icon: 'trending_down', iconBg: 'bg-rose-100 dark:bg-rose-500/10', iconColor: 'text-rose-500' },
    { label: 'Balance', value: `Rp ${(stats?.balance || 0).toLocaleString('id-ID')}`, icon: 'account_balance', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'This Month', value: `Rp ${(stats?.this_month_income || 0).toLocaleString('id-ID')}`, icon: 'calendar_month', iconBg: 'bg-indigo-100 dark:bg-indigo-500/10', iconColor: 'text-indigo-500' },
  ];

  return (
    <AdminLayout title="Finance">
      <TransactionModal open={modal} onClose={() => setModal(false)} onSaved={fetchData} />

      <PageHeader
        title="Finance"
        subtitle="Income, expenses, and financial reporting"
        actions={
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all">
            <span className="material-icons text-sm">add</span> Record Transaction
          </button>
        }
      />

      {/* Tab Nav */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <nav className="flex border-b border-slate-100 dark:border-slate-800">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
              <div className={`p-3 rounded-xl ${s.iconBg}`}><span className={`material-icons ${s.iconColor}`}>{s.icon}</span></div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          <FilterBar>
            <SelectFilter value={filters.type} onChange={(v) => setFilters((p) => ({ ...p, type: v, page: 1 }))}
              options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} placeholder="All Types" />
            <button onClick={() => setFilters({ type: '', category: '', page: 1 })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors">
              <span className="material-icons text-sm">close</span> Clear
            </button>
          </FilterBar>
          {loading ? (
            <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
          ) : (
            <TableWrapper>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <Th>Date</Th><Th>Description</Th><Th>Category</Th><Th>Type</Th><Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon="account_balance" title="No transactions" subtitle="Record your first transaction" /></td></tr>
                ) : transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{t.description}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold capitalize">{t.category?.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-xs font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        <span className="material-icons text-sm">{t.type === 'income' ? 'trending_up' : 'trending_down'}</span>
                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
              {meta && <tfoot><tr><td colSpan={5}><Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></td></tr></tfoot>}
            </TableWrapper>
          )}
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState icon="summarize" title="Financial Reports" subtitle="Detailed financial reports will appear here." />
        </div>
      )}
    </AdminLayout>
  );
}

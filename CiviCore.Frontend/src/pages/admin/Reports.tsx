// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, FilterBar, SelectFilter, EmptyState, TableWrapper, Th, Pagination } from '../../admin/components/ui';

interface ReportRow {
  id: number;
  month: string;
  block_name: string;
  total_units: number;
  paid_units: number;
  unpaid_units: number;
  total_collected: number;
  total_pending: number;
}

interface PaginationMeta {
  current_page: number; last_page: number; from: number; to: number; total: number;
}

interface ReportStats {
  total_collected: number;
  total_pending: number;
  collection_rate: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ month: '', block_id: '', page: 1 });
  const [blocks, setBlocks] = useState<{ id: number; name: string }[]>([]);

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, bRes, sRes] = await Promise.all([
        axios.get('/api/reports', { params: filters }),
        axios.get('/api/blocks?per_page=100').catch(() => ({ data: [] })),
        axios.get('/api/reports/stats', { params: filters }).catch(() => ({ data: {} })),
      ]);
      const r = rRes.data;
      setData(Array.isArray(r) ? r : (r.data || []));
      setMeta(r.meta || null);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
      setStats(sRes.data);
    } catch { setData([]); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k: string, v: string | number) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  // Generate month options (last 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { value, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  });

  const blockOptions = blocks.map((b) => ({ value: String(b.id), label: b.name }));

  const statCards = [
    { label: 'Total Collected', value: `Rp ${(stats?.total_collected || 0).toLocaleString('id-ID')}`, icon: 'payments', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Total Pending', value: `Rp ${(stats?.total_pending || 0).toLocaleString('id-ID')}`, icon: 'pending_actions', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Collection Rate', value: `${stats?.collection_rate?.toFixed(1) || 0}%`, icon: 'percent', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  ];

  return (
    <AdminLayout title="Reports">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${s.iconBg}`}><span className={`material-icons ${s.iconColor}`}>{s.icon}</span></div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <PageHeader title="Monthly Reports" subtitle="Payment collection reports by block and month" />

      <FilterBar>
        <SelectFilter value={filters.month} onChange={(v) => setFilter('month', v)} options={monthOptions} placeholder="All Months" />
        <SelectFilter value={filters.block_id} onChange={(v) => setFilter('block_id', v)} options={blockOptions} placeholder="All Blocks" />
        <button onClick={() => setFilters({ month: '', block_id: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors">
          <span className="material-icons text-sm">close</span> Clear
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-all ml-auto">
          <span className="material-icons text-sm">download</span> Export Excel
        </button>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>Month</Th>
              <Th>Block</Th>
              <Th className="text-right">Total Units</Th>
              <Th className="text-right">Paid</Th>
              <Th className="text-right">Unpaid</Th>
              <Th className="text-right">Collected</Th>
              <Th className="text-right">Pending</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon="summarize" title="No report data" subtitle="Adjust your filters to find report data" /></td></tr>
            ) : data.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {r.month ? new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{r.block_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-right font-medium">{r.total_units}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{r.paid_units}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{r.unpaid_units}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Rp {r.total_collected.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-sm font-bold text-amber-600 dark:text-amber-400 text-right">Rp {r.total_pending.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          {meta && <tfoot><tr><td colSpan={7}><Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></td></tr></tfoot>}
        </TableWrapper>
      )}

      <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} Dwipapuri Community Management. Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long', timeStyle: undefined })}.
        </p>
      </footer>
    </AdminLayout>
  );
}

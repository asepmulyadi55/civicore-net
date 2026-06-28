// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, FilterBar, SearchInput, SelectFilter, EmptyState, TableWrapper, Th, Pagination } from '../../admin/components/ui';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: String(new Date().getFullYear()), block_id: '', search: '', page: 1 });
  const [blocks, setBlocks] = useState([]);

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, bRes, sRes] = await Promise.all([
        axios.get('/api/reports', { params: filters }),
        axios.get('/api/blocks').catch(() => ({ data: [] })),
        axios.get('/api/reports/stats', { params: { year: filters.year, block_id: filters.block_id } }).catch(() => ({ data: {} })),
      ]);
      const r = rRes.data;
      setData(Array.isArray(r) ? r : (r.data || []));
      setMeta(r.meta || null);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
      setStats(sRes.data);
    } catch { setData([]); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k, v) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= 2026; y--) {
    years.push({ value: String(y), label: String(y) });
  }

  const blockOptions = blocks.map((b) => ({ value: String(b.id), label: b.name }));

  const statCards = [
    { label: 'Total Collected', value: `Rp ${(stats?.total_collected || 0).toLocaleString('id-ID')}`, icon: 'payments', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Total Pending', value: `Rp ${(stats?.total_pending || 0).toLocaleString('id-ID')}`, icon: 'pending_actions', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Collection Rate', value: `${stats?.collection_rate ?? 0}%`, icon: 'percent', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  ];

  const statusColor = (s, monthNum) => {
    if (s === 'approved') return 'bg-emerald-500';
    if (s === 'pending') return 'bg-amber-400';
    if (s === 'rejected') return 'bg-rose-500';
    
    const reportYear = parseInt(filters.year, 10);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const isPast = reportYear < currentYear || (reportYear === currentYear && monthNum < currentMonth);
    
    if (isPast) {
      // Past unpaid month (missed/late) - Hollow Red Ring
      return 'border-[3px] border-rose-400/70 dark:border-rose-500/70 bg-rose-50 dark:bg-rose-950/30';
    }
    
    // Future/Current unpaid month - Hollow Gray Ring
    return 'border-[3px] border-slate-200 dark:border-slate-700 bg-transparent';
  };

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

      <PageHeader title="Payment Report" subtitle={`Monthly payment status for year ${filters.year}`} />

      <FilterBar>
        <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder="Search householder or unit…" />
        <SelectFilter value={filters.year} onChange={(v) => setFilter('year', v)} options={years} placeholder="All Years" hidePlaceholderOption={true} />
        <SelectFilter value={filters.block_id} onChange={(v) => setFilter('block_id', v)} options={blockOptions} placeholder="All Blocks" />
        <button onClick={() => setFilters({ year: String(new Date().getFullYear()), block_id: '', search: '', page: 1 })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> Clear
        </button>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <TableWrapper>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Th>Householder</Th>
              <Th>Block / Unit</Th>
              {MONTH_LABELS.map(m => <Th key={m} className="text-center !px-1.5">{m}</Th>)}
              <Th className="text-right">Paid</Th>
              <Th className="text-right">Pending</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr><td colSpan={16}><EmptyState icon="summarize" title="No report data" subtitle="Adjust your filters to find report data" /></td></tr>
            ) : data.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{r.fullname}</td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {r.block_name} {r.unit_number && `/ ${r.unit_number}`}
                </td>
                {(r.months || []).map((m) => (
                  <td key={m.month} className="px-1 py-3 text-center">
                    <div className={`w-5 h-5 rounded-full mx-auto ${statusColor(m.status, m.month)}`} title={`${MONTH_LABELS[m.month - 1]}: ${m.status}`}></div>
                  </td>
                ))}
                <td className="px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                  Rp {(r.total_paid || 0).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400 text-right whitespace-nowrap">
                  Rp {(r.total_pending || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
          {meta && <tfoot><tr><td colSpan={16}><Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></td></tr></tfoot>}
        </TableWrapper>
      )}

      <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} Dwipapuri Community Management. Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}.
        </p>
      </footer>
    </AdminLayout>
  );
}

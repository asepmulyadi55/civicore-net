// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  PageHeader, FilterBar, SearchInput, SelectFilter,
  TableWrapper, Th, EmptyState, Pagination } from
'../../admin/components/ui';

/** Visual weight follows severity: failures and takeovers should stand out from routine sign-ins. */
const EVENT_STYLES = {
  'login.success': { icon: 'login', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'login.failed': { icon: 'error_outline', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  'login.locked_out': { icon: 'lock', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'logout': { icon: 'logout', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'session.kicked': { icon: 'devices', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' }
};

function EventBadge({ event }) {
  const { t } = useTranslation();
  const style = EVENT_STYLES[event] || { icon: 'help_outline', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${style.cls}`}>
      <span className="material-icons text-[14px]">{style.icon}</span>
      {t(`audit.event_${event.replace('.', '_')}`, event)}
    </span>);

}

export default function Audit() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', event: '', from: '', to: '', page: 1 });

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/audit', { params: filters });
      setData(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch {
      setData([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {fetchData();}, [fetchData]);

  useEffect(() => {
    axios.get('/api/audit/events').
    then((r) => setEventTypes(r.data || [])).
    catch(() => setEventTypes([]));
  }, []);

  // Any filter change returns to page 1; staying on page 9 of a smaller result set
  // would show an empty table.
  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const eventOptions = eventTypes.map((e) => ({
    value: e,
    label: t(`audit.event_${e.replace('.', '_')}`, e)
  }));

  const dateInputCls = 'w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  return (
    <AdminLayout title={t('audit.title', 'Audit Trail')}>
      <PageHeader title={t('audit.title', 'Audit Trail')} subtitle={t('audit.subtitle', 'Sign-in and session activity across the site')} />

      <FilterBar>
        <SearchInput value={filters.search} onChange={(v) => setFilter('search', v)} placeholder={t('audit.search_placeholder', 'Search email or IP...')} />
        <SelectFilter value={filters.event} onChange={(v) => setFilter('event', v)} options={eventOptions} placeholder={t('audit.all_events', 'All Events')} />
        <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={dateInputCls} aria-label={t('audit.label_from', 'From')} />
        <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className={dateInputCls} aria-label={t('audit.label_to', 'To')} />
        <button onClick={() => setFilters({ search: '', event: '', from: '', to: '', page: 1 })}
        className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> {t('audit.btn_clear', 'Clear')}
        </button>
      </FilterBar>

      <TableWrapper
        loading={loading}
        minWidthClass="min-w-[860px]"
        footer={meta && <Pagination meta={meta} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />}>
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <Th>{t('audit.th_when', 'When')}</Th>
            <Th>{t('audit.th_event', 'Event')}</Th>
            <Th>{t('audit.th_actor', 'Account')}</Th>
            <Th>{t('audit.th_ip', 'IP Address')}</Th>
            <Th>{t('audit.th_detail', 'Detail')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.length === 0 ?
          <tr><td colSpan={5}><EmptyState icon="history" title={t('audit.empty_title', 'No activity found')} subtitle={t('audit.empty_subtitle', 'Nothing matches these filters yet.')} /></td></tr> :

          data.map((row) =>
          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                {new Date(row.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-6 py-4"><EventBadge event={row.event} /></td>
              <td className="px-6 py-4">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{row.actorEmail || '—'}</span>
                {/* No user row means the email never matched an account — worth showing. */}
                {!row.userId && <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">{t('audit.unknown_account', 'unknown')}</span>}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap" title={row.userAgent || ''}>{row.ipAddress || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{row.detail || '—'}</td>
            </tr>
          )}
        </tbody>
      </TableWrapper>
    </AdminLayout>);

}

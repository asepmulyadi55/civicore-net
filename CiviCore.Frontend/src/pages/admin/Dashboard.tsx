// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../admin/AdminLayout';
import { usePermissions } from '../../admin/PermissionsContext';

function StatCard({ icon, iconBg, iconColor, label, value, badge, badgeStyle }) {
  const badgeColors = {
    rose: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  };
  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden h-36">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className={`material-icons text-xl ${iconColor}`}>{icon}</span>
        </div>
        <div className="text-right">
          {badge && (
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${badgeColors[badgeStyle] || ''}`}>
              {badge}
            </span>
          )}
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value ?? '—'}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const styles = {
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Unpaid: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || styles.Unpaid}`}>
      {t(`dashboard.status_${status.toLowerCase()}`, status)}
    </span>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    Promise.all([
      axios.get('/api/dashboard/stats').catch(() => ({ data: {} })),
      axios.get('/api/payments?page=1').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, paymentsRes]) => {
      setStats(statsRes.data);
      const paymentsData = paymentsRes.data.data || paymentsRes.data;
      setPayments(Array.isArray(paymentsData) ? paymentsData.slice(0, 10) : []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout 
      title={t('dashboard.title')} 
      subtitle={t('dashboard.subtitle')}
    >
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="account_balance_wallet" iconBg="bg-amber-500/10" iconColor="text-amber-500"
              label={t('dashboard.this_month_collections')} value={`Rp ${(stats?.thisMonthsCollections ?? 0).toLocaleString('id-ID')}`} />
            <StatCard icon="assignment" iconBg="bg-amber-500/10" iconColor="text-amber-500"
              label={t('dashboard.pending_approvals')} value={stats?.pendingApprovals ?? 0} />
            <StatCard icon="priority_high" iconBg="bg-rose-500/10" iconColor="text-rose-500"
              label={t('dashboard.unpaid_householders')} value={stats?.unpaidHouseholders ?? 0} badge={t('dashboard.needs_attention')} badgeStyle="rose" />
            <StatCard icon="people" iconBg="bg-indigo-500/10" iconColor="text-indigo-400"
              label={t('dashboard.active_householders')} value={stats?.activeHouseholders ?? 0} />
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Recent Activity */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.recent_activity')}</h2>
                <a href="/payments" className="text-sm font-semibold text-amber-500 hover:underline">{t('dashboard.view_all')}</a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="px-6 py-4">{t('dashboard.table_householder')}</th>
                      <th className="px-6 py-4">{t('dashboard.table_months')}</th>
                      <th className="px-6 py-4">{t('dashboard.table_unit_block')}</th>
                      <th className="px-6 py-4">{t('dashboard.table_date')}</th>
                      <th className="px-6 py-4 text-right">{t('dashboard.table_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                          <span className="material-icons text-3xl block mb-2 text-slate-600">receipt_long</span>
                          {t('dashboard.no_activity')}
                        </td>
                      </tr>
                    ) : payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="material-icons text-amber-500 text-sm">person</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[140px]">{p.householderName || p.householder?.fullname || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {(() => {
                            if (!p.allMonths || p.allMonths.length === 0) return '—';
                            const formatted = p.allMonths.map(m => new Date(m).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
                            const text = formatted.length > 2 ? `${formatted[0]}, ${formatted[1]}...` : formatted.join(', ');
                            return (
                              <div className="flex items-center gap-2">
                                <span>{text}</span>
                                <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {p.allMonths.length} {t('dashboard.months_count')}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.blockName || p.block?.name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right"><StatusBadge status={p.status === 'approved' ? 'Approved' : 'Pending'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Quick Actions & Memo */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.quick_actions')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {can('householders.create') && (
                    <a href="/householders" className="bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group hover:scale-105 hover:shadow-md">
                      <span className="material-icons text-emerald-500 mb-2 group-hover:scale-110 transition-transform">person_add</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white">{t('dashboard.action_add_householder')}</span>
                    </a>
                  )}
                  {can('payments.view') && (
                    <a href="/payments" className="bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group hover:scale-105 hover:shadow-md">
                      <span className="material-icons text-amber-500 mb-2 group-hover:scale-110 transition-transform">receipt_long</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white">{t('dashboard.action_payments')}</span>
                    </a>
                  )}
                  {can('reports.view') && (
                    <a href="/reports" className="bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group hover:scale-105 hover:shadow-md">
                      <span className="material-icons text-amber-500 mb-2 group-hover:scale-110 transition-transform">post_add</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white">{t('dashboard.action_generate_report')}</span>
                    </a>
                  )}
                  {can('blocks.view') && (
                    <a href="/blocks" className="bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group hover:scale-105 hover:shadow-md">
                      <span className="material-icons text-amber-500 mb-2 group-hover:scale-110 transition-transform">domain</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white">{t('dashboard.action_manage_blocks')}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Admin Memo */}
              <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-icons text-amber-500 text-sm">edit_square</span>
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">{t('dashboard.admin_memo')}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                  {stats?.adminMemo ?? t('dashboard.no_memo_set')}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

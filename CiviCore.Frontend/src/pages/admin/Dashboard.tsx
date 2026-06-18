// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';

function StatCard({ icon, iconBg, iconColor, label, value, badge, badgeStyle }) {
  const badgeColors = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{value ?? '—'}</p>
        {badge && (
          <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[badgeStyle] || badgeColors.emerald}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Unpaid: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || styles.Unpaid}`}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    Promise.all([
      axios.get('/api/dashboard/stats').catch(() => ({ data: {} })),
      axios.get('/api/payment?limit=10').catch(() => ({ data: [] })),
    ]).then(([statsRes, paymentsRes]) => {
      setStats(statsRes.data);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data.slice(0, 10) : []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard Overview">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="account_balance_wallet" iconBg="bg-primary/10" iconColor="text-primary"
              label="Total Householders" value={stats?.TotalHouseholders ?? 0} badge="Active" badgeStyle="emerald" />
            <StatCard icon="pending_actions" iconBg="bg-amber-100 dark:bg-amber-500/10" iconColor="text-amber-500"
              label="Pending Payments" value={stats?.PendingPayments ?? 0} />
            <StatCard icon="payments" iconBg="bg-emerald-100 dark:bg-emerald-500/10" iconColor="text-emerald-500"
              label="Total Payments" value={stats?.TotalPayments ?? 0} />
            <StatCard icon="people_alt" iconBg="bg-indigo-100 dark:bg-indigo-500/10" iconColor="text-indigo-500"
              label="Active Residents" value={stats?.TotalHouseholders ?? 0} />
          </section>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <a href="/admin/payments" className="text-sm font-semibold text-primary hover:underline">View all</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Resident</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Block</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                        <span className="material-icons text-3xl block mb-2 text-slate-300 dark:text-slate-600">receipt_long</span>
                        No recent activity
                      </td>
                    </tr>
                  ) : payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-icons text-primary text-sm">person</span>
                          </div>
                          <span className="text-sm font-semibold truncate max-w-[140px]">{p.householderName || p.householder?.fullname || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        Rp {p.amount?.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.block?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right"><StatusBadge status={p.status} /></td>
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

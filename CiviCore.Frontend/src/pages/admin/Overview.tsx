// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';

function StatCard({ icon, iconBg, iconColor, label, value, badge, badgeStyle }) {
  const badgeColors = {
    rose: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
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
  
  const getStatusLabel = (s) => {
    switch(s) {
      case 'Approved': return t('overview.status_approved');
      case 'Pending': return t('overview.status_pending');
      case 'Rejected': return t('overview.status_rejected');
      case 'Unpaid': return t('overview.status_unpaid');
      default: return s;
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || styles.Unpaid}`}>
      {getStatusLabel(status)}
    </span>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Overview() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    axios.get('/api/resident-portal/overview')
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        alert('Failed to load overview data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title={t('overview.title')} subtitle={t('overview.subtitle_loading')}>
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      </AdminLayout>
    );
  }

  if (!data?.hasHousehold) {
    return (
      <AdminLayout title={t('overview.title')} subtitle={t('overview.subtitle_no_profile')}>
        <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
          <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 block mb-4">person_off</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">{t('overview.no_profile_title')}</h2>
          <p className="text-slate-500 mt-2">{t('overview.no_profile_desc')}</p>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <AdminLayout 
      title={t('overview.title')} 
      subtitle={t('overview.subtitle_welcome', { name: data.householder.fullname })}
    >
      <div className="space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon="home" iconBg="bg-indigo-500/10" iconColor="text-indigo-400"
            label={t('overview.block_unit')} value={`${data.householder.blockName} - ${data.householder.unitNumber}`} />
          <StatCard icon="payments" iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
            label={t('overview.current_fee')} value={formatCurrency(data.currentFee)} />
          <StatCard icon="account_balance_wallet" iconBg="bg-amber-500/10" iconColor="text-amber-500"
            label={t('overview.total_paid', { year: data.currentYear })} value={formatCurrency(data.totalPaidYear)} />
          <StatCard icon="event_available" iconBg="bg-blue-500/10" iconColor="text-blue-500"
            label={t('overview.months_paid')} value={t('overview.months_paid_value', { count: data.paidMonthsYear })} />
        </section>

        {/* Payment History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Year */}
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('overview.payment_history', { year: data.currentYear })}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">{t('overview.th_month')}</th>
                    <th className="px-6 py-4">{t('overview.th_status')}</th>
                    <th className="px-6 py-4 text-right">{t('overview.th_amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {MONTHS.map((monthName, index) => {
                    const monthRecord = data.currentRecords.find(r => r.month === index + 1);
                    return (
                      <tr key={monthName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{t(`overview.months.${monthName}`)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={monthRecord?.status ?? 'Unpaid'} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {monthRecord ? formatCurrency(monthRecord.amount) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Previous Year */}
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('overview.payment_history', { year: data.previousYear })}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">{t('overview.th_month')}</th>
                    <th className="px-6 py-4">{t('overview.th_status')}</th>
                    <th className="px-6 py-4 text-right">{t('overview.th_amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {MONTHS.map((monthName, index) => {
                    const monthRecord = data.previousRecords.find(r => r.month === index + 1);
                    return (
                      <tr key={monthName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{t(`overview.months.${monthName}`)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={monthRecord?.status ?? 'Unpaid'} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {monthRecord ? formatCurrency(monthRecord.amount) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

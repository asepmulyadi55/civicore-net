// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import {
  PageHeader, FilterBar, SearchInput, SelectFilter,
  TableWrapper, Th
} from '../../admin/components/ui';
import { useTranslation } from 'react-i18next';

export default function Posyandu() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ gender: {}, categories: {} });
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);
  
  const [filters, setFilters] = useState({ search: '', block_id: '', category: '', gender: '' });

  const fetchBlocks = async () => {
    try {
      const res = await axios.get('/api/blocks');
      setBlocks(res.data || []);
    } catch (err) {}
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = { ...filters };
      if (!p.search) delete p.search;
      if (!p.block_id) delete p.block_id;
      if (p.category === '') delete p.category;
      if (p.gender === '') delete p.gender;

      const res = await axios.get('/api/posyandu', { params: p });
      setData(res.data.data || []);
      setStats(res.data.stats || { gender: {}, categories: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchBlocks(); fetchData(); }, [fetchData]);

  const catColors = {
    baby: 'text-pink-500 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-400',
    toddler: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400',
    child: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
    teen: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
    adult: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    elderly: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    unknown: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400'
  };

  const catLabels = {
    baby: t('posyandu.cat_baby'), toddler: t('posyandu.cat_toddler'), child: t('posyandu.cat_child'), teen: t('posyandu.cat_teen'),
    adult: t('posyandu.cat_adult'), elderly: t('posyandu.cat_elderly'), unknown: t('posyandu.cat_unknown')
  };

  return (
    <AdminLayout title={t('posyandu.title')}>
      <PageHeader title={t('posyandu.header_title')} description={t('posyandu.header_subtitle')} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <p className="text-sm font-medium text-slate-500 mb-1">{t('posyandu.stat_total')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.gender.total || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <p className="text-sm font-medium text-slate-500 mb-1">{t('posyandu.stat_male')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.gender.male || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <p className="text-sm font-medium text-slate-500 mb-1">{t('posyandu.stat_female')}</p>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.gender.female || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <p className="text-sm font-medium text-slate-500 mb-1">{t('posyandu.stat_baby_toddler')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(stats.categories.baby || 0) + (stats.categories.toddler || 0)}</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={filters.search} onChange={v => setFilters(p => ({ ...p, search: v }))} placeholder={t('posyandu.search_placeholder')} />
        <SelectFilter value={filters.block_id} onChange={v => setFilters(p => ({ ...p, block_id: v }))}
          options={blocks.map(b => ({ value: b.id, label: b.name }))} placeholder={t('posyandu.all_blocks')} />
        <SelectFilter value={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))}
          options={[{ value: 'male', label: t('posyandu.stat_male') }, { value: 'female', label: t('posyandu.stat_female') }]} placeholder={t('posyandu.all_genders')} />
        <SelectFilter value={filters.category} onChange={v => setFilters(p => ({ ...p, category: v }))}
          options={Object.entries(catLabels).map(([k, v]) => ({ value: k, label: v }))} placeholder={t('posyandu.all_categories')} />
        <button onClick={() => setFilters({ search: '', block_id: '', category: '', gender: '' })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">
          <span className="material-icons text-sm">close</span> {t('posyandu.btn_clear')}
        </button>
      </FilterBar>

      <TableWrapper loading={loading}>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700/50">
              <Th>{t('posyandu.th_name')}</Th>
              <Th>{t('posyandu.th_age')}</Th>
              <Th>{t('posyandu.th_category')}</Th>
              <Th>{t('posyandu.th_gender')}</Th>
              <Th>{t('posyandu.th_unit')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.fullname}</div>
                  <div className="text-xs text-slate-500">{item.relationship || t('posyandu.resident')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-700 dark:text-slate-300">{item.ageLabel}</div>
                  <div className="text-xs text-slate-500">{item.birthDate ? new Date(item.birthDate).toLocaleDateString('en-US') : '—'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${catColors[item.ageCategory] || catColors.unknown}`}>
                    {catLabels[item.ageCategory] || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.gender === 'male' ? (
                    <span className="text-blue-500 flex items-center gap-1 text-sm"><span className="material-icons text-[16px]">male</span> {t('posyandu.stat_male')}</span>
                  ) : item.gender === 'female' ? (
                    <span className="text-pink-500 flex items-center gap-1 text-sm"><span className="material-icons text-[16px]">female</span> {t('posyandu.stat_female')}</span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 dark:text-white font-medium">{item.blockName} - {item.unit}</div>
                  <div className="text-xs text-slate-500">{item.householderName}</div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">{t('posyandu.empty_state')}</td>
              </tr>
            )}
          </tbody>
      </TableWrapper>
    </AdminLayout>
  );
}

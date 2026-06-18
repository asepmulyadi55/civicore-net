// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { PageHeader, EmptyState, FormInput } from '../../admin/components/ui';

interface HomepageContent {
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_label?: string;
  about_title?: string;
  about_body?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
}

export default function HomepageCMS() {
  const [content, setContent] = useState<HomepageContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  useEffect(() => {
    axios.get('/api/homepage/content')
      .then((res) => setContent(res.data || {}))
      .catch(() => setContent({}))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof HomepageContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setContent((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSuccess(false); setError('');
    try {
      await axios.put('/api/homepage/content', content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const sections = [
    {
      title: 'Hero Section',
      icon: 'web_asset',
      fields: [
        { key: 'hero_title' as keyof HomepageContent, label: 'Hero Title', placeholder: 'Welcome to Dwipapuri' },
        { key: 'hero_subtitle' as keyof HomepageContent, label: 'Hero Subtitle', placeholder: 'A modern community management system' },
        { key: 'hero_cta_label' as keyof HomepageContent, label: 'CTA Button Label', placeholder: 'Learn More' },
      ],
    },
    {
      title: 'About Section',
      icon: 'info',
      fields: [
        { key: 'about_title' as keyof HomepageContent, label: 'Section Title', placeholder: 'About Our Community' },
      ],
      textareas: [
        { key: 'about_body' as keyof HomepageContent, label: 'Body Text', placeholder: 'Describe your community...' },
      ],
    },
    {
      title: 'Contact Information',
      icon: 'contact_phone',
      fields: [
        { key: 'contact_phone' as keyof HomepageContent, label: 'Phone Number', placeholder: '+62 xxx xxxx xxxx' },
        { key: 'contact_email' as keyof HomepageContent, label: 'Email Address', placeholder: 'info@dwipapuri.id' },
      ],
      textareas: [
        { key: 'contact_address' as keyof HomepageContent, label: 'Address', placeholder: 'Full address...' },
      ],
    },
  ];

  return (
    <AdminLayout title="Homepage CMS">
      <PageHeader title="Homepage CMS" subtitle="Manage public-facing homepage content" />

      {loading ? (
        <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
      ) : (
        <div className="space-y-6">
          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
              <span className="material-icons text-emerald-500">check_circle</span>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Changes saved successfully!</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-xl text-sm text-rose-700 dark:text-rose-400">{error}</div>
          )}

          {sections.map((section) => (
            <div key={section.title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="material-icons text-primary">{section.icon}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{section.title}</h3>
              </div>
              <div className="p-6 space-y-4">
                {section.fields?.map((f) => (
                  <FormInput key={f.key} label={f.label} id={f.key} value={content[f.key] || ''} onChange={set(f.key)} placeholder={f.placeholder} />
                ))}
                {section.textareas?.map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                    <textarea value={content[f.key] || ''} onChange={set(f.key)} rows={4} placeholder={f.placeholder}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-60">
              <span className="material-icons text-lg">{saving ? 'hourglass_top' : 'save'}</span>
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

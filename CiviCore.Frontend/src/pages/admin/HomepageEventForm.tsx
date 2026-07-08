import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { FormInput, FormSelect, ImageUploadBox } from '../../admin/components/ui';
import { compressImage } from '../../utils/imageCompressor';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { formatApiErrors } from '../../utils/formatErrors';

export default function HomepageEventForm() {
  const { t } = useTranslation();
  const CATEGORY_OPTIONS = [
    { value: 'community', label: t('homepage.text_community', 'Community') },
    { value: 'maintenance', label: t('homepage.text_maintenance', 'Maintenance') },
    { value: 'announcement', label: t('homepage.text_announcement', 'Announcement') },
    { value: 'other', label: t('homepage.text_other', 'Other') },
];

    const { id } = useParams();
    const navigate = useNavigate();
    
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({ title: '', description: '', date: '', location: '', category: '', status: '', url: '' });
    const [image, setImage] = useState<any>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');

    const fetchEvent = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const r = await axios.get('/api/homepage/events');
            const events = r.data || [];
            const ev = events.find((e: any) => String(e.id) === String(id));
            if (ev) {
                setForm({
                    title: ev.title || '',
                    description: ev.description || '',
                    date: ev.date ? (ev.date.includes('T') ? ev.date.slice(0, 16) : ev.date + 'T00:00') : '',
                    location: ev.location || '',
                    category: ev.category || '',
                    status: ev.status || '',
                    url: ev.url || ''
                });
                setCurrentImageUrl(ev.image_url || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEdit) {
            fetchEvent();
        }
    }, [isEdit, fetchEvent]);

    const saveEvent = async () => {
        const errs: Record<string, string> = {};
        if (!form.title.trim()) errs.title = t('homepage.error_title_required', 'Title is required.');
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setSaving(true); setErrors({});
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (image) fd.append('image_file', await compressImage(image));
        try {
            if (isEdit) {
                await axios.put(`/api/homepage/events/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/homepage/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/admin/homepage/events');
        } catch (e: any) {
            setErrors(formatApiErrors(e));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title={isEdit ? t('homepage.edit_event', 'Edit Event') : t('homepage.add_event', 'Add Event')}>
                <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEdit ? t('homepage.edit_event', 'Edit Event') : t('homepage.add_event', 'Add Event')} subtitle={t('homepage.manage_event_subtitle', 'Manage event details for the homepage')}>
            <div className="w-[80%] max-w-7xl mx-auto pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin/homepage/events" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                        <span className="material-icons">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{isEdit ? t('homepage.edit_event', 'Edit Event') : t('homepage.add_new_event', 'Add New Event')}</h1>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput label={t('homepage.field_title', 'Title')} id="ev-title" value={form.title} onChange={e => {
                            const title = e.target.value;
                            const slug = '/events/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                            setForm(f => ({ ...f, title, url: (!f.url || f.url.startsWith('/events/')) ? slug : f.url }));
                        }} required error={errors.title} placeholder={t('homepage.placeholder_event_title', 'Event title...')} />
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.field_date_time', 'Date & Time')}</label>
                            <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
                        </div>
                        <FormInput label={t('homepage.field_location', 'Location')} id="ev-location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder={t('homepage.placeholder_location', 'e.g. Central Garden')} />
                        <FormSelect label={t('homepage.field_category', 'Category')} id="ev-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={[
                            { value: 'community', label: t('homepage.cat_community', 'Community') },
                            { value: 'maintenance', label: t('homepage.cat_maintenance', 'Maintenance') },
                            { value: 'announcement', label: t('homepage.cat_announcement', 'Announcement') },
                            { value: 'other', label: t('homepage.cat_other', 'Other') }
                        ]} placeholder={t('homepage.placeholder_none', 'None')} />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.field_url', 'URL')}</label>
                        <input type="text" readOnly disabled value={form.url} placeholder={t('homepage.placeholder_auto_url', 'Auto-generated from title')} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('homepage.field_description', 'Description')}</label>
                        <ReactQuill theme="snow" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
                    </div>

                    <ImageUploadBox label={t('homepage.field_event_image', 'Event Image')} currentUrl={currentImageUrl} file={image} onFileChange={setImage} recommendedSize="1000x600" />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Link to="/admin/homepage/events" className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">
                        {t('homepage.btn_cancel', 'Cancel')}
                    </Link>
                    <button onClick={saveEvent} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
                        {saving ? t('homepage.btn_saving', 'Saving...') : t('homepage.btn_save_changes', 'Save Changes')}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}

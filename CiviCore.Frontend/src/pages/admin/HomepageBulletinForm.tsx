import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { FormInput, ImageUploadBox } from '../../admin/components/ui';
import { compressImage } from '../../utils/imageCompressor';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function HomepageBulletinForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', date: '', url: '' });
    const [image, setImage] = useState<any>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');

    const fetchBulletin = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const r = await axios.get('/api/homepage/bulletin');
            const bulletins = r.data || [];
            const bulletin = bulletins.find((b: any) => String(b.id) === String(id));
            if (bulletin) {
                setForm({
                    title: bulletin.title || '',
                    description: bulletin.description || '',
                    date: bulletin.date || '',
                    url: bulletin.url || ''
                });
                setCurrentImageUrl(bulletin.image_url || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEdit) {
            fetchBulletin();
        }
    }, [isEdit, fetchBulletin]);

    const saveBulletin = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (image) fd.append('image_file', await compressImage(image));
        try {
            if (isEdit) {
                await axios.put(`/api/homepage/bulletin/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/homepage/bulletin', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/admin/homepage/bulletin');
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <AdminLayout title={isEdit ? "Edit Bulletin" : "Add Bulletin"}>
                <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEdit ? "Edit Bulletin" : "Add Bulletin"} subtitle="Manage bulletin details for the homepage">
            <div className="w-[80%] max-w-7xl mx-auto pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin/homepage/bulletin" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                        <span className="material-icons">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{isEdit ? "Edit Bulletin" : "Add New Bulletin"}</h1>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput label="Title" id="b-title" value={form.title} onChange={e => {
                            const title = e.target.value;
                            const slug = '/bulletins/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                            setForm(f => ({ ...f, title, url: (!f.url || f.url.startsWith('/bulletins/')) ? slug : f.url }));
                        }} required placeholder="Bulletin title..." />
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                onClick={e => 'showPicker' in e.target && (e.target as any).showPicker()}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer dark:[color-scheme:dark]" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL</label>
                        <input type="text" readOnly disabled value={form.url} placeholder="Auto-generated from title" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                        <ReactQuill theme="snow" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
                    </div>

                    <ImageUploadBox label="Bulletin Image" currentUrl={currentImageUrl} file={image} onFileChange={setImage} recommendedSize="800x600" />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Link to="/admin/homepage/bulletin" className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">
                        Cancel
                    </Link>
                    <button onClick={saveBulletin} disabled={saving || !form.title.trim()} className="px-6 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}

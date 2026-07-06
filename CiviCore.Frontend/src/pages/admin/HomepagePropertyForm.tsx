import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { FormInput, FormSelect } from '../../admin/components/ui';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PROPERTY_STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
    { value: 'rented', label: 'Rented' }
];

export default function HomepagePropertyForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({ 
        title: '', type: 'house', price: '', status: 'available', description: '', location: '',
        bedrooms: '', bathrooms: '', landArea: '', buildingArea: '', amenities: '', contactName: '', contactPhone: ''
    });

    const fetchProperty = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const r = await axios.get(`/api/property/${id}`);
            const p = r.data;
            if (p) {
                setForm({ 
                    title: p.title || '', 
                    type: p.type || 'house', 
                    price: p.price ? String(p.price) : '', 
                    status: p.status || 'available', 
                    description: p.description || '', 
                    location: p.location || '',
                    bedrooms: p.bedrooms ? String(p.bedrooms) : '', 
                    bathrooms: p.bathrooms ? String(p.bathrooms) : '',
                    landArea: p.landArea ? String(p.landArea) : '', 
                    buildingArea: p.buildingArea ? String(p.buildingArea) : '',
                    amenities: p.amenities || '', 
                    contactName: p.contactName || '', 
                    contactPhone: p.contactPhone || ''
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEdit) {
            fetchProperty();
        }
    }, [isEdit, fetchProperty]);

    const setFormValue = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [f]: e.target.value }));

    const saveProperty = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        setErrors({});
        try {
            const payload = { 
                ...form, 
                price: Number(form.price),
                bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
                bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
                landArea: form.landArea ? Number(form.landArea) : null,
                buildingArea: form.buildingArea ? Number(form.buildingArea) : null
            };
            if (isEdit) {
                await axios.put(`/api/property/${id}`, payload);
            } else {
                await axios.post('/api/property', payload);
            }
            navigate('/admin/homepage/properties');
        } catch (err: any) {
            setErrors(err.response?.data?.errors || { general: err.response?.data?.message || 'Save failed.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title={isEdit ? "Edit Property" : "Add Property"}>
                <div className="flex items-center justify-center py-24"><span className="material-icons text-primary text-4xl animate-spin">autorenew</span></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEdit ? "Edit Property" : "Add Property"} subtitle="Manage property listing details">
            <div className="w-[80%] max-w-7xl mx-auto pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin/homepage/properties" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                        <span className="material-icons">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{isEdit ? "Edit Property" : "Add New Property"}</h1>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                    {errors.general && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-sm rounded-lg">{errors.general}</div>}
                    
                    <FormInput label="Title" id="p-title" value={form.title} onChange={setFormValue('title')} error={errors.title} required placeholder="e.g. Unit A-01 For Rent" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect label="Status" id="p-status" value={form.status} onChange={setFormValue('status')} options={PROPERTY_STATUS_OPTIONS} />
                        <FormInput label="Price (Rp)" id="p-price" type="number" value={form.price} onChange={setFormValue('price')} error={errors.price} placeholder="0" />
                    </div>
                    
                    <FormInput label="Location" id="p-loc" value={form.location} onChange={setFormValue('location')} placeholder="Block & unit, e.g. Block A No. 5" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <FormInput label="Bedrooms" id="p-beds" type="number" value={form.bedrooms} onChange={setFormValue('bedrooms')} placeholder="e.g. 3" />
                        <FormInput label="Bathrooms" id="p-baths" type="number" value={form.bathrooms} onChange={setFormValue('bathrooms')} placeholder="e.g. 2" />
                        <FormInput label="Land Area" id="p-land" type="number" value={form.landArea} onChange={setFormValue('landArea')} placeholder="m²" />
                        <FormInput label="Build Area" id="p-build" type="number" value={form.buildingArea} onChange={setFormValue('buildingArea')} placeholder="m²" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput label="Contact Name" id="p-cname" value={form.contactName} onChange={setFormValue('contactName')} placeholder="Agent or owner name" />
                        <FormInput label="Contact Phone" id="p-cphone" value={form.contactPhone} onChange={setFormValue('contactPhone')} placeholder="+62..." />
                    </div>

                    <FormInput label="Amenities" id="p-amenities" value={form.amenities} onChange={setFormValue('amenities')} placeholder="e.g. Infinity Pool, Smart Garage, 24/7 Security" />

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                        <ReactQuill theme="snow" value={form.description} onChange={(val) => setForm(p => ({ ...p, description: val }))} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Link to="/admin/homepage/properties" className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1B2236] transition-colors cursor-pointer">
                        Cancel
                    </Link>
                    <button onClick={saveProperty} disabled={saving || !form.title.trim()} className="px-6 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}

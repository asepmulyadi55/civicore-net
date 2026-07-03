// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { Modal, FormSelect, SecureImage, ConfirmModal } from '../../admin/components/ui';
import { compressImage } from '../../utils/imageCompressor';

function ResidentModal({ open, onClose, onSaved, data }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({
    fullname: '', relationship: 'Head of Family', birthDate: '',
    gender: '', education: '', occupation: '', photoPath: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        fullname: data.fullname || '',
        relationship: data.relationship || 'Head of Family',
        birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
        gender: data.gender || '',
        education: data.education || '',
        occupation: data.occupation || '',
        photoPath: data.photoPath || ''
      });
    } else {
      setForm({ fullname: '', relationship: 'Head of Family', birthDate: '', gender: '', education: '', occupation: '', photoPath: '' });
    }
  }, [data, open]);

  const handleSave = async () => {
    if (!form.fullname.trim()) return;
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.birthDate) payload.birthDate = null;
      if (isEdit) await axios.put(`/api/resident-portal/household/residents/${data.id}`, payload);
      else await axios.post('/api/resident-portal/household/residents', payload);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('resident_household.modal_edit_member') : t('resident_household.modal_add_member')} size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('resident_household.label_fullname')} <span className="text-rose-500">*</span></label>
          <input type="text" value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all" placeholder={t('resident_household.label_fullname')} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.photo') || 'Photo'}</label>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400">
              {form.photoPath ? (
                <SecureImage src={`/api/media/path/${form.photoPath}`} className="w-full h-full object-cover" alt="Resident" />
              ) : (
                <span className="material-icons text-xl">person</span>
              )}
            </div>
            <div>
              <input type="file" id={`residentPhoto-${data?.id || 'new'}`} className="hidden" accept="image/*" onChange={async e => {
                if (!e.target.files?.length) return;
                setUploadingPhoto(true);
                try {
                  const formData = new FormData();
                  const compressedFile = await compressImage(e.target.files[0]);
                  formData.append('file', compressedFile);
                  if (form.photoPath) formData.append('replacePath', form.photoPath);
                  formData.append('module', 'residents');
                  const res = await axios.post('/api/media/upload', formData);
                  setForm(p => ({ ...p, photoPath: res.data.filePath }));
                } catch (err) { console.error(err); }
                finally {
                  setUploadingPhoto(false);
                  e.target.value = '';
                }
              }} />
              <button type="button" onClick={() => document.getElementById(`residentPhoto-${data?.id || 'new'}`)?.click()} disabled={uploadingPhoto} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                <span className="material-icons text-sm">{uploadingPhoto ? 'hourglass_empty' : 'upload'}</span> {uploadingPhoto ? t('edit_householder.uploading') || 'Uploading...' : t('edit_householder.upload_photo') || 'Upload Photo'}
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">{t('edit_householder.resident_photo_hint') || 'Max 2MB. Square image recommended.'}</p>
            </div>
          </div>
        </div>

        <div>
          <FormSelect 
            label={t('edit_householder.relationship')} 
            id="r-rel" 
            value={form.relationship} 
            onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} 
            options={[
              { value: 'Head of Family', label: t('edit_householder.rel_head') },
              { value: 'Spouse', label: t('edit_householder.rel_spouse') },
              { value: 'Child', label: t('edit_householder.rel_child') },
              { value: 'Parent', label: t('edit_householder.rel_parent') },
              { value: 'Sibling', label: t('edit_householder.rel_sibling') },
              { value: 'Other', label: t('edit_householder.rel_other') }
            ]} 
            required 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('resident_household.label_birth_date')}</label>
            <input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all cursor-pointer dark:[color-scheme:dark]" />
          </div>
          <div>
            <FormSelect 
              label={t('edit_householder.gender')} 
              id="r-gen" 
              value={form.gender} 
              onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} 
              options={[{value: 'Male', label: t('edit_householder.gen_male')}, {value: 'Female', label: t('edit_householder.gen_female')}]} 
              placeholder={t('edit_householder.select_gender')} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <FormSelect 
              label={t('edit_householder.education')} 
              id="r-edu" 
              value={form.education} 
              onChange={e => setForm(p => ({ ...p, education: e.target.value }))} 
              options={[
                { value: 'Elementary', label: t('edit_householder.edu_elem') },
                { value: 'Junior High', label: t('edit_householder.edu_junior') },
                { value: 'Senior High', label: t('edit_householder.edu_senior') },
                { value: 'Diploma', label: t('edit_householder.edu_diploma') },
                { value: 'Bachelor', label: t('edit_householder.edu_bachelor') },
                { value: 'Master', label: t('edit_householder.edu_master') },
                { value: 'Doctorate', label: t('edit_householder.edu_doctorate') }
              ]} 
              placeholder={t('edit_householder.select_education')} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.occupation')}</label>
            <input type="text" value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all" placeholder={t('edit_householder.occupation_placeholder')} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('resident_household.btn_cancel')}</button>
          <button type="button" onClick={handleSave} disabled={loading || !form.fullname.trim()} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : isEdit ? t('resident_household.btn_save_changes') : t('resident_household.btn_add_member')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ResidentHousehold() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [residentModal, setResidentModal] = useState({ open: false, data: null });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, item: any, loading: boolean }>({ open: false, item: null, loading: false });
  const [errorModal, setErrorModal] = useState('');
  const [successModal, setSuccessModal] = useState('');
  const [uploadingHouseholdPhoto, setUploadingHouseholdPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchHousehold = () => {
    setLoading(true);
    axios.get('/api/resident-portal/household')
      .then(res => setData(res.data))
      .catch(err => {
        if (err.response?.status !== 404) {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchHousehold();
  }, []);

  const doConfirmDeleteResident = async () => {
    if (!confirmDelete.item) return;
    setConfirmDelete(prev => ({ ...prev, loading: true }));
    try {
      await axios.delete(`/api/resident-portal/household/residents/${confirmDelete.item.id}`);
      fetchHousehold();
      setConfirmDelete({ open: false, item: null, loading: false });
    } catch (err) {
      console.error(err);
      setConfirmDelete(prev => ({ ...prev, loading: false }));
    }
  };

  const setHead = async (id) => {
    try {
      await axios.patch(`/api/resident-portal/household/residents/${id}/set-head`);
      fetchHousehold();
    } catch (err) {
      console.error(err);
      alert('Failed to update head of household');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/resident-portal/household', {
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        photoPath: data.photoPath
      });
      setSuccessModal(t('edit_householder.msg_save_success', 'Household details saved successfully.'));
    } catch (err) {
      console.error(err);
      setErrorModal('Failed to save household details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={t('resident_household.title')} subtitle={t('resident_household.subtitle_loading')}>
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      </AdminLayout>
    );
  }

  // Changed to match Overview.tsx 'No Profile' screen
  if (!data) {
    return (
      <AdminLayout title={t('overview.title') || 'Overview'} subtitle={t('overview.subtitle_no_profile') || 'No Household Profile'}>
        <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
          <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 block mb-4">person_off</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">{t('overview.no_profile_title') || 'No profile found'}</h2>
          <p className="text-slate-500 mt-2">{t('overview.no_profile_desc') || 'Your account is not linked to any household unit.'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('resident_household.title')} subtitle={t('resident_household.subtitle_manage', { block: data.blockName, unit: data.unitNumber })}>
      <ResidentModal open={residentModal.open} onClose={() => setResidentModal({ open: false, data: null })} onSaved={fetchHousehold} data={residentModal.data} />
      <div className="max-w-5xl mx-auto pb-12 mt-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('resident_household.title') || 'My Household'}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {data.blockName || t('edit_householder.unassigned')} - {t('edit_householder.unit') || 'Unit'} {data.unitNumber || t('edit_householder.unassigned')}
            </div>
          </div>
        </div>

        {/* Section 1: Household Information */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icons text-primary text-sm">home</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('edit_householder.household_info') || 'Household Information'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('edit_householder.household_info_desc') || 'Manage household details'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Card 1: Photo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('edit_householder.household_photo') || 'Household Photo'}</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 dark:text-slate-500">
                  {data.photoPath ? (
                    <SecureImage src={`/api/media/path/${data.photoPath}`} className="w-full h-full object-cover" alt="Household" />
                  ) : (
                    <span className="material-icons text-2xl">home</span>
                  )}
                </div>
                <div>
                  <input type="file" id="householdPhoto" className="hidden" accept="image/*" onChange={async e => {
                    if (!e.target.files?.length) return;
                    setUploadingHouseholdPhoto(true);
                    try {
                      const formData = new FormData();
                      const compressedFile = await compressImage(e.target.files[0]);
                      formData.append('file', compressedFile);
                      if (data.photoPath) formData.append('replacePath', data.photoPath);
                      formData.append('module', 'householders');
                      const res = await axios.post('/api/media/upload', formData);
                      setData((p: any) => ({ ...p, photoPath: res.data.filePath }));
                    } catch (err) { console.error(err); }
                    finally {
                      setUploadingHouseholdPhoto(false);
                      e.target.value = '';
                    }
                  }} />
                  <button type="button" onClick={() => document.getElementById('householdPhoto')?.click()} disabled={uploadingHouseholdPhoto} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                    <span className="material-icons text-sm">{uploadingHouseholdPhoto ? 'hourglass_empty' : 'upload'}</span> {uploadingHouseholdPhoto ? t('edit_householder.uploading') || 'Uploading...' : t('edit_householder.upload_photo') || 'Upload Photo'}
                  </button>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-line">{t('edit_householder.photo_hint') || 'Upload an image of your house.'}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Unit Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('edit_householder.unit_details')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FormSelect 
                    label={t('edit_householder.block')} 
                    id="h-blk" 
                    value={data.blockId || ''} 
                    onChange={() => {}} 
                    options={[{ value: data.blockId || '', label: data.blockName || t('edit_householder.unassigned') }]} 
                    placeholder={t('edit_householder.select_block')} 
                    required 
                    disabled
                  />
                </div>
                <div>
                  <FormSelect 
                    label={t('edit_householder.unit_no')} 
                    id="h-unt" 
                    value={data.unitId || ''} 
                    onChange={() => {}} 
                    options={[{ value: data.unitId || '', label: data.unitNumber || t('edit_householder.unassigned') }]} 
                    placeholder={t('edit_householder.select_unit')} 
                    required 
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.owner_name')} <span className="text-rose-500">*</span></label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800/80" value={data.fullname || ''} disabled />
                  <p className="text-xs text-slate-500 mt-1.5">{t('edit_householder.owner_name_hint')}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.email')} <span className="text-slate-400 font-normal">{t('edit_householder.email_hint')}</span></label>
                  <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none" placeholder={t('edit_householder.email_placeholder')} value={data.email || ''} onChange={e => setData({ ...data, email: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('resident_household.phone')}</label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none" value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Card 3: Classification */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('edit_householder.classification')}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.house_status')}</label>
                  <div className="flex items-center gap-3 w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {[t('edit_householder.status_owner'), t('edit_householder.status_rented'), t('edit_householder.status_vacant'), t('edit_householder.status_public'), t('edit_householder.status_developer')][data.houseStatus ?? 0] || t('edit_householder.unknown')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">{t('edit_householder.status_hint')}</p>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex items-start gap-3">
                    <input type="checkbox" checked={data.isActive ?? true} disabled className="mt-1 w-4 h-4 rounded bg-transparent border-slate-300 dark:border-slate-600 text-slate-400 opacity-60" />
                    <div className="opacity-75">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{t('edit_householder.active_household')}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('edit_householder.active_hint')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.notes')} <span className="text-slate-400 font-normal">{t('edit_householder.optional')}</span></label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none min-h-[80px]" placeholder={t('edit_householder.notes_placeholder')} value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fee Management */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">{t('edit_householder.fee_mgmt')}</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="material-icons text-primary mt-0.5">payments</span>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Rp {(data.monthlyFee || 0).toLocaleString('id-ID')} {t('edit_householder.per_month')}</div>
                <div className="text-xs text-slate-500">{t('edit_householder.fee_info')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-12">
          <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 border border-emerald-700 dark:border-emerald-800/50 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed">
            <span className="material-icons text-[18px]">save</span> {saving ? 'Saving...' : t('resident_household.btn_save_changes')}
          </button>
        </div>

        {/* Section 3: Residents */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <span className="material-icons text-indigo-600 dark:text-indigo-400 text-sm">group</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{t('edit_householder.residents') || 'Family Members'}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('edit_householder.residents_desc') || 'Manage family members residing in this unit'}</p>
              </div>
            </div>
            <button type="button" onClick={() => setResidentModal({ open: true, data: null })} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/20 shrink-0 whitespace-nowrap">
              <span className="material-icons text-[16px]">person_add</span> {t('resident_household.btn_add_member') || 'Add Member'}
            </button>
          </div>

          {data.residents?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.residents.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setResidentModal({ open: true, data: r })}>
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                    {r.photoPath ? (
                      <SecureImage src={`/api/media/path/${r.photoPath}`} className="w-full h-full object-cover" alt={r.fullname} />
                    ) : (
                      <span className="material-icons text-slate-400 dark:text-slate-500 text-xl">person</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.fullname}</div>
                    <div className="text-xs text-slate-500 truncate">{r.relationship ? (r.relationship === 'Head of Family' ? t('edit_householder.rel_head') : r.relationship) : t('edit_householder.unspecified')} {r.isHead && <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t('edit_householder.tag_head')}</span>}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setConfirmDelete({ open: true, item: r, loading: false }); }} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer">
                    <span className="material-icons text-[18px]">delete_outline</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 mb-3">person_off</span>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('resident_household.no_members')}</h3>
              <button type="button" onClick={() => setResidentModal({ open: true, data: null })} className="text-xs font-bold text-primary hover:underline cursor-pointer">{t('edit_householder.btn_add_first_resident') || 'Add first resident'}</button>
            </div>
          )}
        </div>

      </div>

      <Modal open={!!errorModal} onClose={() => setErrorModal('')} title={t('edit_householder.error', 'Error')} size="sm">
        <div className="text-slate-600 dark:text-slate-300 mb-6">{errorModal}</div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setErrorModal('')} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer">
            {t('edit_householder.btn_close', 'Close')}
          </button>
        </div>
      </Modal>
      <Modal open={!!successModal} onClose={() => setSuccessModal('')} title={t('edit_householder.success', 'Success')} size="sm">
        <div className="text-slate-600 dark:text-slate-300 mb-6">{successModal}</div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setSuccessModal('')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20">
            {t('edit_householder.btn_close', 'Close')}
          </button>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, item: null, loading: false })}
        onConfirm={doConfirmDeleteResident}
        loading={confirmDelete.loading}
        title={t('edit_householder.confirm_delete_title') || 'Remove Resident'}
        message={t('edit_householder.confirm_delete_msg', { name: confirmDelete.item?.fullname }) || `Are you sure you want to remove ${confirmDelete.item?.fullname}?`}
        confirmLabel={t('edit_householder.btn_delete_resident') || 'Remove Resident'}
      />
    </AdminLayout>
  );
}

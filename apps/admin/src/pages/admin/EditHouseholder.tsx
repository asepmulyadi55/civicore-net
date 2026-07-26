import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { Modal, FormInput, FormSelect, ConfirmModal, SecureImage } from '../../admin/components/ui';
import { compressImage } from '../../utils/imageCompressor';
import { usePermissions } from '../../admin/PermissionsContext';
import { formatApiErrors } from '../../utils/formatErrors';

function ResidentModal({ open, onClose, onSaved, data, householderId }) {
  const { t } = useTranslation();
  const isEdit = !!data?.id;
  const [form, setForm] = useState({
    fullname: '', relationship: 'Head of Family', birthDate: '',
    gender: '', education: '', occupation: '', photoPath: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    const errs: Record<string, string> = {};
    if (!form.fullname.trim()) errs.fullname = t('edit_householder.error_fullname_required', 'Full name is required.');
    if (Object.keys(errs).length > 0) {setErrors(errs);return;}

    setLoading(true);setErrors({});
    try {
      const payload = { ...form, householderId };
      if (!payload.birthDate) payload.birthDate = null;
      if (isEdit) await axios.put(`/api/residents/${data.id}`, payload);else
      await axios.post('/api/residents', payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrors(formatApiErrors(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('edit_householder.modal_edit_resident') : t('edit_householder.modal_add_resident')} size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.full_name')} <span className="text-rose-500">*</span></label>
          <input type="text" value={form.fullname} onChange={(e) => setForm((p) => ({ ...p, fullname: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all" placeholder={t('edit_householder.full_name')} />
          {errors.fullname && <p className="mt-1.5 text-xs text-rose-500">{errors.fullname}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.photo')}</label>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400">
              {form.photoPath ?
              <SecureImage src={`/api/media/path/${form.photoPath}`} className="w-full h-full object-cover" alt="Resident" /> :

              <span className="material-icons text-xl">person</span>
              }
            </div>
            <div>
              <input type="file" id={`residentPhoto-${data?.id || 'new'}`} className="hidden" accept="image/*" onChange={async (e) => {
                if (!e.target.files?.length) return;
                setUploadingPhoto(true);
                try {
                  const formData = new FormData();
                  const compressedFile = await compressImage(e.target.files[0]);
                  formData.append('file', compressedFile);
                  if (form.photoPath) formData.append('replacePath', form.photoPath);
                  formData.append('module', 'residents');
                  const res = await axios.post('/api/media/upload', formData);
                  setForm((p) => ({ ...p, photoPath: res.data.filePath }));
                } catch (err) {console.error(err);} finally
                {
                  setUploadingPhoto(false);
                  e.target.value = '';
                }
              }} />
              <button onClick={() => document.getElementById(`residentPhoto-${data?.id || 'new'}`)?.click()} disabled={uploadingPhoto} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                <span className="material-icons text-sm">{uploadingPhoto ? 'hourglass_empty' : 'upload'}</span> {uploadingPhoto ? t('edit_householder.uploading') : t('edit_householder.upload_photo')}
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">{t('edit_householder.resident_photo_hint')}</p>
            </div>
          </div>
        </div>

        <div>
          <FormSelect
            label={t('edit_householder.relationship')}
            id="r-rel"
            value={form.relationship}
            onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value }))}
            options={[
            { value: 'Head of Family', label: t('edit_householder.rel_head') },
            { value: 'Spouse', label: t('edit_householder.rel_spouse') },
            { value: 'Child', label: t('edit_householder.rel_child') },
            { value: 'Parent', label: t('edit_householder.rel_parent') },
            { value: 'Sibling', label: t('edit_householder.rel_sibling') },
            { value: 'Other', label: t('edit_householder.rel_other') }]
            }
            required />
          
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.birth_date')}</label>
            <input type="date" value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all cursor-pointer dark:[color-scheme:dark]" />
          </div>
          <div>
            <FormSelect
              label={t('edit_householder.gender')}
              id="r-gen"
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              options={[{ value: 'Male', label: t('edit_householder.gen_male') }, { value: 'Female', label: t('edit_householder.gen_female') }]}
              placeholder={t('edit_householder.select_gender')} />
            
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <FormSelect
              label={t('edit_householder.education')}
              id="r-edu"
              value={form.education}
              onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))}
              options={[
              { value: 'Elementary', label: t('edit_householder.edu_elem') },
              { value: 'Junior High', label: t('edit_householder.edu_junior') },
              { value: 'Senior High', label: t('edit_householder.edu_senior') },
              { value: 'Diploma', label: t('edit_householder.edu_diploma') },
              { value: 'Bachelor', label: t('edit_householder.edu_bachelor') },
              { value: 'Master', label: t('edit_householder.edu_master') },
              { value: 'Doctorate', label: t('edit_householder.edu_doctorate') }]
              }
              placeholder={t('edit_householder.select_education')} />
            
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.occupation')}</label>
            <input type="text" value={form.occupation} onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all" placeholder={t('edit_householder.occupation_placeholder')} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">{t('edit_householder.btn_cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? t('edit_householder.btn_saving') : isEdit ? t('edit_householder.btn_save_resident') : t('edit_householder.btn_add_resident')}
          </button>
        </div>
      </div>
    </Modal>);

}

export default function EditHouseholder() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [errorModal, setErrorModal] = useState('');
  const [residentModal, setResidentModal] = useState({ open: false, data: null });
  const [confirmDelete, setConfirmDelete] = useState<{open: boolean;item: any;loading: boolean;}>({ open: false, item: null, loading: false });
  const [uploadingHouseholdPhoto, setUploadingHouseholdPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [hRes, bRes] = await Promise.all([
      axios.get(`/api/householders/${id}`),
      axios.get('/api/blocks?per_page=100')]
      );
      setData(hRes.data);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const doConfirmDeleteResident = async () => {
    if (!confirmDelete.item) return;
    setConfirmDelete((prev) => ({ ...prev, loading: true }));
    try {
      await axios.delete(`/api/residents/${confirmDelete.item.id}`);
      fetchData();
      setConfirmDelete({ open: false, item: null, loading: false });
    } catch (err) {
      console.error(err);
      setConfirmDelete((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!data?.fullname?.trim()) errs.fullname = t('edit_householder.error_fullname_required', 'Owner name is required.');
    if (!data?.blockId) errs.blockId = t('edit_householder.error_block_required', 'Block is required.');
    if (!data?.unitId) errs.unitId = t('edit_householder.error_unit_required', 'Unit is required.');

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setErrorModal(t('edit_householder.error_fill_required', 'Please fill in all required fields.'));
      return;
    }

    setErrors({});
    try {
      await axios.put(`/api/householders/${id}`, data);
      navigate('/householders');
    } catch (err: any) {
      const apiErrs = formatApiErrors(err);
      if (Object.keys(apiErrs).length > 0) {
        setErrors(apiErrs);
        setErrorModal(apiErrs.general || t('edit_householder.error_save_failed', 'Failed to save household details. Please try again.'));
      } else {
        setErrorModal(t('edit_householder.error_save_failed', 'Failed to save household details. Please try again.'));
      }
    }
  };

  if (loading) return <AdminLayout title={t('edit_householder.page_title')} subtitle="Loading..."><div className="p-8 text-center text-slate-500">Loading...</div></AdminLayout>;
  if (!data) return <AdminLayout title={t('edit_householder.page_title')} subtitle="Not Found"><div className="p-8 text-center text-rose-500">Household not found</div></AdminLayout>;

  return (
    <AdminLayout title="Householders" subtitle={t('edit_householder.page_subtitle')}>
      <ResidentModal open={residentModal.open} onClose={() => setResidentModal({ open: false, data: null })} onSaved={fetchData} data={residentModal.data} householderId={id} />
      <div className="w-full lg:w-[80%] max-w-7xl mx-auto pb-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/householders" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <span className="material-icons">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('edit_householder.page_title')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {data.block?.name || t('edit_householder.unassigned')} - {t('edit_householder.unit')} {data.unit?.unitNumber || t('edit_householder.unassigned')}
            </div>
          </div>
        </div>

        {/* Section 1: Household Information */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icons text-primary text-sm">home</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('edit_householder.household_info')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('edit_householder.household_info_desc')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Card 1: Photo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('edit_householder.household_photo')}</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 dark:text-slate-500">
                  {data.photoPath ?
                  <SecureImage src={`/api/media/path/${data.photoPath}`} className="w-full h-full object-cover" alt="Household" /> :

                  <span className="material-icons text-2xl">home</span>
                  }
                </div>
                <div>
                  <input type="file" id="householdPhoto" className="hidden" accept="image/*" onChange={async (e) => {
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
                    } catch (err) {console.error(err);} finally
                    {
                      setUploadingHouseholdPhoto(false);
                      e.target.value = '';
                    }
                  }} />
                  <button onClick={() => document.getElementById('householdPhoto')?.click()} disabled={uploadingHouseholdPhoto} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                    <span className="material-icons text-sm">{uploadingHouseholdPhoto ? 'hourglass_empty' : 'upload'}</span> {uploadingHouseholdPhoto ? t('edit_householder.uploading') : t('edit_householder.upload_photo')}
                  </button>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-line">{t('edit_householder.photo_hint')}</p>
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
                    onChange={(e) => setData({ ...data, blockId: e.target.value, unitId: '' })}
                    options={blocks.map((b) => ({ value: b.id, label: b.name }))}
                    placeholder={t('edit_householder.select_block')}
                    error={errors.blockId}
                    required />
                  
                </div>
                <div>
                  <FormSelect
                    label={t('edit_householder.unit_no')}
                    id="h-unt"
                    value={data.unitId || ''}
                    onChange={(e) => setData({ ...data, unitId: e.target.value })}
                    options={(blocks.find((b) => String(b.id) === String(data.blockId))?.units || []).map((u: any) => {
                      const isCurrent = String(u.id) === String(data.unitId);
                      const isOccupied = u.isAssigned && !isCurrent;
                      const label = isOccupied ? `${u.unitNumber || u.unit_number} (${t('edit_householder.occupied')})` : u.unitNumber || u.unit_number;
                      return { value: u.id, label, disabled: isOccupied };
                    })}
                    placeholder={t('edit_householder.select_unit')}
                    error={errors.unitId}
                    required />
                  
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.owner_name')} <span className="text-rose-500">*</span></label>
                  <input type="text" className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors.fullname ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none`} value={data.fullname || ''} onChange={(e) => setData({ ...data, fullname: e.target.value })} />
                  {errors.fullname && <p className="mt-1.5 text-xs text-rose-500">{errors.fullname}</p>}
                  <p className="text-xs text-slate-500 mt-1.5">{t('edit_householder.owner_name_hint')}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.email')} <span className="text-slate-400 font-normal">{t('edit_householder.email_hint')}</span></label>
                  <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none" placeholder={t('edit_householder.email_placeholder')} value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Card 3: Classification */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('edit_householder.classification')}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.house_status')}</label>
                  <div className="flex items-center gap-3 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {[t('edit_householder.status_owner'), t('edit_householder.status_rented'), t('edit_householder.status_vacant'), t('edit_householder.status_public'), t('edit_householder.status_developer')][data.unit?.houseStatus ?? 0] || t('edit_householder.unknown')}
                    </span>
                    <Link to={`/blocks/${data.blockId}/units`} className="text-primary text-xs flex items-center gap-1 cursor-pointer group">
                      <span className="material-icons text-[16px]">open_in_new</span>
                      <span className="group-hover:underline">{t('edit_householder.go_to_unit_mgmt')}</span>
                    </Link>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">{t('edit_householder.status_hint')}</p>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex items-start gap-3">
                    <input type="checkbox" checked={data.is_active ?? true} onChange={(e) => setData({ ...data, is_active: e.target.checked })} className="mt-1 w-4 h-4 rounded bg-transparent border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30 cursor-pointer" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{t('edit_householder.active_household')}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('edit_householder.active_hint')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.notes')} <span className="text-slate-400 font-normal">{t('edit_householder.optional')}</span></label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none min-h-[80px]" placeholder={t('edit_householder.notes_placeholder')} value={data.notes || ''} onChange={(e) => setData({ ...data, notes: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fee Management */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">{t('edit_householder.fee_mgmt')}</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <span className="material-icons text-primary mt-0.5">payments</span>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Rp {(data.monthlyFee || 0).toLocaleString('id-ID')} {t('edit_householder.per_month')}</div>
                <div className="text-xs text-slate-500">{t('edit_householder.fee_info')}</div>
              </div>
            </div>

            <div className="border border-amber-500/20 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-amber-600 dark:text-amber-500 text-sm">info</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-500">{t('edit_householder.fee_update_hint')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.new_fee')}</label>
                  <input type="number" value={data.newMonthlyFee || ''} onChange={(e) => setData({ ...data, newMonthlyFee: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" placeholder={t('edit_householder.new_fee_placeholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('edit_householder.effective_from')}</label>
                  <input type="month" value={data.effectiveFrom || ''} onChange={(e) => setData({ ...data, effectiveFrom: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none cursor-pointer [color-scheme:light_dark]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {can('householders.edit') &&
        <div className="flex justify-end mb-12">
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 border border-emerald-700 dark:border-emerald-800/50 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20">
              <span className="material-icons text-[18px]">save</span> {t('edit_householder.btn_save_household')}
            </button>
          </div>
        }

        {/* Section 3: Residents */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <span className="material-icons text-indigo-600 dark:text-indigo-400 text-sm">group</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{t('edit_householder.residents')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('edit_householder.residents_desc')}</p>
              </div>
            </div>
            {can('householders.edit') &&
            <button onClick={() => setResidentModal({ open: true, data: null })} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/20 shrink-0 whitespace-nowrap">
                <span className="material-icons text-[16px]">person_add</span> {t('edit_householder.btn_add_resident')}
              </button>
            }
          </div>

          {data.residents?.length > 0 ?
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.residents.map((r) =>
            <div key={r.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4 ${can('householders.edit') ? 'hover:border-primary/30 cursor-pointer group' : ''} transition-all`} tabIndex={0} role="button" onClick={() => can('householders.edit') && setResidentModal({ open: true, data: r })} onKeyDown={(e) => {if (["Enter", " "].includes(e.key)) {e.preventDefault();e.currentTarget.click();}}}>
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                    {r.photoPath ?
                <SecureImage src={`/api/media/path/${r.photoPath}`} className="w-full h-full object-cover" alt={r.fullname} /> :

                <span className="material-icons text-slate-400 dark:text-slate-500 text-xl">person</span>
                }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.fullname}</div>
                    <div className="text-xs text-slate-500 truncate">{r.relationship ? r.relationship === 'Head of Family' ? t('edit_householder.rel_head') : r.relationship : t('edit_householder.unspecified')} {r.isHead && <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t('edit_householder.tag_head')}</span>}</div>
                  </div>
                  {can('householders.edit') &&
              <button onClick={(e) => {e.stopPropagation();setConfirmDelete({ open: true, item: r, loading: false });}} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer">
                      <span className="material-icons text-[18px]">delete_outline</span>
                    </button>
              }
                </div>
            )}
            </div> :

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 mb-3">person_off</span>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('edit_householder.no_residents')}</h3>
              {can('householders.edit') &&
            <button onClick={() => setResidentModal({ open: true, data: null })} className="text-xs font-bold text-primary hover:underline cursor-pointer">{t('edit_householder.btn_add_first_resident')}</button>
            }
            </div>
          }
        </div>

      </div>

      <Modal open={!!errorModal} onClose={() => setErrorModal('')} title={t('edit_householder.error')} size="sm">
        <div className="text-slate-600 dark:text-slate-300 mb-6">{errorModal}</div>
        <div className="flex justify-end">
          <button onClick={() => setErrorModal('')} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer">
            {t('edit_householder.btn_close')}
          </button>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, item: null, loading: false })}
        onConfirm={doConfirmDeleteResident}
        loading={confirmDelete.loading}
        title={t('edit_householder.confirm_delete_title')}
        message={t('edit_householder.confirm_delete_msg', { name: confirmDelete.item?.fullname })}
        confirmLabel={t('edit_householder.btn_delete_resident')} />
      
    </AdminLayout>);

}
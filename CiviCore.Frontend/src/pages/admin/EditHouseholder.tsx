import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { Modal, FormInput, ConfirmModal, SecureImage } from '../../admin/components/ui';
import { compressImage } from '../../utils/imageCompressor';

function ResidentModal({ open, onClose, onSaved, data, householderId }) {
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
      const payload = { ...form, householderId };
      if (!payload.birthDate) payload.birthDate = null;
      if (isEdit) await axios.put(`/api/residents/${data.id}`, payload);
      else await axios.post('/api/residents', payload);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Resident' : 'Add Resident'} size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
          <input type="text" value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all" placeholder="Full Name" />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Photo</label>
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
                  const res = await axios.post('/api/media/upload', formData);
                  setForm(p => ({ ...p, photoPath: res.data.filePath }));
                } catch (err) { console.error(err); }
                finally { 
                  setUploadingPhoto(false); 
                  e.target.value = ''; 
                }
              }} />
              <button onClick={() => document.getElementById(`residentPhoto-${data?.id || 'new'}`)?.click()} disabled={uploadingPhoto} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                <span className="material-icons text-sm">{uploadingPhoto ? 'hourglass_empty' : 'upload'}</span> {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">JPG, PNG, WebP. Auto-compressed if oversized.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Relationship <span className="text-rose-500">*</span></label>
          <div className="relative">
            <select value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} className="w-full sm:w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none cursor-pointer">
              {['Head of Family', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="material-icons absolute right-[52%] sm:right-[52%] top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Birth Date</label>
            <input type="date" value={form.birthDate} onClick={e => (e.target as any).showPicker?.()} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all cursor-pointer [color-scheme:light_dark]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
            <div className="relative">
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none cursor-pointer">
                <option value="">&mdash; Select &mdash;</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Education</label>
            <div className="relative">
              <select value={form.education} onChange={e => setForm(p => ({ ...p, education: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none cursor-pointer">
                <option value="">&mdash; Select &mdash;</option>
                {['Elementary', 'Junior High', 'Senior High', 'Diploma', 'Bachelor', 'Master', 'Doctorate'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Occupation</label>
            <input type="text" value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all" placeholder="e.g. Teacher, Engineer" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading || !form.fullname.trim()} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : isEdit ? 'Save Resident' : 'Add Resident'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function EditHouseholder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [errorModal, setErrorModal] = useState('');
  const [residentModal, setResidentModal] = useState({ open: false, data: null });
  const [confirmDelete, setConfirmDelete] = useState<{open: boolean, item: any, loading: boolean}>({ open: false, item: null, loading: false });
  const [uploadingHouseholdPhoto, setUploadingHouseholdPhoto] = useState(false);

  const fetchData = async () => {
    try {
      const [hRes, bRes] = await Promise.all([
        axios.get(`/api/householders/${id}`),
        axios.get('/api/blocks?per_page=100'),
      ]);
      setData(hRes.data);
      setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, bRes] = await Promise.all([
          axios.get(`/api/householders/${id}`),
          axios.get('/api/blocks?per_page=100'),
        ]);
        setData(hRes.data);
        setBlocks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const doConfirmDeleteResident = async () => {
    if (!confirmDelete.item) return;
    setConfirmDelete(prev => ({...prev, loading: true}));
    try {
      await axios.delete(`/api/residents/${confirmDelete.item.id}`);
      fetchData();
      setConfirmDelete({ open: false, item: null, loading: false });
    } catch (err) {
      console.error(err);
      setConfirmDelete(prev => ({...prev, loading: false}));
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`/api/householders/${id}`, data);
      navigate('/admin/householders');
    } catch (err) {
      console.error(err);
      setErrorModal('Failed to save household details. Please try again.');
    }
  };

  if (loading) return <AdminLayout title="Edit Household" subtitle="Loading..."><div className="p-8 text-center text-slate-500">Loading...</div></AdminLayout>;
  if (!data) return <AdminLayout title="Edit Household" subtitle="Not Found"><div className="p-8 text-center text-rose-500">Household not found</div></AdminLayout>;

  return (
    <AdminLayout title="Householders" subtitle="Edit Household Details">
      <ResidentModal open={residentModal.open} onClose={() => setResidentModal({ open: false, data: null })} onSaved={fetchData} data={residentModal.data} householderId={id} />
      <div className="max-w-4xl mx-auto pb-12">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/householders" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <span className="material-icons">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Edit Household</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {data.block?.name || 'Unassigned'} - Unit {data.unit?.unitNumber || 'Unassigned'}
            </div>
          </div>
        </div>

        {/* Section 1: Household Information */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icons text-primary text-sm">home</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Household Information</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unit details, contact, classification and billing.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Card 1: Photo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Household Photo</h3>
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
                      const res = await axios.post('/api/media/upload', formData);
                      setData((p: any) => ({ ...p, photoPath: res.data.filePath }));
                    } catch (err) { console.error(err); }
                    finally { 
                      setUploadingHouseholdPhoto(false); 
                      e.target.value = ''; 
                    }
                  }} />
                  <button onClick={() => document.getElementById('householdPhoto')?.click()} disabled={uploadingHouseholdPhoto} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                    <span className="material-icons text-sm">{uploadingHouseholdPhoto ? 'hourglass_empty' : 'upload'}</span> {uploadingHouseholdPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">JPG, PNG, WebP.<br/>Automatically compressed before upload.</p>
                </div>
              </div>
            </div>

            {/* Card 2: Unit Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Unit Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Block <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select value={data.blockId || ''} onChange={e => setData({...data, blockId: e.target.value, unitId: ''})} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none cursor-pointer">
                      <option value="">Select Block</option>
                      {blocks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Unit No. <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select value={data.unitId || ''} onChange={e => setData({...data, unitId: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none cursor-pointer">
                      <option value="">Select Unit</option>
                      {(blocks.find(b => String(b.id) === String(data.blockId))?.units || []).map(u => {
                        const isCurrent = String(u.id) === String(data.unitId);
                        const isOccupied = u.isAssigned && !isCurrent;
                        const label = isOccupied ? `${u.unitNumber || u.unit_number} (Occupied)` : (u.unitNumber || u.unit_number);
                        return <option key={u.id} value={u.id} disabled={isOccupied}>{label}</option>;
                      })}
                    </select>
                    <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Owner / Contact Name <span className="text-rose-500">*</span></label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none" value={data.fullname || ''} onChange={e => setData({...data, fullname: e.target.value})} />
                  <p className="text-xs text-slate-500 mt-1.5">Used as fallback when no Head of Family is set.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address <span className="text-slate-400 font-normal">(links to user account)</span></label>
                  <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none" placeholder="household@example.com" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Card 3: Classification */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Classification</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">House Status</label>
                  <div className="flex items-center gap-3 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {['Owner Occupied', 'Rented', 'Vacant', 'Public Facility', 'Developer'][data.unit?.houseStatus ?? 0] || 'Unknown'}
                    </span>
                    <Link to={`/admin/blocks/${data.blockId}/units`} className="text-primary text-xs flex items-center gap-1 cursor-pointer group">
                      <span className="material-icons text-[16px]">open_in_new</span> 
                      <span className="group-hover:underline">Go to Unit Management</span>
                    </Link>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">House status is managed on the unit record.</p>
                </div>
                <div className="flex items-center">
                   <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex items-start gap-3">
                     <input type="checkbox" checked={data.is_active ?? true} onChange={e => setData({...data, is_active: e.target.checked})} className="mt-1 w-4 h-4 rounded bg-transparent border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30 cursor-pointer" />
                     <div>
                       <div className="text-sm font-bold text-slate-900 dark:text-white">Active Household</div>
                       <div className="text-xs text-slate-500 dark:text-slate-400">Uncheck to deactivate this unit.</div>
                     </div>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes <span className="text-slate-400 font-normal">optional</span></label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none min-h-[80px]" placeholder="Any additional notes about this household or unit..." value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fee Management */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">Fee Management</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <span className="material-icons text-primary mt-0.5">payments</span>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Rp {(data.monthlyFee || 0).toLocaleString('id-ID')} / month</div>
                <div className="text-xs text-slate-500">Effective from January 2026 &bull; Imported from Excel (2026-01-01)</div>
              </div>
            </div>

            <div className="border border-amber-500/20 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-amber-600 dark:text-amber-500 text-sm">info</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-500">To update the fee, fill the fields below. Leave blank to keep the current fee.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">New Monthly Fee (Rp)</label>
                  <input type="number" value={data.newMonthlyFee || ''} onChange={e => setData({...data, newMonthlyFee: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" placeholder="Leave blank to keep current" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Effective From</label>
                  <input type="month" value={data.effectiveFrom || ''} onClick={e => (e.target as any).showPicker?.()} onChange={e => setData({...data, effectiveFrom: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none cursor-pointer [color-scheme:light_dark]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-12">
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 border border-emerald-700 dark:border-emerald-800/50 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20">
            <span className="material-icons text-[18px]">save</span> Save Household
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
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Residents</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">People living in this household.</p>
              </div>
            </div>
            <button onClick={() => setResidentModal({ open: true, data: null })} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/20 shrink-0 whitespace-nowrap">
              <span className="material-icons text-[16px]">person_add</span> Add Resident
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
                    <div className="text-xs text-slate-500 truncate">{r.relationship || 'Unspecified'} {r.isHead && <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Head</span>}</div>
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
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No residents added yet.</h3>
              <button onClick={() => setResidentModal({ open: true, data: null })} className="text-xs font-bold text-primary hover:underline cursor-pointer">+ Add the first resident</button>
            </div>
          )}
        </div>

      </div>

      <Modal open={!!errorModal} onClose={() => setErrorModal('')} title="Error" size="sm">
        <div className="text-slate-600 dark:text-slate-300 mb-6">{errorModal}</div>
        <div className="flex justify-end">
          <button onClick={() => setErrorModal('')} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, item: null, loading: false })}
        onConfirm={doConfirmDeleteResident}
        loading={confirmDelete.loading}
        title="Delete Resident"
        message={`Are you sure you want to delete ${confirmDelete.item?.fullname}? This action cannot be undone.`}
        confirmLabel="Delete Resident"
      />
    </AdminLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { Modal } from '../../admin/components/ui';

export default function EditHouseholder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/householders/${id}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
                <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <span className="material-icons text-2xl">home</span>
                </div>
                <div>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-white transition-colors cursor-pointer shadow-sm">
                    <span className="material-icons text-sm">upload</span> Upload Photo
                  </button>
                  <p className="text-xs text-slate-500 mt-2">JPG, PNG, WebP. Auto-compressed if oversized.</p>
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
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none" disabled>
                      <option>{data.block?.name || 'Unassigned'}</option>
                    </select>
                    <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Unit No. <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary outline-none appearance-none" disabled>
                      <option>{data.unit?.unitNumber || 'Unassigned'}</option>
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
                  <input type="month" value={data.effectiveFrom || ''} onChange={e => setData({...data, effectiveFrom: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary outline-none" />
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="material-icons text-indigo-600 dark:text-indigo-400 text-sm">group</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Residents</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">People living in this household.</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/20">
              <span className="material-icons text-[16px]">person_add</span> Add Resident
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 mb-3">person_off</span>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No residents added yet.</h3>
            <button className="text-xs font-bold text-primary hover:underline cursor-pointer">+ Add the first resident</button>
          </div>
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
    </AdminLayout>
  );
}

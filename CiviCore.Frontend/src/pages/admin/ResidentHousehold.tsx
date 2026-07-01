// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../admin/AdminLayout';
import { Modal, FormSelect } from '../../admin/components/ui';

export default function ResidentHousehold() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditContactModalOpen, setEditContactModalOpen] = useState(false);
  const [isResidentModalOpen, setResidentModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);

  const [contactForm, setContactForm] = useState({ phone: '', email: '', notes: '' });
  const [residentForm, setResidentForm] = useState({ fullname: '', relationship: 'other', gender: '', birthDate: '', occupation: '', education: '' });

  const fetchHousehold = () => {
    setLoading(true);
    axios.get('/api/resident-portal/household')
      .then(res => setData(res.data))
      .catch(err => {
        if (err.response?.status !== 404) {
          console.error(err);
          alert('Failed to load household data');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchHousehold();
  }, []);

  const onContactSubmit = (e) => {
    e.preventDefault();
    axios.put('/api/resident-portal/household', contactForm)
      .then(() => {
        alert('Contact info updated');
        setEditContactModalOpen(false);
        fetchHousehold();
      })
      .catch(err => alert(err.response?.data?.message || 'Failed to update contact info'));
  };

  const onResidentSubmit = (e) => {
    e.preventDefault();
    const apiCall = editingResident
      ? axios.put(`/api/resident-portal/household/residents/${editingResident.id}`, residentForm)
      .then(() => alert('Resident updated'))
      : axios.post('/api/resident-portal/household/residents', residentForm)
      .then(() => alert('Resident added'));

    apiCall.then(() => {
      setResidentModalOpen(false);
      fetchHousehold();
    }).catch(err => alert(err.response?.data?.message || 'Action failed'));
  };

  const deleteResident = (id) => {
    if (!window.confirm('Are you sure you want to remove this family member?')) return;
    axios.delete(`/api/resident-portal/household/residents/${id}`)
      .then(() => {
        alert('Resident removed');
        fetchHousehold();
      })
      .catch(err => alert('Failed to remove resident'));
  };

  const setHead = (id) => {
    axios.patch(`/api/resident-portal/household/residents/${id}/set-head`)
      .then(() => {
        alert('Head of household updated');
        fetchHousehold();
      })
      .catch(err => alert('Failed to update head of household'));
  };

  if (loading) {
    return (
      <AdminLayout title="My Household" subtitle="Loading...">
        <div className="flex items-center justify-center py-24">
          <span className="material-icons text-primary text-4xl animate-spin">autorenew</span>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="My Household" subtitle="Welcome to the Resident Portal">
        <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
          <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 block mb-4">family_restroom</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Household Found</h2>
          <p className="text-slate-500 mt-2">Your account is not yet linked to a household record. Please contact management.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="My Household" subtitle={`Manage your household profile and family members in ${data.blockName} - ${data.unitNumber}`}>
      
      {/* Contact Info Card */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Household Details</h2>
          <button 
            onClick={() => {
              setContactForm({ phone: data.phone || '', email: data.email || '', notes: data.notes || '' });
              setEditContactModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-icons text-[18px]">edit</span>
            Edit Details
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Primary Householder</p>
            <p className="font-semibold text-slate-900 dark:text-white">{data.fullname}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Phone</p>
            <p className="font-semibold text-slate-900 dark:text-white">{data.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Email</p>
            <p className="font-semibold text-slate-900 dark:text-white">{data.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-900 dark:text-white">{data.notes || '—'}</p>
          </div>
        </div>
      </div>

      {/* Family Members Card */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-icons text-primary">groups</span>
            Family Members ({data.residents.length})
          </h2>
          <button 
            onClick={() => {
              setEditingResident(null);
              setResidentForm({ fullname: '', relationship: 'other', gender: '', birthDate: '', occupation: '', education: '' });
              setResidentModalOpen(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-icons text-[18px]">add</span>
            Add Member
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Relationship</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Occupation</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.residents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No family members added yet.
                  </td>
                </tr>
              ) : (
                data.residents.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {r.fullname}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">
                      {r.relationship}
                      {r.relationship === 'head' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">HEAD</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">
                      {r.gender || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {r.occupation || '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.relationship !== 'head' && (
                        <button onClick={() => setHead(r.id)} className="text-xs font-semibold text-primary hover:underline">
                          Set Head
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingResident(r);
                          setResidentForm({
                            fullname: r.fullname || '',
                            relationship: r.relationship || 'other',
                            gender: r.gender || '',
                            birthDate: r.birthDate || '',
                            occupation: r.occupation || '',
                            education: r.education || ''
                          });
                          setResidentModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                      >
                        <span className="material-icons text-[18px]">edit</span>
                      </button>
                      <button 
                        onClick={() => deleteResident(r.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <span className="material-icons text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Contact Modal */}
      <Modal open={isEditContactModalOpen} onClose={() => setEditContactModalOpen(false)} title="Edit Contact Info">
        <form onSubmit={onContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <input value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={contactForm.notes} onChange={e => setContactForm({...contactForm, notes: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" rows="3"></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setEditContactModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Resident Modal */}
      <Modal open={isResidentModalOpen} onClose={() => setResidentModalOpen(false)} title={editingResident ? "Edit Family Member" : "Add Family Member"}>
        <form onSubmit={onResidentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input required value={residentForm.fullname} onChange={e => setResidentForm({...residentForm, fullname: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
              <FormSelect 
                id="rh-rel"
                label=""
                value={residentForm.relationship} 
                onChange={e => setResidentForm({...residentForm, relationship: e.target.value})} 
                options={[
                  { value: 'other', label: 'Other' },
                  { value: 'spouse', label: 'Spouse' },
                  { value: 'child', label: 'Child' },
                  { value: 'parent', label: 'Parent' },
                  { value: 'tenant', label: 'Tenant' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <FormSelect 
                id="rh-gen"
                label=""
                value={residentForm.gender} 
                onChange={e => setResidentForm({...residentForm, gender: e.target.value})} 
                options={[
                  { value: '', label: 'Unknown' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Birth Date</label>
            <input type="date" value={residentForm.birthDate} onChange={e => setResidentForm({...residentForm, birthDate: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Occupation</label>
              <input value={residentForm.occupation} onChange={e => setResidentForm({...residentForm, occupation: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Education</label>
              <input value={residentForm.education} onChange={e => setResidentForm({...residentForm, education: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setResidentModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm">{editingResident ? 'Save Changes' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

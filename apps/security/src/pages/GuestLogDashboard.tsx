// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { StatusBadge, EmptyState, Modal, TableWrapper, Th, FormInput, FormSelect, SearchInput, FilterBar, Pagination } from '@civicore/ui';

interface GuestLog {
  id: string;
  guestName: string;
  vehicleType: string;
  licensePlate: string;
  checkInAt: string;
  checkOutAt?: string | null;
  status: string;
  notes?: string;
  createdAt: string;
}

export function GuestLogDashboard() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<GuestLog[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Check-In Modal state
  const [openCheckInModal, setOpenCheckInModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [licensePlate, setLicensePlate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<GuestLog | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('Car');
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [revertToCheckIn, setRevertToCheckIn] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/security/guest-logs', {
        params: { page, search, status: statusFilter !== 'all' ? statusFilter : undefined }
      });
      setLogs(res.data.data || res.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      console.error('Failed to fetch guest logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setFormError('Guest name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      await axios.post('/api/security/guest-logs', {
        guestName,
        vehicleType,
        licensePlate,
        notes
      });
      setOpenCheckInModal(false);
      setGuestName('');
      setLicensePlate('');
      setNotes('');
      fetchLogs();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to check-in guest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await axios.put(`/api/security/guest-logs/${id}/checkout`);
      fetchLogs();
    } catch (err) {
      console.error('Failed to checkout guest', err);
    }
  };

  const openEditDialog = (log: GuestLog) => {
    setEditingLog(log);
    setEditGuestName(log.guestName || '');
    setEditVehicleType(log.vehicleType || 'Car');
    setEditLicensePlate(log.licensePlate || '');
    setEditNotes(log.notes || '');
    setRevertToCheckIn(false);
    setFormError('');
    setOpenEditModal(true);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    if (!editGuestName.trim()) {
      setFormError('Guest name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      await axios.put(`/api/security/guest-logs/${editingLog.id}`, {
        guestName: editGuestName,
        vehicleType: editVehicleType,
        licensePlate: editLicensePlate,
        notes: editNotes,
        revertToCheckIn
      });
      setOpenEditModal(false);
      setEditingLog(null);
      fetchLogs();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update entry');
    } finally {
      setSubmitting(false);
    }
  };

  const inPremisesCount = logs.filter(l => l.status === 'in_premises' || !l.checkOutAt).length;
  const checkedOutCount = logs.filter(l => l.status === 'checked_out' || l.checkOutAt).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Cards Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-icons text-2xl">directions_car</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('dashboard.in_premises_now', 'In Premises Now')}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{inPremisesCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <span className="material-icons text-2xl">no_transfer</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('dashboard.checked_out_today', 'Checked Out Today')}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{checkedOutCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 transition-colors">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('dashboard.quick_action', 'Quick Action')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {t('dashboard.register_visitor', 'Register visitor entry')}
            </p>
          </div>
          <button
            onClick={() => setOpenCheckInModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span className="material-icons text-lg">add</span> {t('dashboard.check_in', 'Check-In')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar>
        <SearchInput value={search} onChange={handleSearchChange} placeholder={t('dashboard.search_placeholder', 'Search guest name or license plate...')} />

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.all_logs', 'All Logs')}
          </button>
          <button
            onClick={() => handleStatusFilterChange('in_premises')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'in_premises' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.in_premises', 'In Premises')}
          </button>
          <button
            onClick={() => handleStatusFilterChange('checked_out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'checked_out' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('dashboard.checked_out', 'Checked Out')}
          </button>
        </div>
      </FilterBar>

      {/* Guest Log Table with guaranteed minWidth 750px */}
      <TableWrapper loading={loading} minWidth={750} footer={<Pagination meta={meta} onChange={setPage} />}>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Th className="whitespace-nowrap">{t('dashboard.col_guest_name', 'Guest Name')}</Th>
            <Th className="whitespace-nowrap">{t('dashboard.col_vehicle_info', 'Vehicle Info')}</Th>
            <Th className="whitespace-nowrap">{t('dashboard.col_checkin_time', 'Check-In Time')}</Th>
            <Th className="whitespace-nowrap">{t('dashboard.col_checkout_time', 'Check-Out Time')}</Th>
            <Th className="whitespace-nowrap">{t('dashboard.col_status', 'Status')}</Th>
            <Th className="text-right whitespace-nowrap">{t('dashboard.col_action', 'Action')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 align-middle text-center">
                <EmptyState icon="shield" title={t('dashboard.no_entries_title', 'No Guest Entries Recorded')} subtitle={t('dashboard.no_entries_sub', 'Check-in guests to record entries.')} />
              </td>
            </tr>
          ) : (
            logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 align-middle whitespace-nowrap">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{log.guestName}</p>
                  {log.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{log.notes}</p>}
                </td>
                <td className="px-6 py-4 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold">
                      {log.vehicleType}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                      {log.licensePlate || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {new Date(log.checkInAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-6 py-4 align-middle text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {log.checkOutAt ? new Date(log.checkOutAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                </td>
                <td className="px-6 py-4 align-middle whitespace-nowrap">
                  <StatusBadge status={log.checkOutAt ? 'checked_out' : 'in_premises'} />
                </td>
                <td className="px-6 py-4 align-middle text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {!log.checkOutAt && (
                      <button
                        onClick={() => handleCheckOut(log.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-icons text-sm">exit_to_app</span> {t('dashboard.btn_checkout', 'Check Out')}
                      </button>
                    )}
                    <button
                      onClick={() => openEditDialog(log)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                      title="Edit Entry Details"
                    >
                      <span className="material-icons text-sm">edit</span> {t('dashboard.btn_edit', 'Edit')}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrapper>

      {/* Check-In Modal */}
      <Modal open={openCheckInModal} onClose={() => setOpenCheckInModal(false)} title={t('modal.checkin_title', 'Check-In Visitor / Guest')} subtitle={t('modal.checkin_sub', 'Record new guest arrival at security gate')}>
        <form onSubmit={handleCheckIn} className="space-y-4">
          <FormInput
            id="guestName"
            label={t('modal.guest_name', 'Guest Name')}
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder="e.g. John Doe / Gojek Courier"
            required
            error={formError}
          />

          <FormSelect
            id="vehicleType"
            label={t('modal.vehicle_type', 'Vehicle Type')}
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            options={[
              { value: 'Car', label: 'Car' },
              { value: 'Motorcycle', label: 'Motorcycle' },
              { value: 'Truck', label: 'Truck / Delivery' },
              { value: 'Pedestrian', label: 'Pedestrian / Walking' },
              { value: 'Other', label: 'Other' }
            ]}
          />

          <FormInput
            id="licensePlate"
            label={t('modal.license_plate', 'Vehicle License Plate')}
            value={licensePlate}
            onChange={e => setLicensePlate(e.target.value)}
            placeholder="e.g. B 1234 ABC"
          />

          <FormInput
            id="notes"
            label={t('modal.notes', 'Notes / Destination Block')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Visiting Block A No. 12"
          />

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOpenCheckInModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('modal.btn_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Checking in...' : t('modal.btn_checkin_submit', 'Check-In Guest')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)} title={t('modal.edit_title', 'Edit Guest Log Entry')} subtitle={t('modal.edit_sub', 'Modify visitor details or revert check-out status')}>
        <form onSubmit={handleUpdateLog} className="space-y-4">
          <FormInput
            id="editGuestName"
            label={t('modal.guest_name', 'Guest Name')}
            value={editGuestName}
            onChange={e => setEditGuestName(e.target.value)}
            placeholder="e.g. John Doe / Gojek Courier"
            required
            error={formError}
          />

          <FormSelect
            id="editVehicleType"
            label={t('modal.vehicle_type', 'Vehicle Type')}
            value={editVehicleType}
            onChange={e => setEditVehicleType(e.target.value)}
            options={[
              { value: 'Car', label: 'Car' },
              { value: 'Motorcycle', label: 'Motorcycle' },
              { value: 'Truck', label: 'Truck / Delivery' },
              { value: 'Pedestrian', label: 'Pedestrian / Walking' },
              { value: 'Other', label: 'Other' }
            ]}
          />

          <FormInput
            id="editLicensePlate"
            label={t('modal.license_plate', 'Vehicle License Plate')}
            value={editLicensePlate}
            onChange={e => setEditLicensePlate(e.target.value)}
            placeholder="e.g. B 1234 ABC"
          />

          <FormInput
            id="editNotes"
            label={t('modal.notes', 'Notes / Destination Block')}
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            placeholder="e.g. Visiting Block A No. 12"
          />

          {editingLog?.checkOutAt && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-amber-800 dark:text-amber-400">
                <input
                  type="checkbox"
                  checked={revertToCheckIn}
                  onChange={e => setRevertToCheckIn(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600"
                />
                {t('modal.revert_checkbox', 'Revert status to "In Premises" (Undo Check-Out)')}
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOpenEditModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('modal.btn_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Updating...' : t('modal.btn_save', 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

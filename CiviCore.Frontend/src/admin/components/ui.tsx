// @ts-nocheck
// Shared admin UI components
import React from 'react';

export function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    approved:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    active:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected:       'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    inactive:       'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    unpaid:         'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    owner_occupied: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rented:         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    vacant:         'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    public_facility:'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    developer:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };
  const cls = map[status?.toLowerCase() || ''] || map.unpaid;
  const label = ({
    approved: 'Approved', active: 'Active', pending: 'Pending', rejected: 'Rejected',
    inactive: 'Inactive', unpaid: 'Unpaid',
    owner_occupied: 'Owner Occupied', rented: 'Rented', vacant: 'Vacant',
    public_facility: 'Public Facility', developer: 'Developer',
  } as Record<string, string>)[status?.toLowerCase() || ''] || status;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {(status === 'active' || status === 'approved') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {label}
    </span>
  );
}

export function EmptyState({ icon = 'search_off', title, subtitle, action }: { icon?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <span className="material-icons text-5xl text-slate-300 dark:text-slate-600">{icon}</span>
      <p className="text-base font-semibold text-slate-600 dark:text-slate-400">{title}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      {action}
    </div>
  );
}

export function Pagination({ meta, onChange }: { meta: any; onChange: (page: number) => void }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page, last_page, from, to, total } = meta;
  const pages = [];
  const start = Math.max(1, current_page - 2);
  const end = Math.min(last_page, current_page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  const btnBase = 'p-2 rounded-lg border text-sm transition-colors';
  const btnActive = 'bg-primary text-white border-primary font-semibold';
  const btnNormal = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
  const btnDisabled = 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed';

  return (
    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
      <p className="text-sm text-slate-500">
        Showing {from}â€“{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button className={`${btnBase} ${current_page === 1 ? btnDisabled : btnNormal}`}
          disabled={current_page === 1} onClick={() => onChange(current_page - 1)}>
          <span className="material-icons text-sm">chevron_left</span>
        </button>
        {start > 1 && (<><button className={`${btnBase} ${btnNormal} px-3 py-1.5`} onClick={() => onChange(1)}>1</button>{start > 2 && <span className="text-slate-400 text-sm px-1">â€¦</span>}</>)}
        {pages.map(p => (
          <button key={p} className={`${btnBase} px-3 py-1.5 ${p === current_page ? btnActive : btnNormal}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        {end < last_page && (<>{end < last_page - 1 && <span className="text-slate-400 text-sm px-1">â€¦</span>}<button className={`${btnBase} ${btnNormal} px-3 py-1.5`} onClick={() => onChange(last_page)}>{last_page}</button></>)}
        <button className={`${btnBase} ${current_page === last_page ? btnDisabled : btnNormal}`}
          disabled={current_page === last_page} onClick={() => onChange(current_page + 1)}>
          <span className="material-icons text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${sizes[size]} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmClass = 'bg-rose-600 hover:bg-rose-700 text-white', icon = 'warning', loading = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; confirmClass?: string; icon?: string; loading?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <span className="material-icons text-rose-600 text-3xl">{icon}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${confirmClass}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Avatar({ name = '', photo, size = 9 }: { name?: string; photo?: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
  if (photo) return <img src={photo} alt={name} className={`w-${size} h-${size} rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 flex-shrink-0`} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:flex-grow sm:max-w-sm">
      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-slate-100 dark:placeholder-slate-500 outline-none"
      />
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder = 'All' }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-auto">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none w-full sm:w-auto pl-4 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
    </div>
  );
}

export function BulkActionBar({ count, onDelete }: { count: number; onDelete: () => void }) {
  if (count === 0) return null;
  return (
    <div className="mb-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2">{count} selected</span>
      <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors">
        <span className="material-icons text-sm">delete</span> Delete Selected
      </button>
    </div>
  );
}

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function FormInput({ label, id, type = 'text', value, onChange, placeholder, error, required }: { label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; error?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`} />
      {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function FormSelect({ label, id, value, onChange, options, error, required, placeholder = 'Select...' }: { label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; error?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={onChange}
          className={`appearance-none block w-full pl-4 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

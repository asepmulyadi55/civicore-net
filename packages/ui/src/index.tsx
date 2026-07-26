// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';

export function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    in_premises: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    checked_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    checked_out: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    inactive: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    unpaid: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
  };
  const cls = map[status?.toLowerCase() || ''] || map.inactive;
  const label = ({
    approved: 'Approved', active: 'Active', in_premises: 'In Premises', checked_in: 'Checked In',
    checked_out: 'Checked Out', pending: 'Pending', rejected: 'Rejected', inactive: 'Inactive'
  } as Record<string, string>)[status?.toLowerCase() || ''] || status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${cls}`}>
      {(status === 'active' || status === 'approved' || status === 'in_premises' || status === 'checked_in') && (
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {label}
    </span>
  );
}

export function EmptyState({ icon = 'search_off', title, subtitle, action }: { icon?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center my-auto w-full">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-xs">
        <span className="material-icons text-3xl">{icon}</span>
      </div>
      <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h4>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({ meta, onChange }: { meta: any; onChange: (page: number) => void }) {
  const { t } = useTranslation();
  if (!meta || meta.last_page <= 1) return null;
  const { current_page, last_page, from, to, total } = meta;
  const pages = [];
  const start = Math.max(1, current_page - 2);
  const end = Math.min(last_page, current_page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  const btnBase = 'inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer';
  const btnActive = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20 cursor-default select-none';
  const btnNormal = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 cursor-pointer';
  const btnDisabled = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed';

  return (
    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
      <p className="text-xs text-slate-500">
        {t('common.text_showing', 'Showing')} {from}–{to} {t('common.text_of', 'of')} {total}
      </p>
      <div className="flex items-center gap-1">
        <button className={`${btnBase} ${current_page === 1 ? btnDisabled : btnNormal}`} disabled={current_page === 1} onClick={() => onChange(current_page - 1)}>
          <span className="material-icons text-sm">chevron_left</span>
        </button>
        {start > 1 && (
          <>
            <button className={`${btnBase} ${btnNormal}`} onClick={() => onChange(1)}>1</button>
            {start > 2 && <span className="text-slate-400 text-xs px-1">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button key={p} className={`${btnBase} ${p === current_page ? btnActive : btnNormal}`} onClick={() => p !== current_page && onChange(p)}>{p}</button>
        ))}
        {end < last_page && (
          <>
            {end < last_page - 1 && <span className="text-slate-400 text-xs px-1">…</span>}
            <button className={`${btnBase} ${btnNormal}`} onClick={() => onChange(last_page)}>{last_page}</button>
          </>
        )}
        <button className={`${btnBase} ${current_page === last_page ? btnDisabled : btnNormal}`} disabled={current_page === last_page} onClick={() => onChange(current_page + 1)}>
          <span className="material-icons text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(2, 6, 23, 0.75)' }}>
      <div className={`w-full ${sizes[size]} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
            <span className="material-icons text-xl">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 pb-24">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, confirmClass = 'bg-rose-600 hover:bg-rose-700 text-white', icon = 'warning', loading = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string | React.ReactNode; confirmLabel?: string; confirmClass?: string; icon?: string; loading?: boolean }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(2, 6, 23, 0.75)' }} tabIndex={0} role="button" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm">
            <span className="material-icons text-3xl">{icon}</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
          {typeof message === 'string' ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: message }} />
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</div>
          )}
        </div>
        <div className="flex flex-col gap-2.5 px-6 pb-6">
          <button onClick={onConfirm} disabled={loading} className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${confirmClass}`}>
            {loading ? t('homepage.text_processing', 'Processing...') : confirmLabel || t('homepage.text_confirm', 'Confirm')}
          </button>
          <button onClick={onClose} disabled={loading} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{t('homepage.label_cancel', 'Cancel')}</button>
        </div>
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs transition-colors">
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:max-w-md">
      <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">search</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all dark:text-slate-100 dark:placeholder-slate-500 outline-none"
      />
    </div>
  );
}

export function TableWrapper({ children, footer, loading = false, minWidth = 750 }: { children: React.ReactNode; footer?: React.ReactNode; loading?: boolean; minWidth?: number | string }) {
  const minWidthStyle = typeof minWidth === 'number' ? `${minWidth}px` : minWidth;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {loading ? (
        <div className="flex items-center justify-center py-20"><span className="material-icons text-emerald-600 text-3xl animate-spin">autorenew</span></div>
      ) : (
        <>
          <div className="overflow-x-auto w-full" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left" style={{ minWidth: minWidthStyle }}>{children}</table>
          </div>
          {footer}
        </>
      )}
    </div>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-3.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function FormInput({ label, id, type = 'text', value, onChange, placeholder, error, required }: { label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; error?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`} />
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function FormSelect({ label, id, value, onChange, options, error, required, placeholder = 'Select...' }: { label: string; id: string; value: string; onChange: (e: any) => void; options: { value: string; label: string; disabled?: boolean }[]; error?: string; required?: boolean; placeholder?: string }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayLabel = value === '' ? placeholder : (selectedOption ? selectedOption.label : placeholder);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none cursor-pointer flex items-center justify-between gap-2 box-border ${
          error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <span className={`truncate text-left flex-1 ${value === '' ? 'text-slate-400' : ''}`}>{displayLabel}</span>
        <span className={`material-icons text-slate-400 text-lg shrink-0 transition-transform duration-150 ${open ? 'rotate-180 text-emerald-600' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[10000] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1.5 max-h-56 overflow-y-auto animate-in fade-in zoom-in duration-100">
          {placeholder && (
            <button
              type="button"
              onClick={() => {
                onChange({ target: { value: '' } });
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                value === '' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {placeholder}
            </button>
          )}
          {options.map((o) => {
            const isSelected = String(value) === String(o.value);
            return (
              <button
                key={o.value}
                type="button"
                disabled={o.disabled}
                onClick={() => {
                  if (o.disabled) return;
                  onChange({ target: { value: o.value } });
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between ${
                  o.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{o.label}</span>
                {isSelected && <span className="material-icons text-emerald-600 text-sm">check</span>}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

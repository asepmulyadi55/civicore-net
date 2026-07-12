// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Role {
  id: string;
  name: string;
  securityMode?: string;
}

interface RoleSecurityModalProps {
  role: Role | null;
  open: boolean;
  onClose: () => void;
  onSaved: (roleId: string, newMode: string) => void;
}

const MODES_CONFIG = [
  {
    value: '2fa',
    icon: 'security',
    labelKey: 'roles.security_mode_2fa_label',
    defaultLabel: '2FA (Authenticator App)',
    descKey: 'roles.security_mode_2fa_desc',
    defaultDesc: 'Users must verify via a TOTP app (e.g. Google Authenticator). Recommended for admins and staff.',
    color: 'text-primary',
    bg: 'bg-primary/10 dark:bg-primary/20',
    border: 'border-primary',
    badge: 'bg-primary/10 text-primary',
  },
  {
    value: 'captcha',
    icon: 'verified_user',
    labelKey: 'roles.security_mode_captcha_label',
    defaultLabel: 'CAPTCHA (Invisible)',
    descKey: 'roles.security_mode_captcha_desc',
    defaultDesc: 'Google reCAPTCHA v3 runs silently in the background. Does not inconvenience users — ideal for residents.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    value: 'none',
    icon: 'lock_open',
    labelKey: 'roles.security_mode_none_label',
    defaultLabel: 'None',
    descKey: 'roles.security_mode_none_desc',
    defaultDesc: 'No additional verification after password. Not recommended — use only for internal/developer roles.',
    color: 'text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    border: 'border-slate-300',
    badge: 'bg-slate-100 text-slate-500',
  },
];

export default function RoleSecurityModal({ role, open, onClose, onSaved }: RoleSecurityModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>(role?.securityMode || '2fa');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selected when role changes
  React.useEffect(() => {
    if (role) setSelected(role.securityMode || '2fa');
    setError(null);
  }, [role]);

  if (!open || !role) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`/api/roles/${role.id}/security-mode`, { securityMode: selected });
      onSaved(role.id, selected);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('roles.error_updating_security', 'Failed to update security mode.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
       tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary text-xl">shield</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('roles.security_mode_title', 'Security Mode')}</h3>
              <p className="text-xs text-slate-400 capitalize">{t('roles.role', 'Role')}: <span className="font-semibold text-slate-600 dark:text-slate-300">{role.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Mode cards */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
            {t('roles.security_mode_subtitle', 'Select how users with this role will verify their identity after entering their password.')}
          </p>
          <div className="space-y-3">
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 text-sm">
                {error}
              </div>
            )}
            
            {MODES_CONFIG.map(mode => {
              const isSelected = selected === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setSelected(mode.value)}
                  className={`w-full text-left rounded-xl p-4 border-2 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `${mode.bg} ${mode.border}`
                      : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`material-icons text-2xl mt-0.5 ${isSelected ? mode.color : 'text-slate-400'}`}>
                      {mode.icon}
                    </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${isSelected ? mode.color : 'text-slate-700 dark:text-slate-200'}`}>
                            {t(mode.labelKey, mode.defaultLabel)}
                          </span>
                          {isSelected && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mode.badge}`}>{t('roles.selected', 'SELECTED')}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {t(mode.descKey, mode.defaultDesc)}
                        </p>
                      </div>
                    <span className={`material-icons text-xl flex-shrink-0 ${isSelected ? mode.color : 'text-slate-200 dark:text-slate-700'}`}>
                      {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            {t('roles.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected === role.securityMode}
            className="flex-1 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="flex items-center justify-center gap-2">
              {saving ? (
                <><span className="material-icons text-sm animate-spin">autorenew</span> {t('roles.saving', 'Saving...')}</>
              ) : (
                <><span className="material-icons text-sm">save</span> {t('roles.save', 'Save Changes')}</>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

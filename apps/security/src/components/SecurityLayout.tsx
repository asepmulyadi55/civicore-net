// @ts-nocheck
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken } from '@civicore/auth';
import { ConfirmModal } from '@civicore/ui';
import useDarkMode from '../useDarkMode';

export function SecurityLayout({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  const userStr = localStorage.getItem('security_user') || localStorage.getItem('admin_user');
  let userName = 'Security Officer';
  let userEmail = 'security@dwipapuri.com';

  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      userName = parsed.name || parsed.fullName || parsed.email || userName;
      userEmail = parsed.email || userEmail;
    } catch (e) {}
  }

  const handleLogout = () => {
    clearAuthToken('security_token', 'security_user');
    clearAuthToken('admin_token', 'admin_user');
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-[#FAF9F6] dark:bg-slate-950 text-slate-800 dark:text-slate-100 ${dark ? 'dark' : ''}`}>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Full Height Sidebar Navigation matching Admin Layout */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-600/20">
            <span className="material-icons text-xl">shield</span>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
              Dwipapuri
            </h1>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mt-0.5">
              {t('nav.portal_title', 'Security Portal')}
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-6">
          <div>
            <p className="px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              {t('nav.gate_management', 'Gate Management')}
            </p>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                location.pathname === '/'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-icons text-lg">badge</span>
              {t('nav.guest_entry_logs', 'Guest Entry Logs')}
            </Link>
          </div>

          <div>
            <p className="px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              {t('nav.account', 'Account')}
            </p>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                location.pathname === '/settings'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-icons text-lg">settings</span>
              {t('nav.settings_password', 'Settings & Password')}
            </Link>
          </div>
        </nav>

        {/* User Footer matching Admin Layout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              title={t('nav.sign_out', 'Sign Out')}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <span className="material-icons text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area matching Admin Layout 100% */}
      <div className="lg:ml-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-4 flex items-center justify-between shadow-xs transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-icons text-xl">menu</span>
            </button>
            <div>
              <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title || (location.pathname === '/settings' ? t('settings.title', 'Security Settings') : t('nav.guest_entry_logs', 'Guest Entry Logs'))}
              </h2>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="material-icons text-xl">{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </header>

        {/* Page Body Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 flex flex-col">
          {children}
        </main>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Security Portal?"
        confirmLabel="Sign Out"
        confirmClass="bg-rose-600 hover:bg-rose-700 text-white"
        icon="logout"
      />
    </div>
  );
}

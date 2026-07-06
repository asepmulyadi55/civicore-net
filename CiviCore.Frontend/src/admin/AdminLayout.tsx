// @ts-nocheck
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useDarkMode from './useDarkMode';
import axios from 'axios';
import { usePermissions } from './PermissionsContext';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard', permission: 'dashboard.view' },
    ],
  },
  {
    label: 'Community',
    icon: 'groups',
    items: [
      { key: 'householders', label: 'Householders', icon: 'people', path: '/admin/householders', permission: 'householders.view' },
      { key: 'blocks', label: 'Blocks', icon: 'domain', path: '/admin/blocks', permission: 'blocks.view' },
      { key: 'organization', label: 'Organization', icon: 'account_tree', path: '/admin/organization', permission: 'organization.view' },
      { key: 'meetings', label: 'Meetings', icon: 'event_note', path: '/admin/meetings', permission: 'meetings.view' },
      { key: 'posyandu', label: 'Posyandu', icon: 'health_and_safety', path: '/admin/posyandu', permission: 'posyandu.view' },
    ],
  },
  {
    label: 'Finance',
    icon: 'attach_money',
    items: [
      { key: 'finance', label: 'Finance', icon: 'account_balance', path: '/admin/finance', permission: 'finance.view' },
      { key: 'payments', label: 'Payments', icon: 'payments', path: '/admin/payments', permission: 'payments.view' },
      { key: 'reports', label: 'Reports', icon: 'bar_chart', path: '/admin/reports', permission: 'reports.view' },
    ],
  },
  {
    label: 'Administration',
    icon: 'admin_panel_settings',
    items: [
      { key: 'users', label: 'Users', icon: 'manage_accounts', path: '/admin/users', permission: 'users.view' },
      { key: 'roles', label: 'Roles', icon: 'admin_panel_settings', path: '/admin/roles', permission: 'roles.view' },
      { key: 'media', label: 'Media', icon: 'perm_media', path: '/admin/media', permission: 'media.view' },
    ],
  },
  {
    label: 'Homepage',
    icon: 'public',
    items: [
      { key: 'hero', label: 'Hero Section', icon: 'star', path: '/admin/homepage/hero', permission: 'homepage_hero.view' },
      { key: 'events', label: 'Events', icon: 'event', path: '/admin/homepage/events', permission: 'homepage_events.view' },
      { key: 'gallery', label: 'Gallery', icon: 'photo_library', path: '/admin/homepage/gallery', permission: 'homepage_gallery.view' },
      { key: 'bulletin', label: 'Bulletin', icon: 'article', path: '/admin/homepage/bulletin', permission: 'homepage_bulletin.view' },
      { key: 'property', label: 'Properties', icon: 'home_work', path: '/admin/homepage/property', permission: 'homepage_property.view' },
      { key: 'navigation', label: 'Navigation', icon: 'menu', path: '/admin/homepage/navigation', permission: 'homepage_navigation.view' },
      { key: 'footer', label: 'Footer', icon: 'web_asset', path: '/admin/homepage/footer', permission: 'homepage_footer.view' },
      { key: 'metadata', label: 'SEO & Metadata', icon: 'manage_search', path: '/admin/homepage/metadata', permission: 'homepage_metadata.view' },
    ],
  },
  {
    label: 'My Resident Profile',
    icon: 'house',
    items: [
      { key: 'overview', label: 'Overview', icon: 'home', path: '/admin/overview', permission: 'overview.view' },
      { key: 'my-household', label: 'My Household', icon: 'family_restroom', path: '/admin/residents', permission: 'my_household.view' },
    ],
  },
  {
    label: 'Settings',
    icon: 'settings',
    items: [
      { key: 'profile', label: 'Profile', icon: 'person', path: '/admin/settings/profile', permission: 'settings_profile.view' },
      { key: 'password', label: 'Password', icon: 'lock', path: '/admin/settings/password', permission: 'settings_password.view' },
      { key: 'security', label: 'Security', icon: 'security', path: '/admin/settings/security', permission: 'settings_security.view' },
      { key: 'memo', label: 'Admin Memo', icon: 'sticky_note_2', path: '/admin/settings/memo', permission: 'settings_memo.view' },
      { key: 'posyandu', label: 'Posyandu', icon: 'child_care', path: '/admin/settings/posyandu', permission: 'settings_posyandu.view' },
    ],
  },
];

function NavItem({ item, isActive }) {
  const { t } = useTranslation();
  return (
    <Link
      to={item.path}
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
        isActive
          ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold'
          : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 font-medium'
      }`}
    >
      <span className="material-icons text-[20px]">{item.icon}</span>
      <span>{t(`sidebar.${item.key}`, item.label)}</span>
    </Link>
  );
}

function NavGroup({ group, activePath, userRole, permissions }) {
  const { t } = useTranslation();
  
  const isGroupActive = group.items.some(i => activePath.startsWith(i.path));
  const [open, setOpen] = useState(isGroupActive);

  const visibleItems = group.items.filter(i => {
    if (permissions.includes('*')) return true;
    if (i.permission) return permissions.includes(i.permission);
    return false;
  });
  
  if (visibleItems.length === 0) return null;

  const groupKey = group.label ? group.label.toLowerCase().replace(/ /g, '') : null;
  const translatedLabel = groupKey ? t(`sidebar.${groupKey}`, group.label) : '';

  if (!group.label) {
    return (
      <div className="space-y-0.5">
        {visibleItems.map(item => (
          <NavItem key={item.key} item={item} isActive={activePath.startsWith(item.path)} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
          isGroupActive ? 'text-primary dark:text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
        }`}
      >
        <span className="material-icons text-[20px]">{group.icon}</span>
        <span className="flex-1 text-left">{translatedLabel}</span>
        <span className="material-icons text-[18px] opacity-60 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : '' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="pl-3 space-y-0.5 mt-0.5">
          {visibleItems.map(item => (
            <NavItem key={item.key} item={item} isActive={activePath.startsWith(item.path)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children, title, subtitle }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { permissions, loading: loadingPerms } = usePermissions();
  const userStr = localStorage.getItem('admin_user');
  const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};

  React.useEffect(() => {
    if (user.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user.language, i18n]);

  const currentNavItem = React.useMemo(() => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (location.pathname.startsWith(item.path)) {
          return item;
        }
      }
    }
    return null;
  }, [location.pathname]);

  const hasAccess = React.useMemo(() => {
    if (!currentNavItem) return true; // allow unknown routes
    if (permissions.includes('*')) return true;
    if (currentNavItem.permission) return permissions.includes(currentNavItem.permission);
    return false;
  }, [currentNavItem, permissions]);

  React.useEffect(() => {
    if (!loadingPerms && !hasAccess && location.pathname === '/admin/dashboard') {
      let redirectPath = null;
      if (permissions.includes('*')) {
        redirectPath = '/admin/dashboard';
      } else {
        for (const group of NAV_GROUPS) {
          for (const item of group.items) {
            if (item.permission && permissions.includes(item.permission)) {
              redirectPath = item.path;
              break;
            }
          }
          if (redirectPath) break;
        }
      }
      
      if (redirectPath && redirectPath !== '/admin/dashboard') {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [loadingPerms, hasAccess, location.pathname, permissions, navigate]);

  const handleLogout = async () => {
    try { await axios.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className={`admin-theme min-h-screen bg-slate-50 dark:bg-surface ${dark ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 flex items-center justify-center border border-primary/30 rounded">
            <span className="material-symbols-outlined text-primary text-xl">architecture</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-primary dark:text-white">Dwipapuri.</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {NAV_GROUPS.map((group, i) => (
            <NavGroup key={i} group={group} activePath={location.pathname} userRole={user.role} permissions={permissions} />
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-primary text-sm">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user.email || ''}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
              <span className="material-icons text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-icons text-slate-500">menu</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={toggleDark}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:scale-105 hover:shadow-md transition-all cursor-pointer"
            title="Toggle dark mode"
          >
            <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 flex flex-col">
          {loadingPerms ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="material-icons animate-spin text-primary text-4xl">autorenew</span>
            </div>
          ) : !hasAccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <span className="material-icons text-4xl">gpp_bad</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                You do not have permission to view this page. If you believe this is an error, please contact your administrator.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

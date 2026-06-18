import { Link, useLocation, useNavigate } from 'react-router-dom';
import useDarkMode from './useDarkMode';
import axios from 'axios';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    ],
  },
  {
    label: 'Community',
    icon: 'groups',
    items: [
      { key: 'householders', label: 'Residents', icon: 'people', path: '/admin/householders' },
      { key: 'blocks', label: 'Blocks', icon: 'domain', path: '/admin/blocks' },
      { key: 'organization', label: 'Organization', icon: 'account_tree', path: '/admin/organization' },
      { key: 'meetings', label: 'Meetings', icon: 'event_note', path: '/admin/meetings' },
    ],
  },
  {
    label: 'Finance',
    icon: 'attach_money',
    items: [
      { key: 'finance', label: 'Finance', icon: 'account_balance', path: '/admin/finance' },
      { key: 'payments', label: 'Payments', icon: 'payments', path: '/admin/payments' },
      { key: 'reports', label: 'Reports', icon: 'bar_chart', path: '/admin/reports' },
    ],
  },
  {
    label: 'Administration',
    icon: 'admin_panel_settings',
    items: [
      { key: 'users', label: 'Users', icon: 'manage_accounts', path: '/admin/users' },
      { key: 'roles', label: 'Roles', icon: 'admin_panel_settings', path: '/admin/roles' },
      { key: 'property', label: 'Property', icon: 'home_work', path: '/admin/property' },
      { key: 'homepage', label: 'Homepage CMS', icon: 'public', path: '/admin/homepage' },
      { key: 'media', label: 'Media', icon: 'perm_media', path: '/admin/media' },
    ],
  },
  {
    label: null,
    items: [
      { key: 'settings', label: 'Settings', icon: 'settings', path: '/admin/settings' },
    ],
  },
];

function NavItem({ item, isActive }) {
  return (
    <Link
      to={item.path}
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
        isActive
          ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold'
          : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 font-medium'
      }`}
    >
      <span className="material-icons text-[20px]">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function NavGroup({ group, activePath }) {
  const isGroupActive = group.items.some(i => activePath.startsWith(i.path));
  const [open, setOpen] = useState(isGroupActive);

  if (!group.label) {
    return (
      <div className="space-y-0.5">
        {group.items.map(item => (
          <NavItem key={item.key} item={item} isActive={activePath.startsWith(item.path)} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isGroupActive ? 'text-primary dark:text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
        }`}
      >
        <span className="material-icons text-[20px]">{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <span className="material-icons text-[18px] opacity-60 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : '' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="pl-3 space-y-0.5 mt-0.5">
          {group.items.map(item => (
            <NavItem key={item.key} item={item} isActive={activePath.startsWith(item.path)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const handleLogout = async () => {
    try { await axios.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
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
            <NavGroup key={i} group={group} activePath={location.pathname} />
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
            <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors">
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          </div>
          <button
            onClick={toggleDark}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            title="Toggle dark mode"
          >
            <span className="material-icons">{dark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

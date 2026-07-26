// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface PermissionsContextType {
  permissions: string[];
  loading: boolean;
  can: (key: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  loading: true,
  can: () => false,
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    axios.get('/api/auth/permissions')
      .then(res => setPermissions(res.data || []))
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, []);

  const can = (key: string): boolean => {
    try {
      const userStr = localStorage.getItem('admin_user');
      if (userStr && userStr !== 'undefined') {
        const user = JSON.parse(userStr);

        let roleName = '';

        if (typeof user.role === 'string') {
          roleName = user.role.toLowerCase();
        } else if (user.role && typeof user.role.name === 'string') {
          roleName = user.role.name.toLowerCase();
        } else if (typeof user.roleName === 'string') {
          roleName = user.roleName.toLowerCase();
        } else if (Array.isArray(user.roles) && user.roles.length > 0) {
          const firstRole = user.roles[0];
          roleName = (typeof firstRole === 'string' ? firstRole : (firstRole.name || '')).toLowerCase();
        } else if (user.role_id === 1 || user.roleId === 1) {
          roleName = 'admin';
        }

        if (roleName === 'admin' || roleName === 'superadmin' || roleName === 'super-admin' || user.email === 'admin@civicore.com') {
          return true;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }

    if (permissions.includes('*')) return true;
    return permissions.includes(key);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, can }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

export default PermissionsContext;

// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export function getAuthToken(tokenKey = 'admin_token') {
  return localStorage.getItem(tokenKey);
}

export function setAuthToken(token: string, tokenKey = 'admin_token') {
  localStorage.setItem(tokenKey, token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthToken(tokenKey = 'admin_token', userKey = 'admin_user') {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  delete axios.defaults.headers.common['Authorization'];
}

// Global 401 Unauthorized Interceptor to auto-clear expired sessions and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('security_token');
      localStorage.removeItem('security_user');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      delete axios.defaults.headers.common['Authorization'];

      if (error.response.data?.code === 'SESSION_CONFLICT') {
        sessionStorage.setItem('logout_reason', 'session_conflict');
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

export function PermissionsProvider({ children, tokenKey = 'admin_token', userKey = 'admin_user' }: { children: React.ReactNode; tokenKey?: string; userKey?: string }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    axios.get('/api/auth/permissions')
      .then(res => setPermissions(res.data || []))
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [tokenKey]);

  const can = (key: string): boolean => {
    try {
      const userStr = localStorage.getItem(userKey);
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

        if (roleName === 'admin' || roleName === 'superadmin' || roleName === 'security' || user.email === 'admin@civicore.com') {
          return true;
        }
      }
    } catch (e) {
      // Ignore parsing error
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

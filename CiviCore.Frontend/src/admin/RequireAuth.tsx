// @ts-nocheck
import { Navigate } from 'react-router-dom';
import { PermissionsProvider } from './PermissionsContext';

export default function RequireAuth({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <PermissionsProvider>{children}</PermissionsProvider>;
}

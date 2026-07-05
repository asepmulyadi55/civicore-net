// @ts-nocheck
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from './PermissionsContext';

/**
 * Route-level permission guard.
 * Redirects to /admin/dashboard with an "access denied" flash if the user
 * lacks the required permission key(s). Shows nothing while permissions
 * are still loading to avoid a flash of redirect.
 *
 * Usage:
 *   <RequirePermission perm="blocks.edit">
 *     <Units />
 *   </RequirePermission>
 */
export default function RequirePermission({ perm, children }: { perm: string; children: React.ReactNode }) {
  const { can, loading } = usePermissions();

  if (loading) return null; // wait — avoids premature redirect on cold load

  if (!can(perm)) {
    return <Navigate to="/admin/dashboard" replace state={{ denied: true }} />;
  }

  return <>{children}</>;
}

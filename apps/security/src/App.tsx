// @ts-nocheck
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PermissionsProvider, getAuthToken } from '@civicore/auth';
import { SecurityLayout } from './components/SecurityLayout';
import { GuestLogDashboard } from './pages/GuestLogDashboard';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

function RequireSecurityAuth({ children }: { children: React.ReactNode }) {
  const token = getAuthToken('security_token') || getAuthToken('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <PermissionsProvider tokenKey="security_token" userKey="security_user">
      <SecurityLayout>{children}</SecurityLayout>
    </PermissionsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireSecurityAuth>
              <GuestLogDashboard />
            </RequireSecurityAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireSecurityAuth>
              <Settings />
            </RequireSecurityAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// @ts-nocheck
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import RequireAuth from './admin/RequireAuth';
import RequirePermission from './admin/RequirePermission';

import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import ForgotPassword from './pages/admin/ForgotPassword';
import ResetPassword from './pages/admin/ResetPassword';
import Dashboard from './pages/admin/Dashboard';
// Wave 1
import Householders from './pages/admin/Householders';
import EditHouseholder from './pages/admin/EditHouseholder';
import Blocks from './pages/admin/Blocks';
import Units from './pages/admin/Units';
import Payments from './pages/admin/Payments';
import Users from './pages/admin/Users';
// Wave 2
import Finance from './pages/admin/Finance';
import Meetings from './pages/admin/Meetings';
import Organization from './pages/admin/Organization';
import Reports from './pages/admin/Reports';
// Wave 3
import Roles from './pages/admin/Roles';
import EditRole from './pages/admin/EditRole';
import Settings from './pages/admin/Settings';
import Posyandu from './pages/admin/Posyandu';
import AdminHomepage from './pages/admin/Homepage';
import HomepageEventForm from './pages/admin/HomepageEventForm';
import HomepageBulletinForm from './pages/admin/HomepageBulletinForm';
import HomepagePropertyForm from './pages/admin/HomepagePropertyForm';
import Media from './pages/admin/Media';
// Resident Portal
import Overview from './pages/admin/Overview';
import ResidentHousehold from './pages/admin/ResidentHousehold';
import NotFound from './pages/admin/NotFound';

function GaTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof (globalThis as any).gtag !== 'function') return;
    (globalThis as any).gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location]);
  return null;
}

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="material-icons text-6xl text-slate-300 dark:text-slate-700 mb-4">construction</span>
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">{page}</h2>
      <p className="text-slate-400 mt-2">This page is under construction.</p>
    </div>
  );
}

export default function Router() {
  const basePath = (import.meta as any).env.VITE_APP_BASE ?? '';

  return (
    <BrowserRouter basename={basePath}>
      <GaTracker />
      <Routes>
        {/* Base Redirect */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Admin Layout */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Auth pages */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />

        {/* Dashboard */}
        <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* Wave 1 — Community & Payments */}
        <Route path="/admin/householders" element={<RequireAuth><RequirePermission perm="householders.view"><Householders /></RequirePermission></RequireAuth>} />
        <Route path="/admin/householders/:id/edit" element={<RequireAuth><RequirePermission perm="householders.edit"><EditHouseholder /></RequirePermission></RequireAuth>} />
        <Route path="/admin/blocks" element={<RequireAuth><RequirePermission perm="blocks.view"><Blocks /></RequirePermission></RequireAuth>} />
        <Route path="/admin/blocks/:id/units" element={<RequireAuth><RequirePermission perm="blocks.edit"><Units /></RequirePermission></RequireAuth>} />
        <Route path="/admin/payments" element={<RequireAuth><RequirePermission perm="payments.view"><Payments /></RequirePermission></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><RequirePermission perm="users.view"><Users /></RequirePermission></RequireAuth>} />

        {/* Wave 2 — Finance, Meetings, Org, Reports */}
        <Route path="/admin/finance" element={<RequireAuth><RequirePermission perm="finance.view"><Finance /></RequirePermission></RequireAuth>} />
        <Route path="/admin/meetings" element={<RequireAuth><RequirePermission perm="meetings.view"><Meetings /></RequirePermission></RequireAuth>} />
        <Route path="/admin/organization" element={<RequireAuth><RequirePermission perm="organization.view"><Organization /></RequirePermission></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><RequirePermission perm="reports.view"><Reports /></RequirePermission></RequireAuth>} />

        {/* Wave 3 — Admin & Config */}
        <Route path="/admin/roles" element={<RequireAuth><RequirePermission perm="roles.view"><Roles /></RequirePermission></RequireAuth>} />
        <Route path="/admin/roles/new/edit" element={<RequireAuth><RequirePermission perm="roles.create"><EditRole /></RequirePermission></RequireAuth>} />
        <Route path="/admin/roles/:id/edit" element={<RequireAuth><RequirePermission perm="roles.edit"><EditRole /></RequirePermission></RequireAuth>} />
        <Route path="/admin/settings" element={<Navigate to="/admin/settings/profile" replace />} />
        <Route path="/admin/settings/:tab" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/admin/homepage" element={<Navigate to="/admin/homepage/featured" replace />} />
        <Route path="/admin/homepage/events/new" element={<RequireAuth><RequirePermission perm="homepage_events.create"><HomepageEventForm /></RequirePermission></RequireAuth>} />
        <Route path="/admin/homepage/events/:id/edit" element={<RequireAuth><RequirePermission perm="homepage_events.edit"><HomepageEventForm /></RequirePermission></RequireAuth>} />
        <Route path="/admin/homepage/bulletin/new" element={<RequireAuth><RequirePermission perm="homepage_bulletin.create"><HomepageBulletinForm /></RequirePermission></RequireAuth>} />
        <Route path="/admin/homepage/bulletin/:id/edit" element={<RequireAuth><RequirePermission perm="homepage_bulletin.edit"><HomepageBulletinForm /></RequirePermission></RequireAuth>} />
        <Route path="/admin/homepage/properties/new" element={<RequireAuth><RequirePermission perm="homepage_property.create"><HomepagePropertyForm /></RequirePermission></RequireAuth>} />
        <Route path="/admin/homepage/properties/:id/edit" element={<RequireAuth><RequirePermission perm="homepage_property.edit"><HomepagePropertyForm /></RequirePermission></RequireAuth>} />
        <Route path="/admin/homepage/:tab" element={<RequireAuth><RequirePermission perm="homepage_hero.view"><AdminHomepage /></RequirePermission></RequireAuth>} />
        <Route path="/admin/media" element={<RequireAuth><RequirePermission perm="media.view"><Media /></RequirePermission></RequireAuth>} />

        {/* Resident Portal */}
        <Route path="/admin/overview" element={<RequireAuth><Overview /></RequireAuth>} />
        <Route path="/admin/residents" element={<RequireAuth><ResidentHousehold /></RequireAuth>} />
        <Route path="/admin/posyandu" element={<RequireAuth><RequirePermission perm="posyandu.view"><Posyandu /></RequirePermission></RequireAuth>} />

        {/* Catch-all: show 404 page for any unknown route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}


// @ts-nocheck
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Audit from './pages/admin/Audit';
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
  return (
    <BrowserRouter>
      <GaTracker />
      <Routes>
        {/* Base Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* Wave 1 — Community & Payments */}
        <Route path="/householders" element={<RequireAuth><RequirePermission perm="householders.view"><Householders /></RequirePermission></RequireAuth>} />
        <Route path="/householders/:id/edit" element={<RequireAuth><RequirePermission perm="householders.edit"><EditHouseholder /></RequirePermission></RequireAuth>} />
        <Route path="/blocks" element={<RequireAuth><RequirePermission perm="blocks.view"><Blocks /></RequirePermission></RequireAuth>} />
        <Route path="/blocks/:id/units" element={<RequireAuth><RequirePermission perm="blocks.edit"><Units /></RequirePermission></RequireAuth>} />
        <Route path="/payments" element={<RequireAuth><RequirePermission perm="payments.view"><Payments /></RequirePermission></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><RequirePermission perm="users.view"><Users /></RequirePermission></RequireAuth>} />

        {/* Wave 2 — Finance, Meetings, Org, Reports */}
        <Route path="/finance" element={<RequireAuth><RequirePermission perm="finance.view"><Finance /></RequirePermission></RequireAuth>} />
        <Route path="/meetings" element={<RequireAuth><RequirePermission perm="meetings.view"><Meetings /></RequirePermission></RequireAuth>} />
        <Route path="/organization" element={<RequireAuth><RequirePermission perm="organization.view"><Organization /></RequirePermission></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><RequirePermission perm="reports.view"><Reports /></RequirePermission></RequireAuth>} />

        {/* Wave 3 — Admin & Config */}
        <Route path="/roles" element={<RequireAuth><RequirePermission perm="roles.view"><Roles /></RequirePermission></RequireAuth>} />
        <Route path="/roles/new/edit" element={<RequireAuth><RequirePermission perm="roles.create"><EditRole /></RequirePermission></RequireAuth>} />
        <Route path="/roles/:id/edit" element={<RequireAuth><RequirePermission perm="roles.edit"><EditRole /></RequirePermission></RequireAuth>} />
        <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/settings/:tab" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/homepage" element={<Navigate to="/homepage/featured" replace />} />
        <Route path="/homepage/events/new" element={<RequireAuth><RequirePermission perm="homepage_events.create"><HomepageEventForm /></RequirePermission></RequireAuth>} />
        <Route path="/homepage/events/:id/edit" element={<RequireAuth><RequirePermission perm="homepage_events.edit"><HomepageEventForm /></RequirePermission></RequireAuth>} />
        <Route path="/homepage/bulletin/new" element={<RequireAuth><RequirePermission perm="homepage_bulletin.create"><HomepageBulletinForm /></RequirePermission></RequireAuth>} />
        <Route path="/homepage/bulletin/:id/edit" element={<RequireAuth><RequirePermission perm="homepage_bulletin.edit"><HomepageBulletinForm /></RequirePermission></RequireAuth>} />
        <Route path="/homepage/properties/new" element={<RequireAuth><RequirePermission perm="homepage_property.create"><HomepagePropertyForm /></RequirePermission></RequireAuth>} />
        <Route path="/homepage/properties/:id/edit" element={<RequireAuth><RequirePermission perm="homepage_property.edit"><HomepagePropertyForm /></RequirePermission></RequireAuth>} />
        {/* Gated per-tab by AdminLayout, which maps the path to its own nav permission.
            A fixed perm here would gate every tab on Hero's permission. */}
        <Route path="/homepage/:tab" element={<RequireAuth><AdminHomepage /></RequireAuth>} />
        <Route path="/media" element={<RequireAuth><RequirePermission perm="media.view"><Media /></RequirePermission></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><RequirePermission perm="audit.view"><Audit /></RequirePermission></RequireAuth>} />

        {/* Resident Portal */}
        <Route path="/overview" element={<RequireAuth><Overview /></RequireAuth>} />
        <Route path="/residents" element={<RequireAuth><ResidentHousehold /></RequireAuth>} />
        <Route path="/posyandu" element={<RequireAuth><RequirePermission perm="posyandu.view"><Posyandu /></RequirePermission></RequireAuth>} />

        {/* Catch-all: show 404 page for any unknown route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

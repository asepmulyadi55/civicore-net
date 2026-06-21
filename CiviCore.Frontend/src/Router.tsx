// @ts-nocheck
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import ForgotPassword from './pages/admin/ForgotPassword';
import Dashboard from './pages/admin/Dashboard';
// Wave 1
import Householders from './pages/admin/Householders';
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
import Settings from './pages/admin/Settings';
import PropertyAdmin from './pages/admin/PropertyAdmin';
import HomepageCMS from './pages/admin/HomepageCMS';
import Media from './pages/admin/Media';
// Public pages
import EventsPage from './pages/EventsPage';
import BuletinPage from './pages/BuletinPage';
import PropertyPage from './pages/PropertyPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ScrollToTop from './components/ScrollToTop';
import RequireAuth from './admin/RequireAuth';

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
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/buletin" element={<BuletinPage />} />
        <Route path="/property" element={<PropertyPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />

        {/* Auth pages */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard */}
        <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* Wave 1 — Community & Payments */}
        <Route path="/admin/householders" element={<RequireAuth><Householders /></RequireAuth>} />
        <Route path="/admin/blocks" element={<RequireAuth><Blocks /></RequireAuth>} />
        <Route path="/admin/blocks/:id/units" element={<RequireAuth><Units /></RequireAuth>} />
        <Route path="/admin/payments" element={<RequireAuth><Payments /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><Users /></RequireAuth>} />

        {/* Wave 2 — Finance, Meetings, Org, Reports */}
        <Route path="/admin/finance" element={<RequireAuth><Finance /></RequireAuth>} />
        <Route path="/admin/meetings" element={<RequireAuth><Meetings /></RequireAuth>} />
        <Route path="/admin/organization" element={<RequireAuth><Organization /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><Reports /></RequireAuth>} />

        {/* Wave 3 — Admin & Config */}
        <Route path="/admin/roles" element={<RequireAuth><Roles /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/admin/property" element={<RequireAuth><PropertyAdmin /></RequireAuth>} />
        <Route path="/admin/homepage" element={<RequireAuth><HomepageCMS /></RequireAuth>} />
        <Route path="/admin/media" element={<RequireAuth><Media /></RequireAuth>} />

        {/* Stubs for remaining modules */}
        <Route path="/admin/residents" element={<RequireAuth><ComingSoon page="Residents" /></RequireAuth>} />
        <Route path="/admin/posyandu" element={<RequireAuth><ComingSoon page="Posyandu" /></RequireAuth>} />
        <Route path="/admin/overview" element={<RequireAuth><ComingSoon page="Overview" /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

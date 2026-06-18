import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import ForgotPassword from './pages/admin/ForgotPassword';
import Dashboard from './pages/admin/Dashboard';
import EventsPage from './pages/EventsPage';
import BuletinPage from './pages/BuletinPage';
import PropertyPage from './pages/PropertyPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ScrollToTop from './components/ScrollToTop';
import RequireAuth from './admin/RequireAuth';

function GaTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof globalThis.gtag !== 'function') return;
    globalThis.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location]);
  return null;
}

// Placeholder for admin pages not yet built
function ComingSoon({ page }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="material-icons text-6xl text-slate-300 dark:text-slate-700 mb-4">construction</span>
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">{page}</h2>
      <p className="text-slate-400 mt-2">This page is under construction.</p>
    </div>
  );
}

export default function Router() {
  const basePath = import.meta.env.VITE_APP_BASE ?? '';

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

        {/* Protected admin pages */}
        <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/householders" element={<RequireAuth><ComingSoon page="Residents" /></RequireAuth>} />
        <Route path="/admin/blocks" element={<RequireAuth><ComingSoon page="Blocks" /></RequireAuth>} />
        <Route path="/admin/organization" element={<RequireAuth><ComingSoon page="Organization" /></RequireAuth>} />
        <Route path="/admin/meetings" element={<RequireAuth><ComingSoon page="Meetings" /></RequireAuth>} />
        <Route path="/admin/finance" element={<RequireAuth><ComingSoon page="Finance" /></RequireAuth>} />
        <Route path="/admin/payments" element={<RequireAuth><ComingSoon page="Payments" /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><ComingSoon page="Reports" /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><ComingSoon page="Users" /></RequireAuth>} />
        <Route path="/admin/roles" element={<RequireAuth><ComingSoon page="Roles" /></RequireAuth>} />
        <Route path="/admin/property" element={<RequireAuth><ComingSoon page="Property Listings" /></RequireAuth>} />
        <Route path="/admin/homepage" element={<RequireAuth><ComingSoon page="Homepage CMS" /></RequireAuth>} />
        <Route path="/admin/media" element={<RequireAuth><ComingSoon page="Media Library" /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth><ComingSoon page="Settings" /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

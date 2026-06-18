import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/admin/Login';
import EventsPage from './pages/EventsPage';
import BuletinPage from './pages/BuletinPage';
import PropertyPage from './pages/PropertyPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ScrollToTop from './components/ScrollToTop';

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

export default function Router() {
  const basePath = import.meta.env.VITE_APP_BASE ?? '';

  return (
    <BrowserRouter basename={basePath}>
      <GaTracker />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/buletin" element={<BuletinPage />} />
        <Route path="/property" element={<PropertyPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

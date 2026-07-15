import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './admin.css'
import './bootstrap'
import axios from 'axios'
import './i18n'
import Router from './Router'
import ReloadPrompt from './admin/components/ReloadPrompt'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // The server flags a 401 caused by a sign-in on another device, so the login
      // page can say why instead of looking like a random session drop.
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
    <ReloadPrompt />
  </StrictMode>,
)

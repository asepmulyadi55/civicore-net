// @ts-nocheck
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './bootstrap';
import axios from 'axios';
import './i18n';
import App from './App';
import './index.css';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('security_token');
      localStorage.removeItem('security_user');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
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
    <App />
  </StrictMode>
);

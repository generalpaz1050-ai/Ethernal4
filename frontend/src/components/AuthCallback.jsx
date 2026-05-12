import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { Flame } from 'lucide-react';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash || '';
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      navigate('/');
      return;
    }
    const sessionId = decodeURIComponent(m[1]);

    (async () => {
      try {
        const res = await authAPI.googleSession(sessionId);
        if (res.data?.token) {
          localStorage.setItem('ethernal-token', res.data.token);
        }
      } catch (e) {
        console.error('OAuth callback failed', e);
      } finally {
        // Clear hash and go to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        window.location.href = '/';
      }
    })();
  }, [navigate]);

  return (
    <div className="gradient-dark flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Flame className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: 'var(--primary)' }} />
        <p className="text-xl" style={{ color: 'var(--foreground)' }}>Iniciando sesión...</p>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { Flame } from 'lucide-react';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash || '';
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      // No session id at all -> go home.
      window.location.replace('/');
      return;
    }
    const sessionId = decodeURIComponent(m[1]);

    (async () => {
      try {
        const res = await authAPI.googleSession(sessionId);
        if (res?.data?.token) {
          try { localStorage.setItem('ethernal-token', res.data.token); } catch (_) { /* ignore */ }
        }
        // Clear hash then hard-reload so the app re-mounts cleanly with the
        // new auth state. Hard reload prevents the React tree from trying to
        // reconcile across the auth boundary (which is what triggers the
        // mobile-translator `insertBefore` crash).
        try { window.history.replaceState(null, '', window.location.pathname); } catch (_) { /* ignore */ }
        window.location.replace('/');
      } catch (e) {
        // Surface a friendly screen instead of a white crash.
        // eslint-disable-next-line no-console
        console.error('OAuth callback failed', e);
        const detail = e?.response?.data?.detail || e?.message || 'No se pudo iniciar sesión.';
        setError(detail);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6"
           style={{ background: '#1c0f08', color: '#f6e7d3' }}
           data-testid="oauth-error-screen">
        <div className="text-center max-w-md">
          <Flame className="w-16 h-16 mx-auto mb-4" style={{ color: '#d4a76a' }} />
          <h1 className="text-2xl font-semibold mb-3" style={{ fontFamily: 'serif' }}>
            No se pudo iniciar sesión
          </h1>
          <p className="text-base opacity-80 mb-6">{error}</p>
          <button
            data-testid="oauth-back-home-btn"
            onClick={() => window.location.replace('/')}
            className="px-6 py-3 rounded-full font-semibold transition-colors"
            style={{ background: '#d4a76a', color: '#1c0f08' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen"
         style={{ background: '#1c0f08' }}
         data-testid="oauth-callback-loading">
      <div className="text-center">
        <Flame className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: '#d4a76a' }} />
        <p className="text-xl" style={{ color: '#f6e7d3' }}>Iniciando sesión...</p>
      </div>
    </div>
  );
}

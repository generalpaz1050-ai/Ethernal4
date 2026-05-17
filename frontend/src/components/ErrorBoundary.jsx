import React from 'react';
import { Flame } from 'lucide-react';

/**
 * Catches React render errors (e.g. NotFoundError: insertBefore caused by
 * mobile browser translators modifying the DOM) and shows a friendly retry
 * screen instead of the white-of-death overlay.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log so we can debug later but never expose stack traces to users.
    // eslint-disable-next-line no-console
    console.error('Ethernal ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    try {
      // Clear any partial auth state then hard-reload.
      window.location.replace(window.location.pathname);
    } catch (_) {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="flex items-center justify-center min-h-screen px-6"
        style={{ background: '#1c0f08', color: '#f6e7d3' }}
        data-testid="error-boundary-screen"
      >
        <div className="text-center max-w-md">
          <Flame className="w-16 h-16 mx-auto mb-4" style={{ color: '#d4a76a' }} />
          <h1 className="text-3xl font-semibold mb-3" style={{ fontFamily: 'serif' }}>
            Algo se interrumpió
          </h1>
          <p className="text-base opacity-80 mb-6">
            Tu navegador móvil intentó traducir o modificar la página y eso confundió
            a la app. Si tienes activada la traducción automática del navegador,
            desactívala para este sitio.
          </p>
          <button
            data-testid="error-boundary-reload-btn"
            onClick={this.handleReload}
            className="px-6 py-3 rounded-full font-semibold transition-colors"
            style={{ background: '#d4a76a', color: '#1c0f08' }}
          >
            Recargar la app
          </button>
        </div>
      </div>
    );
  }
}

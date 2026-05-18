import React, { useEffect, useState } from 'react';

/**
 * Theme-specific animated background that lives behind everything.
 * It listens to `body[data-theme="..."]` (set by applyTheme) and renders
 * a different particle / overlay layer depending on the active theme.
 *
 * All effects are pure CSS using `transform` + `opacity` so they stay
 * smooth on any device. The component is fixed at z-index 0 and uses
 * pointer-events: none so it never interferes with the UI.
 */
const PARTICLE_COUNT = {
  medievalWarm: 28,
  darkMinimalist: 14,
  primavera: 24,
  darkFantasy: 22,
  cyberpunk: 0, // cyberpunk uses overlay grid + scanline instead
  warmRomance: 22,
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function buildParticles(theme) {
  const count = PARTICLE_COUNT[theme] ?? 18;
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      id: `${theme}-${i}`,
      left: `${rand(0, 100)}%`,
      delay: `${rand(0, 18)}s`,
      duration: `${rand(12, 28)}s`,
      size: rand(4, 14),
      drift: `${rand(-40, 40)}px`,
      rotate: `${rand(-180, 180)}deg`,
      opacity: rand(0.35, 0.85),
    });
  }
  return arr;
}

export default function AnimatedBackground() {
  const [theme, setTheme] = useState(
    (typeof document !== 'undefined' && document.body?.getAttribute('data-theme')) || 'medievalWarm'
  );
  const [particles, setParticles] = useState(() => buildParticles(theme));
  const [enabled, setEnabled] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    const v = localStorage.getItem('ethernal-animated-bg');
    return v === null ? true : v === '1';
  });

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return undefined;
    const obs = new MutationObserver(() => {
      const t = document.body.getAttribute('data-theme') || 'medievalWarm';
      setTheme(t);
      setParticles(buildParticles(t));
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    const initial = document.body.getAttribute('data-theme') || 'medievalWarm';
    if (initial !== theme) {
      setTheme(initial);
      setParticles(buildParticles(initial));
    }

    // Listen for the custom event fired when the user toggles the setting.
    const onToggle = (e) => {
      const next = e?.detail?.enabled ?? (localStorage.getItem('ethernal-animated-bg') !== '0');
      setEnabled(!!next);
    };
    window.addEventListener('ethernal-animated-bg-changed', onToggle);

    return () => {
      obs.disconnect();
      window.removeEventListener('ethernal-animated-bg-changed', onToggle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;

  return (
    <div className="animated-bg" aria-hidden="true">
      {/* Ambient gradient orbs — always present, color tuned via CSS vars */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* Cyberpunk: grid + scanline + glitch flash (no particles) */}
      {theme === 'cyberpunk' && (
        <>
          <div className="cp-grid" />
          <div className="cp-scanline" />
          <div className="cp-glitch" />
        </>
      )}

      {/* Particle layer — symbol selected per theme */}
      <div className={`particles particles-${theme}`}>
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              '--drift': p.drift,
              '--rot': p.rotate,
            }}
          >
            {/* Glyph for themes that draw a shape rather than a dot */}
            {theme === 'primavera' && <PetalSVG />}
            {theme === 'warmRomance' && <HeartSVG />}
            {theme === 'darkFantasy' && <SparkleSVG />}
            {theme === 'medievalWarm' && <EmberDot />}
            {theme === 'darkMinimalist' && <SoftDot />}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Glyph components (inline SVG, themed via CSS) ---------- */

function PetalSVG() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%">
      <path
        d="M8 1 C10 4 13 6 13 9 C13 12 10 14 8 14 C6 14 3 12 3 9 C3 6 6 4 8 1 Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

function HeartSVG() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%">
      <path
        d="M8 14 C8 14 1.5 9.5 1.5 5.5 C1.5 3 3.5 1.5 5.5 1.5 C6.9 1.5 7.7 2.5 8 3.2 C8.3 2.5 9.1 1.5 10.5 1.5 C12.5 1.5 14.5 3 14.5 5.5 C14.5 9.5 8 14 8 14 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SparkleSVG() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%">
      <path
        d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EmberDot() {
  return <span className="ember-dot" />;
}

function SoftDot() {
  return <span className="soft-dot" />;
}

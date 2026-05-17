import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cat, Dog, Rabbit, Bird, Fish, Squirrel, Flame, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { getPet, ensureCatalog } from '../lib/cosmetics';
import { playPetSound, isMuted, setMuted } from '../lib/petSounds';

const ICON_MAP = { Cat, Dog, Rabbit, Bird, Fish, Squirrel, Flame, Sparkles };

// Per-pet behaviour. Each entry controls:
//  - bobAnim: the idle CSS animation name (defined below in <style>).
//  - particle: how the pet emits particles (interval in ms, render fn, max alive count).
//  - extraAura: an optional aura ring rendered behind the icon.
const PET_BEHAVIOUR = {
  cat:         { bobAnim: 'pet-bob-slow',  particle: { interval: 2200, max: 2, kind: 'zzz',     color: '#fbbf24' } },
  dog:         { bobAnim: 'pet-wag',       particle: { interval: 1800, max: 2, kind: 'heart',   color: '#f97316' } },
  rabbit:      { bobAnim: 'pet-hop',       particle: { interval: 1400, max: 3, kind: 'dot',     color: '#f9a8d4' } },
  bird:        { bobAnim: 'pet-bob',       particle: { interval: 900,  max: 4, kind: 'sparkle', color: '#8b5cf6' }, extraAura: true },
  fish:        { bobAnim: 'pet-float',     particle: { interval: 700,  max: 5, kind: 'bubble',  color: '#67e8f9' } },
  squirrel:    { bobAnim: 'pet-jitter',    particle: { interval: 600,  max: 4, kind: 'streak',  color: '#92400e' } },
  cat_golden:  { bobAnim: 'pet-bob',       particle: { interval: 500,  max: 6, kind: 'star',    color: '#fde047' }, extraAura: true },
  dragon:      { bobAnim: 'pet-bob',       particle: { interval: 280,  max: 8, kind: 'spark',   color: '#fb923c' } },
  phoenix_pet: { bobAnim: 'pet-float',     particle: { interval: 400,  max: 7, kind: 'flame',   color: '#f97316' }, extraAura: true },
};

// Particle rendering. Each "kind" defines its own shape/motion. We keep the markup
// minimal — a plain <span> styled inline, so spawning hundreds of these is cheap.
function renderParticle(p) {
  const base = {
    position: 'absolute',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  };
  switch (p.kind) {
    case 'spark':
      // Dragon-style orange spark shooting upward.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: '-2px',
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            background: `linear-gradient(to top, ${p.color}, #fef3c7)`,
            borderRadius: '50%',
            filter: `drop-shadow(0 0 6px ${p.color})`,
            animation: `pet-spark-up ${p.duration}ms ease-out forwards`,
          }}
        />
      );
    case 'flame':
      // Phoenix flame — wider, slower, more orange.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: '-4px',
            width: `${p.size}px`,
            height: `${p.size * 1.8}px`,
            background: `radial-gradient(ellipse at center, #fef3c7 0%, ${p.color} 60%, transparent 100%)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: `blur(0.5px) drop-shadow(0 0 8px ${p.color})`,
            animation: `pet-flame-up ${p.duration}ms ease-out forwards`,
          }}
        />
      );
    case 'bubble':
      // Fish bubbles floating up — translucent circles.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            bottom: '8px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), ${p.color}66)`,
            border: `1px solid ${p.color}aa`,
            borderRadius: '50%',
            animation: `pet-bubble-up ${p.duration}ms ease-in forwards`,
          }}
        />
      );
    case 'star':
      // Golden cat — rotating sparkle stars around the pet.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: `${p.offsetY}px`,
            color: p.color,
            fontSize: `${p.size}px`,
            textShadow: `0 0 8px ${p.color}`,
            animation: `pet-twinkle ${p.duration}ms ease-out forwards`,
            fontWeight: 900,
          }}
        >
          ✦
        </span>
      );
    case 'sparkle':
      // Mystic bird — small purple sparkles drifting down.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: `-2px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: '50%',
            filter: `drop-shadow(0 0 4px ${p.color})`,
            animation: `pet-sparkle-fall ${p.duration}ms ease-in forwards`,
          }}
        />
      );
    case 'bubble2':
    case 'dot':
      // Rabbit — small pink dots/puffs.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            bottom: '0px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: '50%',
            filter: `drop-shadow(0 0 4px ${p.color})`,
            animation: `pet-dot-pop ${p.duration}ms ease-out forwards`,
          }}
        />
      );
    case 'streak':
      // Squirrel — fast horizontal streak particles.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: `calc(50% + ${p.offsetY}px)`,
            width: `${p.size * 2}px`,
            height: `${p.size * 0.5}px`,
            background: `linear-gradient(to right, transparent, ${p.color})`,
            borderRadius: '2px',
            animation: `pet-streak ${p.duration}ms ease-out forwards`,
          }}
        />
      );
    case 'zzz':
      // Lazy cat — small "z" letters floating up.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: '0px',
            color: p.color,
            fontSize: `${p.size}px`,
            fontWeight: 900,
            fontFamily: 'serif',
            textShadow: `0 0 6px ${p.color}`,
            animation: `pet-zzz ${p.duration}ms ease-out forwards`,
          }}
        >
          z
        </span>
      );
    case 'heart':
      // Loyal dog — small heart floating up.
      return (
        <span
          key={p.id}
          style={{
            ...base,
            left: `calc(50% + ${p.offsetX}px)`,
            top: '-2px',
            color: p.color,
            fontSize: `${p.size}px`,
            textShadow: `0 0 6px ${p.color}`,
            animation: `pet-heart-up ${p.duration}ms ease-out forwards`,
          }}
        >
          ♥
        </span>
      );
    default:
      return null;
  }
}

function buildParticle(kind, color) {
  const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  switch (kind) {
    case 'spark':    return { id, kind, color, size: 3 + Math.random() * 3, offsetX: -10 + Math.random() * 20, duration: 700 + Math.random() * 300 };
    case 'flame':    return { id, kind, color, size: 6 + Math.random() * 4, offsetX: -8 + Math.random() * 16,  duration: 1100 + Math.random() * 400 };
    case 'bubble':   return { id, kind, color, size: 4 + Math.random() * 4, offsetX: -12 + Math.random() * 24, duration: 1400 + Math.random() * 600 };
    case 'star':     return { id, kind, color, size: 10 + Math.random() * 6, offsetX: -30 + Math.random() * 60, offsetY: -18 + Math.random() * 36, duration: 900 + Math.random() * 600 };
    case 'sparkle':  return { id, kind, color, size: 3 + Math.random() * 2, offsetX: -16 + Math.random() * 32, duration: 1000 + Math.random() * 400 };
    case 'dot':      return { id, kind, color, size: 3 + Math.random() * 3, offsetX: -16 + Math.random() * 32, duration: 700 + Math.random() * 200 };
    case 'streak':   return { id, kind, color, size: 6 + Math.random() * 4, offsetX: -10 + Math.random() * 20, offsetY: -8 + Math.random() * 16, duration: 500 + Math.random() * 200 };
    case 'zzz':      return { id, kind, color, size: 12 + Math.random() * 4, offsetX: 6 + Math.random() * 10, duration: 1800 + Math.random() * 500 };
    case 'heart':    return { id, kind, color, size: 10 + Math.random() * 4, offsetX: -8 + Math.random() * 16, duration: 1100 + Math.random() * 400 };
    default:         return { id, kind, color, size: 4, offsetX: 0, duration: 800 };
  }
}

export default function ChatPet({ petId, messagesCount }) {
  const [pet, setPet] = useState(() => getPet(petId));
  const [wiggle, setWiggle] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [particles, setParticles] = useState([]);
  const [muted, setMutedState] = useState(() => isMuted());
  const timersRef = useRef([]);
  const prevCountRef = useRef(messagesCount);

  // Make sure the catalog is hydrated before resolving the pet.
  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureCatalog();
      if (alive) setPet(getPet(petId));
    })();
    return () => { alive = false; };
  }, [petId]);

  // Wiggle reaction whenever the assistant adds a new message. Also play the
  // pet's signature sound — but only when the count grew (skip initial mount).
  useEffect(() => {
    if (!pet || pet.id === 'none') return undefined;
    const prev = prevCountRef.current;
    prevCountRef.current = messagesCount;
    if (messagesCount <= prev) return undefined; // no new message
    setWiggle(true);
    playPetSound(pet.id);
    const t = setTimeout(() => setWiggle(false), 900);
    return () => clearTimeout(t);
  }, [messagesCount, pet]);

  const behaviour = pet ? PET_BEHAVIOUR[pet.id] : null;

  // Continuous particle emitter — one interval per equipped pet.
  useEffect(() => {
    // Reset any previous timers if pet changed.
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setParticles([]);

    if (!pet || !behaviour || pet.id === 'none') return undefined;

    const { interval, max, kind, color } = behaviour.particle;

    const tick = () => {
      setParticles((prev) => {
        if (prev.length >= max) return prev;
        const next = buildParticle(kind, color);
        const removal = setTimeout(() => {
          setParticles((cur) => cur.filter((p) => p.id !== next.id));
        }, next.duration + 50);
        timersRef.current.push(removal);
        return [...prev, next];
      });
    };

    const id = setInterval(tick, interval);
    return () => {
      clearInterval(id);
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [pet, behaviour]);

  const Icon = useMemo(() => (pet ? ICON_MAP[pet.icon] : null), [pet]);
  if (!pet || pet.id === 'none' || !Icon) return null;

  const onTap = () => {
    setTapped(true);
    playPetSound(pet.id);
    setTimeout(() => setTapped(false), 600);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    // Quick audio cue when unmuting so the user hears the change.
    if (!next) setTimeout(() => playPetSound(pet.id), 60);
  };

  const idleAnim = behaviour?.bobAnim || 'pet-bob';

  return (
    <>
      <style>{`
        @keyframes pet-bob       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pet-bob-slow  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-3px) rotate(-2deg)} }
        @keyframes pet-float     { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-5px) translateX(2px)} 66%{transform:translateY(-2px) translateX(-3px)} }
        @keyframes pet-hop       { 0%,60%,100%{transform:translateY(0) scaleY(1)} 70%{transform:translateY(-14px) scaleY(1.05)} 80%{transform:translateY(-4px) scaleY(0.95)} }
        @keyframes pet-wag       { 0%,100%{transform:translateY(-2px) rotate(-4deg)} 50%{transform:translateY(-2px) rotate(4deg)} }
        @keyframes pet-jitter    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 50%{transform:translateX(0)} 75%{transform:translateX(3px)} }
        @keyframes pet-wiggle    { 0%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-8px) rotate(-8deg)} 50%{transform:translateY(-12px) rotate(0)} 75%{transform:translateY(-8px) rotate(8deg)} 100%{transform:translateY(0) rotate(0)} }
        @keyframes pet-pop       { 0%{transform:scale(1)} 50%{transform:scale(1.25)} 100%{transform:scale(1)} }

        @keyframes pet-spark-up    { 0%{opacity:1;transform:translateY(0) scaleY(1)} 100%{opacity:0;transform:translateY(-44px) scaleY(0.4)} }
        @keyframes pet-flame-up    { 0%{opacity:0.95;transform:translateY(0) scale(1)}   100%{opacity:0;transform:translateY(-52px) scale(0.4)} }
        @keyframes pet-bubble-up   { 0%{opacity:0.9;transform:translateY(0) scale(0.7)}  100%{opacity:0;transform:translateY(-58px) scale(1.1)} }
        @keyframes pet-twinkle     { 0%{opacity:0;transform:scale(0.4) rotate(0)} 50%{opacity:1;transform:scale(1) rotate(180deg)} 100%{opacity:0;transform:scale(0.6) rotate(360deg)} }
        @keyframes pet-sparkle-fall{ 0%{opacity:1;transform:translateY(0) translateX(0)} 100%{opacity:0;transform:translateY(48px) translateX(4px)} }
        @keyframes pet-dot-pop     { 0%{opacity:1;transform:translateY(0) scale(0.6)}    100%{opacity:0;transform:translateY(-30px) scale(1.2)} }
        @keyframes pet-streak      { 0%{opacity:0.9;transform:translateX(0) scaleX(0.4)} 100%{opacity:0;transform:translateX(34px) scaleX(1.2)} }
        @keyframes pet-zzz         { 0%{opacity:0;transform:translateY(0) translateX(0) scale(0.5)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-46px) translateX(10px) scale(1.1)} }
        @keyframes pet-heart-up    { 0%{opacity:1;transform:translateY(0) scale(0.6)} 100%{opacity:0;transform:translateY(-40px) scale(1.1)} }

        @keyframes pet-aura-pulse  { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.65;transform:scale(1.15)} }
      `}</style>

      <div
        className="fixed z-30 select-none"
        style={{ right: '16px', bottom: '120px', width: '56px', height: '56px' }}
      >
        {/* Extra aura behind some pets (mystic bird, golden cat, phoenix). */}
        {behaviour?.extraAura && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '9999px',
              background: `radial-gradient(circle, ${pet.color}55 0%, transparent 70%)`,
              animation: 'pet-aura-pulse 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Particles layer — absolutely positioned over the pet, no pointer events. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '0',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {particles.map(renderParticle)}
        </div>

        {/* The pet bubble itself. */}
        <button
          type="button"
          onClick={onTap}
          title={pet.name}
          aria-label={`Mascota: ${pet.name}`}
          data-testid="chat-pet"
          className="focus:outline-none"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '9999px',
            border: `2px solid ${pet.color}`,
            background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${pet.color} 35%, transparent), color-mix(in srgb, var(--card) 80%, transparent))`,
            boxShadow: `0 0 18px color-mix(in srgb, ${pet.color} 55%, transparent), 0 4px 12px rgba(0,0,0,0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: tapped
              ? 'pet-pop 600ms ease-out'
              : wiggle
                ? 'pet-wiggle 900ms ease-in-out'
                : `${idleAnim} 2.8s ease-in-out infinite`,
            cursor: 'pointer',
          }}
        >
          <Icon
            className="w-7 h-7"
            style={{
              color: pet.color,
              filter: `drop-shadow(0 0 6px ${pet.color})`,
            }}
          />
        </button>

        {/* Mute toggle — tiny corner button so users can silence the pet
            without leaving the chat. Persisted via localStorage. */}
        <button
          type="button"
          onClick={toggleMute}
          title={muted ? 'Activar sonido' : 'Silenciar mascota'}
          aria-label={muted ? 'Activar sonido de mascota' : 'Silenciar mascota'}
          data-testid="chat-pet-mute"
          className="focus:outline-none"
          style={{
            position: 'absolute',
            left: '-4px',
            bottom: '-4px',
            width: '22px',
            height: '22px',
            borderRadius: '9999px',
            border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
            background: 'color-mix(in srgb, var(--card) 92%, transparent)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            cursor: 'pointer',
            color: muted ? 'var(--muted-foreground)' : pet.color,
            transition: 'transform 150ms',
          }}
        >
          {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
      </div>
    </>
  );
}

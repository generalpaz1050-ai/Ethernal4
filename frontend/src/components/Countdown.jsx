// Lightweight live countdown that re-renders every second.
import React, { useEffect, useState } from 'react';

function formatRemaining(target) {
  if (!target) return null;
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { ready: true, text: '¡Listo!' };

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) {
    return { ready: false, text: `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
  }
  return { ready: false, text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
}

export default function Countdown({ targetIso, className, style, prefix = '', readyText = 'Listo' }) {
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);

  if (!target) return null;
  const info = formatRemaining(target);
  if (!info) return null;

  return (
    <span className={className} style={style} data-ticks={tick}>
      {info.ready ? readyText : `${prefix}${info.text}`}
    </span>
  );
}

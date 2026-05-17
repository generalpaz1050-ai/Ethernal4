import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Gift, Coins, Sparkles, Clock } from 'lucide-react';
import { dailyBoxAPI } from '../lib/api';
import { toast } from 'sonner';

const RARITY_COLORS = {
  common:    { ring: '#9ca3af', glow: 'rgba(156,163,175,0.65)', label: 'Común' },
  rare:      { ring: '#60a5fa', glow: 'rgba(96,165,250,0.75)',  label: 'Raro' },
  epic:      { ring: '#a855f7', glow: 'rgba(168,85,247,0.85)',  label: 'Épico' },
  legendary: { ring: '#f59e0b', glow: 'rgba(245,158,11,0.9)',   label: 'Legendario' },
};

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DailyBox({ onClaimed }) {
  const [status, setStatus] = useState(null);   // { can_claim, next_claim_at, prizes }
  const [openDialog, setOpenDialog] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [result, setResult] = useState(null);   // { prize, kyr_balance }
  const [now, setNow] = useState(Date.now());
  const spinTimer = useRef(null);

  useEffect(() => {
    refresh();
  }, []);

  // 1s ticker for the countdown when locked.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Refresh status when the countdown reaches 0.
  useEffect(() => {
    if (!status?.next_claim_at || status.can_claim) return;
    const target = new Date(status.next_claim_at).getTime();
    if (now >= target) refresh();
  }, [now, status]);

  const refresh = async () => {
    try {
      const r = await dailyBoxAPI.status();
      setStatus(r.data);
    } catch (e) { /* ignore */ }
  };

  const cleanupSpin = () => {
    if (spinTimer.current) {
      clearInterval(spinTimer.current);
      spinTimer.current = null;
    }
  };

  useEffect(() => () => cleanupSpin(), []);

  const handleOpen = () => {
    setOpenDialog(true);
    setResult(null);
  };

  const handleClaim = async () => {
    if (spinning || !status?.can_claim) return;
    setSpinning(true);
    setResult(null);

    // Start the visual roulette animation BEFORE we know the result.
    const prizes = status.prizes || [];
    let idx = 0;
    spinTimer.current = setInterval(() => {
      idx = (idx + 1) % prizes.length;
      setHighlightIdx(idx);
    }, 90);

    try {
      const r = await dailyBoxAPI.claim();
      const { winning_index, prize, kyr_balance, next_claim_at } = r.data;

      // Decelerate towards the winning index for a satisfying stop.
      cleanupSpin();
      const targetSteps = 12 + winning_index;
      let step = 0;
      let cur = idx;
      const decelerate = () => {
        cur = (cur + 1) % prizes.length;
        setHighlightIdx(cur);
        step += 1;
        if (step < targetSteps - 4 && cur !== winning_index) {
          spinTimer.current = setTimeout(decelerate, 90);
        } else if (cur === winning_index && step >= targetSteps - 4) {
          // Stopped on winner — reveal result.
          setSpinning(false);
          setResult({ prize, kyr_balance });
          setStatus((prev) => prev ? { ...prev, can_claim: false, next_claim_at } : prev);
          if (onClaimed) onClaimed(kyr_balance);
        } else {
          // Slow down progressively until landing on winner.
          const delay = 90 + step * 25;
          spinTimer.current = setTimeout(decelerate, delay);
        }
      };
      decelerate();
    } catch (e) {
      cleanupSpin();
      setSpinning(false);
      const detail = e?.response?.data?.detail || 'No se pudo abrir la caja';
      toast.error(detail);
      refresh();
    }
  };

  const remainingMs = status?.next_claim_at
    ? new Date(status.next_claim_at).getTime() - now
    : 0;
  const remainingLabel = formatRemaining(remainingMs);
  const canClaim = !!status?.can_claim;

  return (
    <>
      <Card
        className="glass border-themed cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
        onClick={handleOpen}
        data-testid="daily-box-card"
      >
        <CardContent className="py-4 flex items-center gap-4">
          <div
            className="relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: canClaim
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)'
                : 'color-mix(in srgb, var(--muted) 70%, transparent)',
              boxShadow: canClaim ? '0 0 24px rgba(251,191,36,0.55)' : 'none',
              transition: 'all 200ms',
            }}
          >
            <Gift
              className={`w-7 h-7 ${canClaim ? 'animate-pulse' : ''}`}
              style={{ color: canClaim ? '#1a0f08' : 'var(--muted-foreground)' }}
            />
            {canClaim && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full"
                style={{ background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg" style={{ color: 'var(--foreground)' }}>
                Caja Diaria
              </h3>
              {canClaim && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: '#ef4444', color: '#fff' }}>
                  ¡Disponible!
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {canClaim
                ? 'Gira la ruleta y gana hasta 500 Kyr gratis.'
                : remainingLabel
                  ? <>Vuelve en <span className="font-mono font-semibold" style={{ color: 'var(--foreground)' }}>{remainingLabel}</span></>
                  : 'Cargando...'}
            </p>
          </div>

          <Button
            size="sm"
            className={canClaim ? 'gradient-primary font-semibold' : ''}
            variant={canClaim ? 'default' : 'outline'}
            disabled={!canClaim}
            data-testid="daily-box-open-btn"
          >
            {canClaim ? (<><Sparkles className="w-4 h-4 mr-1.5" /> Abrir</>)
                      : (<><Clock className="w-4 h-4 mr-1.5" /> En espera</>)}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={(o) => { if (!spinning) setOpenDialog(o); }}>
        <DialogContent className="glass-strong border-themed sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Gift className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Caja Diaria Kyr
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Una caja gratis cada 24 horas. La rareza define cuántas Kyr ganas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {(status?.prizes || []).map((p, i) => {
              const rarity = RARITY_COLORS[p.rarity] || RARITY_COLORS.common;
              const isActive = (spinning || result) && i === highlightIdx;
              const isWinner = result && result.prize.amount === p.amount;
              return (
                <div
                  key={p.amount}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 transition-all"
                  style={{
                    borderColor: isActive || isWinner ? rarity.ring : 'var(--border)',
                    background: isActive || isWinner
                      ? `color-mix(in srgb, ${rarity.ring} 18%, transparent)`
                      : 'color-mix(in srgb, var(--card) 60%, transparent)',
                    boxShadow: isActive || isWinner ? `0 0 18px ${rarity.glow}` : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                      style={{
                        background: rarity.ring,
                        color: '#1a0f08',
                        boxShadow: isWinner ? `0 0 16px ${rarity.glow}` : 'none',
                      }}
                    >
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                        {p.amount} Kyr
                        {isWinner && <span className="text-xs">🎉</span>}
                      </div>
                      <div className="text-xs uppercase tracking-wider" style={{ color: rarity.ring }}>
                        {rarity.label}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                    {Math.round((p.weight || 0) * 100)}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            {result ? (
              <div className="text-center space-y-3 pt-2">
                <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                  ¡Ganaste {result.prize.amount} Kyr!
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Nuevo saldo: <span className="font-bold" style={{ color: 'var(--foreground)' }}>{result.kyr_balance} Kyr</span>
                </p>
                <Button
                  onClick={() => setOpenDialog(false)}
                  className="gradient-primary font-semibold w-full"
                  data-testid="daily-box-close-btn"
                >
                  ¡Genial!
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleClaim}
                disabled={!canClaim || spinning}
                className="gradient-primary hover:opacity-90 font-semibold w-full mt-2"
                data-testid="daily-box-spin-btn"
              >
                {spinning
                  ? (<><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Girando...</>)
                  : canClaim
                    ? (<><Sparkles className="w-4 h-4 mr-2" /> Girar la ruleta</>)
                    : (<><Clock className="w-4 h-4 mr-2" /> Disponible en {remainingLabel || '...'}</>)
                }
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

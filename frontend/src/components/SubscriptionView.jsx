import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ArrowLeft, Crown, Sparkles, Gem, Check, MessageCircle, Users, BarChart3, Loader2 } from 'lucide-react';
import { subscriptionAPI } from '../lib/api';
import { toast } from 'sonner';

const PLAN_ICON = {
  silver: Sparkles,
  gold: Crown,
  diamond: Gem,
};

const PLAN_ACCENT = {
  silver: { from: '#9ca3af', to: '#6b7280' },
  gold:   { from: '#fbbf24', to: '#d97706' },
  diamond:{ from: '#60a5fa', to: '#a855f7' },
};

export default function SubscriptionView({ t, user, onBack }) {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([
          subscriptionAPI.plans(),
          subscriptionAPI.stats(),
        ]);
        setPlans(p.data.plans || []);
        setStats(s.data || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // After Mercado Pago redirects the user back, the URL contains:
  //   ?mp=1&plan=gold&payment_id=...&status=approved&preference_id=...
  // We use that to verify the payment server-side (in case the webhook
  // hasn't landed yet) and refresh stats. The query string is cleared after.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mp') !== '1') return;
    const paymentId = params.get('payment_id') || params.get('collection_id');
    const status = params.get('status') || params.get('collection_status') || params.get('mp_status');
    const planLabel = params.get('plan') || 'plan';

    // Clean the URL immediately so refreshes don't re-trigger.
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    (async () => {
      if (status === 'failure' || status === 'rejected') {
        toast.error('Pago rechazado. Si crees que es un error vuelve a intentarlo.');
        return;
      }
      if (status === 'pending' || status === 'in_process') {
        toast('El pago está pendiente de aprobación. Te avisaremos cuando se confirme.');
      }
      if (paymentId) {
        try {
          const v = await subscriptionAPI.verify({ payment_id: paymentId });
          if (v.data?.activated) {
            toast.success(`¡Plan ${planLabel.toUpperCase()} activado!`);
          } else if (status === 'approved') {
            toast('Pago recibido. Activación en proceso...');
          }
        } catch (e) {
          console.error('verify failed', e);
        }
        // Refresh stats either way
        try {
          const s = await subscriptionAPI.stats();
          setStats(s.data);
        } catch (e) { /* ignore */ }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async (plan) => {
    setCheckoutPlan(plan);
    setBusy(true);
    try {
      // Tell the backend where MP should redirect the user after the checkout.
      const returnUrl = window.location.origin + window.location.pathname;
      const res = await subscriptionAPI.checkout(plan.key, returnUrl);

      // 1) Owner self-grant (no payment needed) → refresh + toast.
      if (res.data?.success && res.data?.owner_granted) {
        toast.success(`Plan ${plan.label} activado (modo owner)`);
        const s = await subscriptionAPI.stats();
        setStats(s.data);
        return;
      }

      // 2) Real checkout → redirect the user to Mercado Pago.
      if (res.data?.checkout_url) {
        // Small UX touch: tell the user we're sending them out.
        toast.success('Redirigiendo a Mercado Pago...');
        window.location.href = res.data.checkout_url;
        return;
      }

      // 3) Fallback: backend says payments aren't ready.
      setCheckoutMessage(res.data?.message || 'No se pudo iniciar el pago.');
      setCheckoutOpen(true);
    } catch (e) {
      setCheckoutMessage(e?.response?.data?.detail || 'No se pudo procesar la solicitud.');
      setCheckoutOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const currentPlanKey = stats?.plan || 'silver';
  const isOwner = !!stats?.is_owner;
  const charsToday = stats?.characters_created_today || 0;
  const charsLimit = stats?.characters_daily_limit;
  const progressPct = stats?.characters_unlimited
    ? 0
    : Math.min(100, Math.round((charsToday / Math.max(1, Number(charsLimit))) * 100));

  return (
    <div className="gradient-dark min-h-screen">
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="px-2" style={{ color: 'var(--foreground)' }}>
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.chat.back}</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {t.subscription?.title || 'Mi Plan & Estadísticas'}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            {/* Current Plan & Stats */}
            <Card className="glass-strong border-themed overflow-hidden">
              <div
                className="px-6 py-5 flex items-center justify-between gap-4"
                style={{
                  background: `linear-gradient(135deg, ${PLAN_ACCENT[currentPlanKey]?.from || '#9ca3af'} 0%, ${PLAN_ACCENT[currentPlanKey]?.to || '#6b7280'} 100%)`,
                }}
              >
                <div className="flex items-center gap-3 text-white">
                  {React.createElement(PLAN_ICON[currentPlanKey] || Sparkles, { className: 'w-8 h-8' })}
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-90">
                      {isOwner ? 'Rango Owner' : 'Tu rango actual'}
                    </p>
                    <h2 className="text-2xl font-bold capitalize">
                      {isOwner ? 'Owner 👑' : (stats?.plan_label || 'Silver')}
                    </h2>
                  </div>
                </div>
                {stats?.subscription_end && !isOwner && (
                  <Badge className="bg-white/20 text-white border-0">
                    Renueva: {new Date(stats.subscription_end).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              <CardContent className="py-6 space-y-6">
                {/* Daily character creation progress */}
                <div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                      <Users className="w-4 h-4" /> Personajes creados hoy
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {charsToday} / {charsLimit}
                    </span>
                  </div>
                  {!stats?.characters_unlimited ? (
                    <Progress value={progressPct} className="h-2" />
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sin límite diario</p>
                  )}
                </div>

                {/* Messages info (unlimited on all plans) */}
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  <MessageCircle className="w-4 h-4" />
                  <span>Mensajes: ilimitados en todos los planes</span>
                </div>

                {/* Ads notice */}
                {stats?.has_ads ? (
                  <div className="rounded-lg px-3 py-2 text-xs flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--foreground)' }}>
                    <span className="font-semibold">Tu plan actual incluye anuncios.</span>
                    <span style={{ color: 'var(--muted-foreground)' }}>Mejora a Gold o Diamond para quitarlos.</span>
                  </div>
                ) : (
                  <div className="rounded-lg px-3 py-2 text-xs flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--foreground)' }}>
                    <Check className="w-4 h-4" /> <span>Estás libre de anuncios.</span>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatBox icon={Users} label="Personajes creados" value={stats?.characters_count || 0} />
                  <StatBox icon={MessageCircle} label="Chats activos" value={stats?.chats_count || 0} />
                  <StatBox icon={BarChart3} label="Mensajes totales" value={stats?.total_messages_sent || 0} />
                </div>
              </CardContent>
            </Card>

            {/* Plans */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
                Mejora tu experiencia
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {plans.map((plan) => {
                  const Icon = PLAN_ICON[plan.key] || Sparkles;
                  const isCurrent = plan.key === currentPlanKey;
                  const accent = PLAN_ACCENT[plan.key] || PLAN_ACCENT.silver;
                  const isFree = plan.price_usd === 0;
                  return (
                    <Card
                      key={plan.key}
                      className={`glass-strong overflow-hidden relative transition-all ${
                        isCurrent ? 'ring-2 ring-themed' : 'hover:scale-[1.02]'
                      }`}
                      style={isCurrent ? { boxShadow: `0 0 30px ${accent.from}66` } : {}}
                    >
                      {plan.key === 'diamond' && (
                        <div className="absolute top-3 right-3">
                          <Badge style={{ background: accent.from, color: '#fff' }}>Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center pb-3">
                        <div
                          className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                          }}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: 'var(--foreground)' }}>
                          {plan.label}
                        </CardTitle>
                        <CardDescription className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
                          {plan.price_label}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent.from }} />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrent ? (
                          <Button disabled className="w-full" variant="outline" style={{ color: 'var(--foreground)' }}>
                            Plan actual
                          </Button>
                        ) : isFree ? (
                          <Button disabled className="w-full" variant="outline" style={{ color: 'var(--muted-foreground)' }}>
                            Por defecto
                          </Button>
                        ) : (
                          <Button
                            disabled={busy}
                            onClick={() => handleBuy(plan)}
                            className="w-full font-semibold text-white hover:opacity-90"
                            style={{
                              background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                            }}
                          >
                            {busy && checkoutPlan?.key === plan.key ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                            ) : (
                              <>Comprar {plan.label}</>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="glass-strong border-themed">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Pagos próximamente</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              {checkoutMessage}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setCheckoutOpen(false)} className="gradient-primary hover:opacity-90 w-full">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div
      className="rounded-lg p-4 text-center"
      style={{
        background: 'color-mix(in srgb, var(--secondary) 50%, transparent)',
        border: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
      }}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--primary)' }} />
      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </div>
  );
}

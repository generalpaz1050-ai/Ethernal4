import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { ArrowLeft, Coins, Frame as FrameIcon, Image as ImageIcon, Check, ShoppingCart, Sparkles, Clock, PawPrint, Cat, Dog, Rabbit, Bird, Fish, Squirrel, Flame } from 'lucide-react';
import { shopAPI } from '../lib/api';
import Countdown from './Countdown';
import { toast } from 'sonner';

const ICON_MAP = { Cat, Dog, Rabbit, Bird, Fish, Squirrel, Flame, Sparkles };

const RARITY_COLORS = {
  common:    { label: 'Común',     color: '#9ca3af' },
  uncommon:  { label: 'Inusual',   color: '#34d399' },
  rare:      { label: 'Raro',      color: '#60a5fa' },
  epic:      { label: 'Épico',     color: '#a855f7' },
  legendary: { label: 'Legendario',color: '#f59e0b' },
  mythic:    { label: 'Mítico',    color: '#ef4444' },
};

export default function ShopView({ user, onBack, onUserUpdate }) {
  const [items, setItems] = useState({ frames: [], banners: [], pets: [], monthly_grants: {} });
  const [wallet, setWallet] = useState({
    kyr_balance: 0, owned_frames: ['default'], owned_banners: ['default'], owned_pets: ['none'],
    equipped_frame: 'default', equipped_banner: 'default', equipped_pet: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('frames');

  const refresh = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([shopAPI.items(), shopAPI.wallet()]);
      setItems(a.data);
      setWallet(b.data);
      // Keep top-bar Kyr badge / equipped frame in sync with the wallet.
      if (onUserUpdate) onUserUpdate();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo cargar la tienda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handlePurchase = async (kind, id) => {
    try {
      const res = await shopAPI.purchase(kind, id);
      toast.success('¡Compra realizada!');
      setWallet((w) => ({
        ...w,
        kyr_balance: res.data.kyr_balance,
        owned_frames: res.data.owned_frames || w.owned_frames,
        owned_banners: res.data.owned_banners || w.owned_banners,
        owned_pets: res.data.owned_pets || w.owned_pets,
      }));
      if (onUserUpdate) onUserUpdate();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo comprar');
    }
  };

  const handleEquip = async (kind, id) => {
    try {
      const res = await shopAPI.equip(kind, id);
      toast.success('Equipado');
      setWallet((w) => ({
        ...w,
        equipped_frame: kind === 'frame' ? res.data.equipped_frame : w.equipped_frame,
        equipped_banner: kind === 'banner' ? res.data.equipped_banner : w.equipped_banner,
        equipped_pet: kind === 'pet' ? res.data.equipped_pet : w.equipped_pet,
      }));
      if (onUserUpdate) onUserUpdate();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo equipar');
    }
  };

  const monthlyGrant = items.monthly_grants?.[user?.plan] ?? 0;
  const ownedFrames = useMemo(() => new Set(wallet.owned_frames || []), [wallet.owned_frames]);
  const ownedBanners = useMemo(() => new Set(wallet.owned_banners || []), [wallet.owned_banners]);
  const ownedPets = useMemo(() => new Set(wallet.owned_pets || ['none']), [wallet.owned_pets]);

  const FrameCard = ({ item }) => {
    const owned = ownedFrames.has(item.id);
    const equipped = wallet.equipped_frame === item.id;
    const ring = item.ring && item.ring !== 'none' ? item.ring : '0 0 0 1px var(--border)';
    const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
    return (
      <Card className="glass overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center gap-3">
          <div className="py-3">
            <Avatar
              className="w-24 h-24"
              style={{ boxShadow: ring }}
            >
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="gradient-primary text-2xl">
                {(user?.name || '?')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</h3>
            <Badge
              variant="outline"
              className="text-[10px] mt-1"
              style={{ color: rarity.color, borderColor: rarity.color }}
            >
              {rarity.label}
            </Badge>
          </div>
          {equipped ? (
            <Badge className="gap-1" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Check className="w-3 h-3" /> Equipado
            </Badge>
          ) : owned ? (
            <Button size="sm" onClick={() => handleEquip('frame', item.id)} className="w-full gradient-primary">
              <Sparkles className="w-3 h-3 mr-1" /> Equipar
            </Button>
          ) : (
            <PurchaseButton item={item} kind="frame" onConfirm={handlePurchase} balance={wallet.kyr_balance} />
          )}
        </CardContent>
      </Card>
    );
  };

  const BannerCard = ({ item }) => {
    const owned = ownedBanners.has(item.id);
    const equipped = wallet.equipped_banner === item.id;
    const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
    return (
      <Card className="glass overflow-hidden">
        <CardContent className="p-4 flex flex-col gap-3">
          <div
            className="w-full h-28 rounded-lg relative overflow-hidden"
            style={{ background: item.background }}
          >
            <div className="absolute bottom-2 left-2">
              <Avatar className="w-12 h-12 ring-2" style={{ boxShadow: '0 0 0 2px var(--background)' }}>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="gradient-primary text-sm">
                  {(user?.name || '?')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</h3>
            <Badge
              variant="outline"
              className="text-[10px] mt-1"
              style={{ color: rarity.color, borderColor: rarity.color }}
            >
              {rarity.label}
            </Badge>
          </div>
          {equipped ? (
            <Badge className="gap-1 justify-center" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Check className="w-3 h-3" /> Equipado
            </Badge>
          ) : owned ? (
            <Button size="sm" onClick={() => handleEquip('banner', item.id)} className="w-full gradient-primary">
              <Sparkles className="w-3 h-3 mr-1" /> Equipar
            </Button>
          ) : (
            <PurchaseButton item={item} kind="banner" onConfirm={handlePurchase} balance={wallet.kyr_balance} />
          )}
        </CardContent>
      </Card>
    );
  };

  const PetCard = ({ item }) => {
    const owned = ownedPets.has(item.id);
    const equipped = wallet.equipped_pet === item.id;
    const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
    const Icon = ICON_MAP[item.icon];
    const isNone = item.id === 'none';
    return (
      <Card className="glass overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center relative"
            style={{
              border: `2px solid ${item.color}`,
              background: isNone
                ? 'color-mix(in srgb, var(--muted) 60%, transparent)'
                : `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${item.color} 35%, transparent), color-mix(in srgb, var(--card) 70%, transparent))`,
              boxShadow: isNone ? 'none' : `0 0 18px color-mix(in srgb, ${item.color} 55%, transparent)`,
            }}
          >
            {Icon ? (
              <Icon
                className="w-9 h-9"
                style={{
                  color: item.color,
                  filter: isNone ? 'none' : `drop-shadow(0 0 6px ${item.color})`,
                }}
              />
            ) : (
              <PawPrint className="w-9 h-9" style={{ color: 'var(--muted-foreground)' }} />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</h3>
            <Badge
              variant="outline"
              className="text-[10px] mt-1"
              style={{ color: rarity.color, borderColor: rarity.color }}
            >
              {rarity.label}
            </Badge>
            {item.description && (
              <p className="text-[11px] mt-2 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                {item.description}
              </p>
            )}
          </div>
          {equipped ? (
            <Badge className="gap-1" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Check className="w-3 h-3" /> Equipado
            </Badge>
          ) : owned ? (
            <Button size="sm" onClick={() => handleEquip('pet', item.id)} className="w-full gradient-primary" data-testid={`equip-pet-${item.id}`}>
              <Sparkles className="w-3 h-3 mr-1" /> Equipar
            </Button>
          ) : (
            <PurchaseButton item={item} kind="pet" onConfirm={handlePurchase} balance={wallet.kyr_balance} />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="gradient-dark min-h-screen">
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="px-2" style={{ color: 'var(--foreground)' }}>
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                Tienda Kyr
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-full">
            <Coins className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span className="font-bold" style={{ color: 'var(--foreground)' }}>
              {wallet.kyr_balance.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Kyr</span>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-3">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Recibes <strong style={{ color: 'var(--primary)' }}>{monthlyGrant} Kyr</strong> cada mes con tu plan{' '}
            <strong>{(user?.plan || 'silver').toUpperCase()}</strong>. Sube de plan para ganar más:
            Silver 500 · Gold 1500 · Diamond 3000.
          </p>
          {user?.kyr_next_grant_at && (
            <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
              <Clock className="w-3.5 h-3.5" />
              Próxima recompensa en:{' '}
              <Countdown
                targetIso={user.kyr_next_grant_at}
                className="font-mono font-semibold"
                style={{ color: 'var(--primary)' }}
                readyText="¡disponible! Recarga la página."
              />
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="glass-strong">
            <TabsTrigger value="frames" className="gap-2">
              <FrameIcon className="w-4 h-4" /> Marcos ({items.frames.length})
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <ImageIcon className="w-4 h-4" /> Banners ({items.banners.length})
            </TabsTrigger>
            <TabsTrigger value="pets" className="gap-2" data-testid="shop-pets-tab">
              <PawPrint className="w-4 h-4" /> Mascotas ({(items.pets || []).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frames" className="mt-6">
            {loading && <p style={{ color: 'var(--muted-foreground)' }}>Cargando...</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.frames.map((it) => (
                <FrameCard key={it.id} item={it} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="banners" className="mt-6">
            {loading && <p style={{ color: 'var(--muted-foreground)' }}>Cargando...</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.banners.map((it) => (
                <BannerCard key={it.id} item={it} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pets" className="mt-6">
            {loading && <p style={{ color: 'var(--muted-foreground)' }}>Cargando...</p>}
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Equipa una mascota y aparecerá al lado de tus chats. No molesta, solo te acompaña.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {(items.pets || []).map((it) => (
                <PetCard key={it.id} item={it} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PurchaseButton({ item, kind, onConfirm, balance }) {
  const canAfford = balance >= item.price;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="w-full gap-1"
          variant={canAfford ? 'default' : 'secondary'}
          disabled={!canAfford && item.price > 0}
          style={canAfford ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
        >
          <Coins className="w-3 h-3" />
          {item.price.toLocaleString()} Kyr
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="glass-strong border-themed">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Comprar {item.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se descontarán <strong>{item.price.toLocaleString()} Kyr</strong> de tu saldo
            (actual: {balance.toLocaleString()} Kyr). El ítem quedará disponible en tu inventario y podrás equiparlo cuando quieras.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(kind, item.id)}
            className="gradient-primary"
          >
            Confirmar compra
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

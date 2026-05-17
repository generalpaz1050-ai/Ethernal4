import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { ArrowLeft, Shield, Search, Trash2, Ban, CheckCircle2, Crown, Users, Bot, Coins, Plus } from 'lucide-react';
import { adminAPI } from '../lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';

export default function OwnerPanel({ t, currentUser, onUserUpdate, onBack }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [kyrTarget, setKyrTarget] = useState(null);     // user being recharged
  const [kyrAmount, setKyrAmount] = useState('100');
  const [kyrMode, setKyrMode] = useState('add');        // 'add' | 'set'

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data.users || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadCharacters = async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.listCharacters(params);
      setCharacters(res.data.characters || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudieron cargar los personajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadCharacters();
  }, []);

  const filteredUsers = users.filter((u) => {
    const text = search.toLowerCase();
    if (!text) return true;
    return (
      (u.email || '').toLowerCase().includes(text) ||
      (u.username || '').toLowerCase().includes(text) ||
      (u.name || '').toLowerCase().includes(text)
    );
  });

  const filteredChars = characters.filter((c) => {
    const text = search.toLowerCase();
    if (!text) return true;
    return (
      (c.name || '').toLowerCase().includes(text) ||
      (c.description || '').toLowerCase().includes(text) ||
      (c.ownerEmail || '').toLowerCase().includes(text) ||
      (c.tags || '').toLowerCase().includes(text)
    );
  });

  const onDeleteCharacter = async (id) => {
    try {
      await adminAPI.deleteCharacter(id);
      toast.success('Personaje eliminado');
      setCharacters((prev) => prev.filter((c) => (c._id || c.id) !== id));
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo eliminar');
    }
  };

  const onBanToggle = async (u) => {
    try {
      await adminAPI.banUser(u.user_id, !u.banned);
      toast.success(!u.banned ? 'Usuario baneado' : 'Usuario desbaneado');
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, banned: !u.banned } : x)));
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo actualizar');
    }
  };

  const onSetPlan = async (u, plan) => {
    try {
      await adminAPI.setSubscription(u.user_id, { plan, status: 'active', days: 365 });
      toast.success(`Plan actualizado a ${plan}`);
      loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo actualizar el plan');
    }
  };

  const onApplyKyr = async () => {
    if (!kyrTarget) return;
    const amount = parseInt(kyrAmount, 10);
    if (Number.isNaN(amount)) {
      toast.error('Ingresa un número válido');
      return;
    }
    try {
      const res = await adminAPI.setKyr(kyrTarget.user_id, amount, kyrMode);
      toast.success(
        kyrMode === 'set'
          ? `Saldo fijado en ${res.data.kyr_balance.toLocaleString()} Kyr`
          : `${amount >= 0 ? '+' : ''}${amount.toLocaleString()} Kyr → ${res.data.kyr_balance.toLocaleString()} Kyr`
      );
      setUsers((prev) =>
        prev.map((x) => (x.user_id === kyrTarget.user_id ? { ...x, kyr_balance: res.data.kyr_balance } : x))
      );
      // If the recharge target is the currently logged-in Owner, refresh their
      // global user state so the navbar Kyr badge and Shop wallet stay in sync.
      if (currentUser && kyrTarget.user_id === currentUser.user_id && onUserUpdate) {
        onUserUpdate();
      }
      setKyrTarget(null);
      setKyrAmount('100');
      setKyrMode('add');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo aplicar la recarga');
    }
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
              <Crown className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                Panel de Owner
              </h1>
            </div>
          </div>
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 input-themed"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="glass-strong">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" /> Usuarios ({users.length})
            </TabsTrigger>
            <TabsTrigger value="characters" className="gap-2">
              <Bot className="w-4 h-4" /> Personajes ({characters.length})
            </TabsTrigger>
          </TabsList>

          {/* Mobile search */}
          <div className="relative w-full mt-4 sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 input-themed"
            />
          </div>

          <TabsContent value="users" className="mt-6">
            {loading && <p style={{ color: 'var(--muted-foreground)' }}>Cargando...</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((u) => (
                <Card key={u.user_id} className="glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 ring-1 ring-themed">
                        <AvatarImage src={u.picture || u.avatar} />
                        <AvatarFallback className="gradient-primary">
                          {(u.username || u.email || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          {u.username || u.name || u.email}
                          {u.role === 'owner' && (
                            <Crown className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                          )}
                        </CardTitle>
                        <CardDescription className="truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {u.email}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {u.banned && (
                            <Badge variant="destructive" className="text-[10px]">BANEADO</Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {(u.subscription?.plan || 'silver').toUpperCase()}
                          </Badge>
                          {u.role && u.role !== 'user' && (
                            <Badge className="text-[10px]" style={{ background: 'var(--primary)' }}>
                              {u.role.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <Coins className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                        {(u.kyr_balance || 0).toLocaleString()}
                      </span>
                      <span>Kyr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Plan:</span>
                      <Select
                        value={u.subscription?.plan || 'silver'}
                        onValueChange={(v) => onSetPlan(u, v === 'silver' ? '' : v)}
                        disabled={u.role === 'owner'}
                      >
                        <SelectTrigger className="input-themed h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-strong border-themed">
                          <SelectItem value="silver">Silver (gratis)</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setKyrTarget(u); setKyrAmount('100'); setKyrMode('add'); }}
                      className="w-full gap-2"
                    >
                      <Plus className="w-4 h-4" /> Recargar Kyr
                    </Button>
                    <Button
                      variant={u.banned ? 'outline' : 'destructive'}
                      size="sm"
                      onClick={() => onBanToggle(u)}
                      disabled={u.role === 'owner'}
                      className="w-full gap-2"
                    >
                      {u.banned ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      {u.banned ? 'Desbanear' : 'Banear'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <p style={{ color: 'var(--muted-foreground)' }}>No hay usuarios.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="characters" className="mt-6">
            {loading && <p style={{ color: 'var(--muted-foreground)' }}>Cargando...</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChars.map((c) => (
                <Card key={c._id || c.id} className="glass">
                  <CardHeader className="pb-3">
                    <Avatar className="w-20 h-20 mx-auto ring-2 ring-themed">
                      <AvatarImage src={c.avatar} />
                      <AvatarFallback className="gradient-primary text-xl">
                        {c.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-center mt-2 text-base" style={{ color: 'var(--foreground)' }}>
                      {c.name}
                    </CardTitle>
                    <CardDescription className="text-center line-clamp-2 text-xs min-h-[32px]" style={{ color: 'var(--muted-foreground)' }}>
                      {c.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="text-[11px] text-center" style={{ color: 'var(--muted-foreground)' }}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {c.ownerUsername || c.ownerEmail || 'Anónimo'}
                    </div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {c.isPublic ? (
                        <Badge variant="secondary" className="text-[10px]">PÚBLICO</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">PRIVADO</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        ♥ {c.likes || 0}
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full gap-2">
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-strong border-themed">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar {c.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción elimina permanentemente el personaje de {c.ownerUsername || c.ownerEmail || 'el usuario'} y todos sus chats asociados. No se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteCharacter(c._id || c.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
              {!loading && filteredChars.length === 0 && (
                <p style={{ color: 'var(--muted-foreground)' }}>No hay personajes.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Kyr recharge dialog */}
      <Dialog open={!!kyrTarget} onOpenChange={(open) => !open && setKyrTarget(null)}>
        <DialogContent className="glass-strong border-themed">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Recargar Kyr
            </DialogTitle>
            <DialogDescription>
              {kyrTarget && (
                <>
                  Usuario: <strong>{kyrTarget.username || kyrTarget.name || kyrTarget.email}</strong>
                  <br />
                  Saldo actual: <strong>{(kyrTarget.kyr_balance || 0).toLocaleString()} Kyr</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label style={{ color: 'var(--foreground)' }}>Modo</Label>
              <Select value={kyrMode} onValueChange={setKyrMode}>
                <SelectTrigger className="input-themed mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-themed">
                  <SelectItem value="add">Sumar / Restar al saldo</SelectItem>
                  <SelectItem value="set">Fijar saldo exacto</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {kyrMode === 'add'
                  ? 'Usa números negativos para descontar Kyr.'
                  : 'El saldo del usuario quedará exactamente en este valor.'}
              </p>
            </div>
            <div>
              <Label style={{ color: 'var(--foreground)' }}>
                {kyrMode === 'set' ? 'Saldo final' : 'Cantidad (puede ser negativa)'}
              </Label>
              <Input
                type="number"
                value={kyrAmount}
                onChange={(e) => setKyrAmount(e.target.value)}
                className="input-themed mt-1.5"
                placeholder="Ej: 500 ó -200"
              />
            </div>
            {/* Shortcuts */}
            <div className="flex flex-wrap gap-2">
              {[50, 100, 500, 1000, 5000].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setKyrMode('add'); setKyrAmount(String(n)); }}
                  className="text-xs"
                >
                  +{n}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKyrTarget(null)}>Cancelar</Button>
            <Button onClick={onApplyKyr} className="gradient-primary gap-2">
              <Coins className="w-4 h-4" />
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

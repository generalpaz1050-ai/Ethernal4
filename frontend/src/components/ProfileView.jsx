import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import { ArrowLeft, Upload, Palette, Globe, Save, AlertTriangle, Flame as FlameIcon } from 'lucide-react';
import { toast } from 'sonner';
import { avatarRingStyle, getBannerBackground } from '../lib/cosmetics';

export default function ProfileView({ t, user, currentTheme, onUpdateProfile, onBack }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    theme: user?.theme || currentTheme,
    language: user?.language || 'es',
    gender: user?.gender || '',
    age: user?.age || '',
    pronouns: user?.pronouns || '',
    nsfw_enabled: !!user?.nsfw_enabled,
    animated_bg: (() => {
      try {
        const v = localStorage.getItem('ethernal-animated-bg');
        return v === null ? true : v === '1';
      } catch (e) { return true; }
    })(),
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [showNsfwDialog, setShowNsfwDialog] = useState(false);
  const fileRef = useRef(null);

  const bannerBg = getBannerBackground(user?.equipped_banner) ||
    'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--card)) 100%)';

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setFormData({ ...formData, avatar: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onUpdateProfile(formData);
    setSaving(false);
    if (ok) toast.success(t.profile.changesSaved);
  };

  const handleNsfwToggle = async (checked) => {
    // Turning OFF — persist immediately so the switch reflects reality.
    if (!checked) {
      setFormData((prev) => ({ ...prev, nsfw_enabled: false }));
      const ok = await onUpdateProfile({ nsfw_enabled: false });
      if (ok) toast.success('Contenido NSFW desactivado.');
      return;
    }
    // Turning ON — require explicit 18+ confirmation the first time.
    if (!user?.age_confirmed) {
      setShowNsfwDialog(true);
      return;
    }
    setFormData((prev) => ({ ...prev, nsfw_enabled: true }));
    const ok = await onUpdateProfile({ nsfw_enabled: true });
    if (ok) toast.success('Contenido NSFW activado.');
  };

  const confirmAge = async () => {
    setShowNsfwDialog(false);
    setSaving(true);
    // Persist immediately: record the 18+ acceptance and enable NSFW in one call.
    const ok = await onUpdateProfile({
      nsfw_enabled: true,
      age_confirmed: true,
    });
    setSaving(false);
    if (ok) {
      setFormData((prev) => ({ ...prev, nsfw_enabled: true }));
      toast.success('Contenido NSFW activado (+18 confirmado).');
    }
  };

  const themeOptions = [
    { value: 'medievalWarm', label: t.themes.medievalWarm },
    { value: 'darkMinimalist', label: t.themes.darkMinimalist },
    { value: 'primavera', label: t.themes.primavera },
    { value: 'darkFantasy', label: t.themes.darkFantasy },
    { value: 'cyberpunk', label: t.themes.cyberpunk },
    { value: 'warmRomance', label: t.themes.warmRomance },
  ];

  return (
    <div className="gradient-dark min-h-screen">
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="px-2" style={{ color: 'var(--foreground)' }}>
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.chat.back}</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{t.profile.editProfile}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto glass-strong border-themed overflow-hidden">
          {/* Equipped banner preview */}
          <div className="w-full h-32 sm:h-40" style={{ background: bannerBg }} />
          <CardContent className="py-8 -mt-16">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32" style={avatarRingStyle(user?.equipped_frame)}>
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="gradient-primary text-4xl">{(formData.name || 'U')[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="border-themed" style={{ color: 'var(--foreground)' }}>
                  <Upload className="w-4 h-4 mr-2" /> {t.profile.uploadPhoto}
                </Button>
              </div>

              <div>
                <Label style={{ color: 'var(--foreground)' }}>{t.profile.displayName}</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t.profile.displayNamePlaceholder} className="input-themed mt-1.5" />
              </div>

              <div>
                <Label style={{ color: 'var(--foreground)' }}>{t.profile.bio}</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder={t.profile.bioPlaceholder} rows={4} className="input-themed mt-1.5" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label style={{ color: 'var(--foreground)' }}>{t.profile.genderLabel}</Label>
                  <Select value={formData.gender || ''} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                    <SelectTrigger className="input-themed h-12 mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent className="glass-strong border-themed">
                      <SelectItem value="male">{t.profile.genderMale}</SelectItem>
                      <SelectItem value="female">{t.profile.genderFemale}</SelectItem>
                      <SelectItem value="non-binary">{t.profile.genderNonBinary}</SelectItem>
                      <SelectItem value="prefer_not_say">{t.profile.genderPreferNotSay}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: 'var(--foreground)' }}>{t.profile.ageLabel}</Label>
                  <Input value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder={t.profile.agePlaceholder} className="input-themed mt-1.5 h-12" />
                </div>
              </div>

              <div>
                <Label style={{ color: 'var(--foreground)' }}>{t.profile.pronounsLabel}</Label>
                <Input value={formData.pronouns} onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })} placeholder={t.profile.pronounsPlaceholder} className="input-themed mt-1.5" />
              </div>

              {/* NSFW toggle */}
              <div className="rounded-lg border border-themed p-4" style={{ background: 'rgba(0,0,0,0.18)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Label className="flex items-center gap-2 font-semibold" style={{ color: 'var(--foreground)' }}>
                      <FlameIcon className="w-4 h-4" style={{ color: '#ef4444' }} />
                      Contenido NSFW (+18)
                      {formData.nsfw_enabled && (
                        <Badge className="text-[10px]" style={{ background: '#ef4444', color: '#fff' }}>ACTIVO</Badge>
                      )}
                    </Label>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      Permite respuestas adultas y escenas explícitas en tus roleplays. Requiere confirmar
                      que tienes más de 18 años. Puedes desactivarlo cuando quieras.
                    </p>
                  </div>
                  <Switch
                    checked={formData.nsfw_enabled}
                    onCheckedChange={handleNsfwToggle}
                    data-testid="nsfw-toggle"
                  />
                </div>
              </div>

              <div>
                <Label style={{ color: 'var(--foreground)' }}>
                  <Palette className="w-4 h-4 inline mr-2" /> {t.profile.theme}
                </Label>
                <Select value={formData.theme} onValueChange={(val) => setFormData({ ...formData, theme: val })}>
                  <SelectTrigger className="input-themed h-12 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong border-themed">
                    {themeOptions.map(o => <SelectItem key={o.value} value={o.value} className="py-3 text-base">{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div
                className="flex items-center justify-between gap-4 p-3 rounded-lg"
                style={{
                  background: 'color-mix(in srgb, var(--secondary) 40%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--border) 60%, transparent)',
                }}
              >
                <div className="min-w-0">
                  <Label style={{ color: 'var(--foreground)' }} className="cursor-pointer">
                    {t.profile.animatedBg || 'Fondo animado'}
                  </Label>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {t.profile.animatedBgHint || 'Partículas y efectos en movimiento detrás de la interfaz. Desactívalo si notas la app lenta.'}
                  </p>
                </div>
                <Switch
                  checked={formData.animated_bg !== false}
                  onCheckedChange={(v) => {
                    setFormData({ ...formData, animated_bg: !!v });
                    try {
                      localStorage.setItem('ethernal-animated-bg', v ? '1' : '0');
                      window.dispatchEvent(new CustomEvent('ethernal-animated-bg-changed', { detail: { enabled: !!v } }));
                    } catch (e) { /* ignore */ }
                  }}
                />
              </div>

              <div>
                <Label style={{ color: 'var(--foreground)' }}>
                  <Globe className="w-4 h-4 inline mr-2" /> {t.profile.language}
                </Label>
                <Select value={formData.language} onValueChange={(val) => setFormData({ ...formData, language: val })}>
                  <SelectTrigger className="input-themed h-12 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong border-themed">
                    <SelectItem value="es" className="py-3 text-base">Español</SelectItem>
                    <SelectItem value="en" className="py-3 text-base">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={saving} className="w-full gradient-primary hover:opacity-90 font-semibold">
                <Save className="w-4 h-4 mr-2" />
                {saving ? t.chat.sending : t.profile.saveChanges}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* 18+ Confirmation Dialog */}
      <AlertDialog open={showNsfwDialog} onOpenChange={setShowNsfwDialog}>
        <AlertDialogContent className="glass-strong border-themed">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
              Confirmación de edad
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                Para activar contenido NSFW debes <strong>confirmar que tienes 18 años o más</strong>.
              </span>
              <span className="block text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Al continuar declaras que cumples la mayoría de edad en tu país y aceptas
                explorar contenido adulto y narrativas explícitas bajo tu responsabilidad.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAge}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Soy mayor de 18 — Activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

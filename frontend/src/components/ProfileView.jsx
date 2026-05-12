import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Upload, Palette, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

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
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

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
        <Card className="max-w-2xl mx-auto glass-strong border-themed">
          <CardContent className="py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32 ring-2 ring-themed">
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
    </div>
  );
}

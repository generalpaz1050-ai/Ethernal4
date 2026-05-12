import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Flame, Moon, Globe } from 'lucide-react';

export default function LandingPage({ t, language, setLanguage, onAuth, onGoogleLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth(isLogin, formData);
  };

  return (
    <div className="gradient-dark relative overflow-hidden min-h-screen">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="ambient-orb animate-float" style={{ top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--primary)' }} />
        <div className="ambient-orb animate-float" style={{ bottom: '10%', right: '10%', width: '420px', height: '420px', background: 'var(--accent)', animationDelay: '2s' }} />
        <div className="ambient-orb animate-float" style={{ top: '40%', left: '45%', width: '320px', height: '320px', background: 'var(--ring)', animationDelay: '4s' }} />
      </div>

      {/* Language selector */}
      <div className="absolute top-4 right-4 z-20">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-36 glass border-themed text-[color:var(--foreground)]">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-themed">
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-3xl">
          <div className="flex items-center justify-center mb-6">
            <Flame className="w-16 h-16 mr-3" style={{ color: 'var(--primary)' }} />
            <h1 className="text-6xl md:text-7xl font-bold text-gradient leading-tight">{t.landing.title}</h1>
          </div>
          <p className="text-2xl md:text-3xl mb-4" style={{ color: 'var(--foreground)' }}>{t.landing.subtitle}</p>
          <p className="max-w-2xl mx-auto text-base md:text-lg" style={{ color: 'var(--muted-foreground)' }}>
            {t.landing.description}
          </p>
        </div>

        <Card className="w-full max-w-md glass-strong border-themed">
          <CardHeader>
            <CardTitle className="text-2xl text-center" style={{ color: 'var(--foreground)' }}>
              {isLogin ? t.landing.welcomeBack : t.landing.joinEthernal}
            </CardTitle>
            <CardDescription className="text-center" style={{ color: 'var(--muted-foreground)' }}>
              {isLogin ? t.landing.enterCredentials : t.landing.createAccount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google button at top */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-themed hover:bg-[color:var(--secondary)] mb-4"
              onClick={onGoogleLogin}
              style={{ color: 'var(--foreground)' }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.landing.continueWithGoogle}
            </Button>

            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-2 text-xs" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>{t.landing.orDivider}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label style={{ color: 'var(--foreground)' }}>{t.landing.name}</Label>
                  <Input
                    placeholder={t.landing.name}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-themed mt-1.5"
                  />
                </div>
              )}
              <div>
                <Label style={{ color: 'var(--foreground)' }}>{t.landing.email}</Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-themed mt-1.5"
                />
              </div>
              <div>
                <Label style={{ color: 'var(--foreground)' }}>{t.landing.password}</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-themed mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary font-semibold hover:opacity-90 transition-opacity">
                {isLogin ? t.landing.signIn : t.landing.createAccountBtn}
              </Button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--muted-foreground)' }}>
              {(isLogin ? t.landing.dontHaveAccount : t.landing.alreadyHaveAccount) + ' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                {isLogin ? t.landing.signUp : t.landing.signIn}
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="text-sm mt-6 max-w-md text-center px-4" style={{ color: 'var(--muted-foreground)' }}>
          <Moon className="inline w-4 h-4 mr-1" />
          {t.landing.matureContent}
        </p>
      </div>
    </div>
  );
}

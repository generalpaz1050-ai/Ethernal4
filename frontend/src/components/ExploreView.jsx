import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Search, Heart, MessageCircle } from 'lucide-react';
import { charactersAPI } from '../lib/api';

export default function ExploreView({ t, onStartChat, onBack }) {
  const [chars, setChars] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await charactersAPI.list({ public: 'true' });
        setChars(res.data.characters || []);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const filtered = chars
    .filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.universe?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (filter === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (filter === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="gradient-dark min-h-screen">
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="px-2" style={{ color: 'var(--foreground)' }}>
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.chat.back}</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{t.explore.title}</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input placeholder={t.explore.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 input-themed" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40 input-themed"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-themed">
                <SelectItem value="all">{t.explore.filterAll}</SelectItem>
                <SelectItem value="popular">{t.explore.filterPopular}</SelectItem>
                <SelectItem value="recent">{t.explore.filterRecent}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <Card className="glass col-span-full">
              <CardContent className="py-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--primary)' }} />
                <p style={{ color: 'var(--muted-foreground)' }}>{t.explore.noPublicCharacters}</p>
              </CardContent>
            </Card>
          ) : filtered.map((c) => (
            <Card key={c._id || c.id} className="glass hover:glass-strong transition-all">
              <CardHeader className="pb-3">
                <Avatar className="w-24 h-24 mx-auto ring-2 ring-themed">
                  <AvatarImage src={c.avatar} />
                  <AvatarFallback className="gradient-primary text-2xl">{c.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-center mt-3" style={{ color: 'var(--foreground)' }}>{c.name}</CardTitle>
                <CardDescription className="text-center line-clamp-2 min-h-[40px]" style={{ color: 'var(--muted-foreground)' }}>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {c.universe && (
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs">{c.universe.substring(0, 30)}{c.universe.length > 30 ? '...' : ''}</Badge>
                  </div>
                )}
                <div className="flex justify-center items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  <Heart className="w-4 h-4" /> {c.likes || 0}
                </div>
                <Button onClick={() => onStartChat(c)} className="w-full gradient-primary hover:opacity-90 font-semibold">
                  <MessageCircle className="w-4 h-4 mr-2" /> {t.explore.startRoleplay}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

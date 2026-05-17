import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, Search, Heart, MessageCircle, X, Tag, Check, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { charactersAPI, tagsAPI } from '../lib/api';

function splitTags(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ExploreView({ t, user, onUserUpdate, onStartChat, onBack }) {
  const [chars, setChars] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [defaultTags, setDefaultTags] = useState([]);
  const [activeTags, setActiveTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagsOpen, setTagsOpen] = useState(false);
  // Local sets so UI reacts instantly without waiting for parent state sync
  const [likedIds, setLikedIds] = useState(new Set(user?.liked_characters || []));
  const [savedIds, setSavedIds] = useState(new Set(user?.saved_characters || []));
  const [busyIds, setBusyIds] = useState({ like: new Set(), save: new Set() });
  const [showOnlySaved, setShowOnlySaved] = useState(false);

  useEffect(() => {
    setLikedIds(new Set(user?.liked_characters || []));
    setSavedIds(new Set(user?.saved_characters || []));
  }, [user?.liked_characters, user?.saved_characters]);

  useEffect(() => {
    (async () => {
      try {
        const res = await charactersAPI.list({ public: 'true' });
        setChars(res.data.characters || []);
      } catch (e) { /* ignore */ }
      try {
        const r = await tagsAPI.defaults();
        setDefaultTags(r.data.tags || []);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const toggleLike = async (c) => {
    const id = c._id || c.id;
    if (!id || busyIds.like.has(id)) return;
    setBusyIds((b) => ({ ...b, like: new Set([...b.like, id]) }));
    // Optimistic
    const wasLiked = likedIds.has(id);
    const newLiked = new Set(likedIds);
    if (wasLiked) newLiked.delete(id); else newLiked.add(id);
    setLikedIds(newLiked);
    setChars((prev) => prev.map((x) => {
      if ((x._id || x.id) !== id) return x;
      return { ...x, likes: Math.max(0, (x.likes || 0) + (wasLiked ? -1 : 1)) };
    }));
    try {
      const res = await charactersAPI.like(id);
      const serverLikes = res?.data?.likes;
      if (typeof serverLikes === 'number') {
        setChars((prev) => prev.map((x) => ((x._id || x.id) === id ? { ...x, likes: serverLikes } : x)));
      }
      onUserUpdate?.({ liked_characters: Array.from(newLiked) });
    } catch (e) {
      // Rollback
      setLikedIds(likedIds);
      setChars((prev) => prev.map((x) => {
        if ((x._id || x.id) !== id) return x;
        return { ...x, likes: Math.max(0, (x.likes || 0) + (wasLiked ? 1 : -1)) };
      }));
      toast.error('No se pudo registrar el like');
    } finally {
      setBusyIds((b) => {
        const next = new Set(b.like);
        next.delete(id);
        return { ...b, like: next };
      });
    }
  };

  const toggleSave = async (c) => {
    const id = c._id || c.id;
    if (!id || busyIds.save.has(id)) return;
    setBusyIds((b) => ({ ...b, save: new Set([...b.save, id]) }));
    const wasSaved = savedIds.has(id);
    const newSaved = new Set(savedIds);
    if (wasSaved) newSaved.delete(id); else newSaved.add(id);
    setSavedIds(newSaved);
    try {
      await charactersAPI.save(id);
      onUserUpdate?.({ saved_characters: Array.from(newSaved) });
      toast.success(wasSaved ? 'Quitado de guardados' : 'Guardado en tu colección');
    } catch (e) {
      setSavedIds(savedIds);
      toast.error('No se pudo guardar');
    } finally {
      setBusyIds((b) => {
        const next = new Set(b.save);
        next.delete(id);
        return { ...b, save: next };
      });
    }
  };

  // Tags actually used by public characters, merged with the curated defaults.
  const availableTags = useMemo(() => {
    const set = new Set();
    chars.forEach((c) => splitTags(c.tags).forEach((tg) => set.add(tg)));
    defaultTags.forEach((tg) => set.add(tg));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [chars, defaultTags]);

  const visibleTags = useMemo(() => {
    if (!tagSearch.trim()) return availableTags;
    const q = tagSearch.trim().toLowerCase();
    return availableTags.filter((tg) => tg.toLowerCase().includes(q));
  }, [tagSearch, availableTags]);

  const toggleTag = (tg) => {
    setActiveTags((prev) =>
      prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]
    );
  };

  const clearAllTags = () => setActiveTags([]);

  const filtered = chars
    .filter((c) => {
      const id = c._id || c.id;
      if (showOnlySaved && !savedIds.has(id)) return false;
      const text = search.toLowerCase();
      const matchesText =
        !text ||
        c.name?.toLowerCase().includes(text) ||
        c.description?.toLowerCase().includes(text) ||
        c.universe?.toLowerCase().includes(text) ||
        (c.tags || '').toLowerCase().includes(text);

      if (!matchesText) return false;

      if (activeTags.length === 0) return true;
      const charTags = splitTags(c.tags).map((x) => x.toLowerCase());
      // Must include ALL selected tags (AND filter) — feels more precise.
      return activeTags.every((sel) => charTags.includes(sel.toLowerCase()));
    })
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
              <Input
                placeholder={t.explore.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 input-themed"
                data-testid="explore-search-input"
              />
            </div>

            {/* Tags selector button (popover) */}
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-themed relative"
                  style={{ color: 'var(--foreground)' }}
                  data-testid="explore-tags-trigger"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {t.explore.tagsLabel || 'Etiquetas'}
                  {activeTags.length > 0 && (
                    <span
                      className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      {activeTags.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(92vw,480px)] glass-strong border-themed p-0"
                align="end"
              >
                <div className="p-3 border-b border-themed">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                    <Input
                      autoFocus
                      placeholder={t.explore.tagSearchPlaceholder || 'Buscar etiqueta...'}
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="pl-9 input-themed"
                      data-testid="explore-tag-search-input"
                    />
                  </div>
                  {activeTags.length > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {activeTags.length} {t.explore.tagsSelected || 'seleccionadas'}
                      </span>
                      <button
                        onClick={clearAllTags}
                        className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--primary)' }}
                        data-testid="explore-clear-tags-btn"
                      >
                        <X className="w-3 h-3" /> {t.explore.clearTags || 'Limpiar'}
                      </button>
                    </div>
                  )}
                </div>
                <ScrollArea className="max-h-[55vh]">
                  <div className="p-3 flex flex-wrap gap-2">
                    {visibleTags.length === 0 ? (
                      <div className="w-full text-center text-xs py-4" style={{ color: 'var(--muted-foreground)' }}>
                        {t.explore.noTagsFound || 'Sin coincidencias.'}
                      </div>
                    ) : visibleTags.map((tg) => {
                      const active = activeTags.includes(tg);
                      return (
                        <button
                          key={tg}
                          onClick={() => toggleTag(tg)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5"
                          style={{
                            borderColor: active ? 'var(--primary)' : 'var(--border)',
                            background: active ? 'var(--primary)' : 'transparent',
                            color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
                          }}
                          data-testid={`explore-tag-chip-${tg}`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          {tg}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-themed text-xs flex items-center justify-between" style={{ color: 'var(--muted-foreground)' }}>
                  <span>{filtered.length} {t.explore.matchesFound || 'resultados'}</span>
                  <Button
                    size="sm"
                    onClick={() => setTagsOpen(false)}
                    className="gradient-primary font-semibold"
                  >
                    {t.explore.applyFilter || 'Listo'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40 input-themed"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-themed">
                <SelectItem value="all">{t.explore.filterAll}</SelectItem>
                <SelectItem value="popular">{t.explore.filterPopular}</SelectItem>
                <SelectItem value="recent">{t.explore.filterRecent}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={showOnlySaved ? 'default' : 'outline'}
              onClick={() => setShowOnlySaved((v) => !v)}
              className="gap-2"
              style={
                showOnlySaved
                  ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                  : { color: 'var(--foreground)', borderColor: 'var(--border)' }
              }
              data-testid="explore-only-saved-toggle"
              title="Mostrar solo los personajes que guardaste"
            >
              <Bookmark className="w-4 h-4" fill={showOnlySaved ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">Guardados</span>
              {savedIds.size > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: showOnlySaved
                      ? 'color-mix(in srgb, var(--primary-foreground) 25%, transparent)'
                      : 'color-mix(in srgb, var(--primary) 18%, transparent)',
                    color: showOnlySaved ? 'var(--primary-foreground)' : 'var(--primary)',
                  }}
                >
                  {savedIds.size}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Active tags pills — shown below header so user always sees what's filtering. */}
        {activeTags.length > 0 && (
          <div className="container mx-auto px-4 pb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              {t.explore.filteringBy || 'Filtrando por'}:
            </span>
            {activeTags.map((tg) => (
              <button
                key={tg}
                onClick={() => toggleTag(tg)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors hover:opacity-80"
                style={{
                  borderColor: 'var(--primary)',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
                data-testid={`explore-active-tag-${tg}`}
              >
                {tg}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearAllTags}
              className="text-xs hover:underline"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t.explore.clearTags || 'Limpiar'}
            </button>
          </div>
        )}
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
          ) : filtered.map((c) => {
            const charTags = splitTags(c.tags);
            return (
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
                  {charTags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {charTags.slice(0, 4).map((tg) => (
                        <button
                          key={tg}
                          onClick={() => toggleTag(tg)}
                          className="text-[10px] px-2 py-0.5 rounded-full border transition-colors"
                          style={{
                            borderColor: activeTags.includes(tg) ? 'var(--primary)' : 'var(--border)',
                            color: activeTags.includes(tg) ? 'var(--primary)' : 'var(--muted-foreground)',
                          }}
                        >
                          #{tg}
                        </button>
                      ))}
                      {charTags.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          +{charTags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-center items-center gap-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <button
                      type="button"
                      onClick={() => toggleLike(c)}
                      disabled={busyIds.like.has(c._id || c.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:opacity-80"
                      title={likedIds.has(c._id || c.id) ? 'Quitar like' : 'Dar like'}
                      data-testid={`explore-like-${c._id || c.id}`}
                      style={{
                        color: likedIds.has(c._id || c.id) ? '#ef4444' : 'var(--muted-foreground)',
                      }}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={likedIds.has(c._id || c.id) ? '#ef4444' : 'none'}
                      />
                      <span className="font-medium tabular-nums">{c.likes || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSave(c)}
                      disabled={busyIds.save.has(c._id || c.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:opacity-80"
                      title={savedIds.has(c._id || c.id) ? 'Quitar de guardados' : 'Guardar'}
                      data-testid={`explore-save-${c._id || c.id}`}
                      style={{
                        color: savedIds.has(c._id || c.id) ? 'var(--primary)' : 'var(--muted-foreground)',
                      }}
                    >
                      <Bookmark
                        className="w-4 h-4"
                        fill={savedIds.has(c._id || c.id) ? 'currentColor' : 'none'}
                      />
                      <span className="hidden sm:inline text-xs">
                        {savedIds.has(c._id || c.id) ? 'Guardado' : 'Guardar'}
                      </span>
                    </button>
                  </div>
                  <Button onClick={() => onStartChat(c)} className="w-full gradient-primary hover:opacity-90 font-semibold">
                    <MessageCircle className="w-4 h-4 mr-2" /> {t.explore.startRoleplay}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

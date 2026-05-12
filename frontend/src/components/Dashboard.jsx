import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Flame, Plus, MessageCircle, LogOut, Settings, Search, Bot, Upload, Wand2, Sparkles, Trash2, Heart, Crown } from 'lucide-react';
import { charactersAPI } from '../lib/api';

export default function Dashboard({ t, user, characters, chats, onLogout, onViewChange, onCreateCharacter, onDeleteCharacter, onStartChat, onLoadCharacters, onLoadChats }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [publicChars, setPublicChars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newChar, setNewChar] = useState({
    name: '', avatar: '', description: '', personality: '',
    backstory: '', scenario: '', universe: '', isPublic: false,
    gender: '', age: '', appearance: '', voice: '',
    likes: '', dislikes: '', tags: '', greeting: '', exampleDialogue: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    onLoadCharacters();
    onLoadChats();
    loadPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPublic = async () => {
    try {
      const res = await charactersAPI.list({ public: 'true' });
      setPublicChars(res.data.characters || []);
    } catch (e) { /* ignore */ }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setNewChar({ ...newChar, avatar: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await onCreateCharacter(newChar);
    if (ok) {
      setShowCreate(false);
      setNewChar({
        name: '', avatar: '', description: '', personality: '',
        backstory: '', scenario: '', universe: '', isPublic: false,
        gender: '', age: '', appearance: '', voice: '',
        likes: '', dislikes: '', tags: '', greeting: '', exampleDialogue: '',
      });
      setImagePreview(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await onDeleteCharacter(toDelete._id || toDelete.id);
    setShowDelete(false);
    setToDelete(null);
  };

  const filteredPublic = publicChars
    .filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.universe?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (filterType === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (filterType === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="gradient-dark min-h-screen">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7" style={{ color: 'var(--primary)' }} />
            <h1 className="text-xl sm:text-2xl font-bold text-gradient">Ethernal</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" onClick={() => onViewChange('explore')} className="px-2 sm:px-3" style={{ color: 'var(--foreground)' }}>
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.dashboard.explore}</span>
            </Button>
            <Button variant="ghost" onClick={() => onViewChange('subscription')} className="px-2 sm:px-3" style={{ color: 'var(--foreground)' }}>
              <Crown className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.dashboard.subscription || 'Mi Plan'}</span>
            </Button>
            <Button variant="ghost" onClick={() => onViewChange('profile')} className="px-2 sm:px-3" style={{ color: 'var(--foreground)' }}>
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.dashboard.editProfile}</span>
            </Button>
            <div className="hidden md:flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="gradient-primary text-xs">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{user?.name}</span>
            </div>
            <Button variant="ghost" onClick={onLogout} className="px-2" style={{ color: 'var(--foreground)' }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="characters" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="characters">{t.dashboard.myCharacters}</TabsTrigger>
            <TabsTrigger value="chats">{t.dashboard.recentChats}</TabsTrigger>
            <TabsTrigger value="gallery">{t.dashboard.gallery}</TabsTrigger>
          </TabsList>

          {/* My Characters */}
          <TabsContent value="characters" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{t.dashboard.yourCharacters}</h2>
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary hover:opacity-90 font-semibold">
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t.dashboard.createCharacter}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-themed max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle style={{ color: 'var(--foreground)' }}>{t.character.createNew}</DialogTitle>
                    <DialogDescription style={{ color: 'var(--muted-foreground)' }}>{t.character.designCharacter}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.avatarLabel}</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {imagePreview && (
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={imagePreview} />
                          </Avatar>
                        )}
                        <div className="flex-1 space-y-2">
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full border-themed" style={{ color: 'var(--foreground)' }}>
                            <Upload className="w-4 h-4 mr-2" /> {t.character.uploadImage}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.nameLabel} *</Label>
                      <Input value={newChar.name} onChange={(e) => setNewChar({ ...newChar, name: e.target.value })} placeholder={t.character.namePlaceholder} required className="input-themed mt-1.5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label style={{ color: 'var(--foreground)' }}>{t.character.genderLabel}</Label>
                        <Select value={newChar.gender || ''} onValueChange={(val) => setNewChar({ ...newChar, gender: val })}>
                          <SelectTrigger className="input-themed mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent className="glass-strong border-themed">
                            <SelectItem value="male">{t.character.genderMale}</SelectItem>
                            <SelectItem value="female">{t.character.genderFemale}</SelectItem>
                            <SelectItem value="non-binary">{t.character.genderNonBinary}</SelectItem>
                            <SelectItem value="other">{t.character.genderOther}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label style={{ color: 'var(--foreground)' }}>{t.character.ageLabel}</Label>
                        <Input value={newChar.age} onChange={(e) => setNewChar({ ...newChar, age: e.target.value })} placeholder={t.character.agePlaceholder} className="input-themed mt-1.5" />
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.descriptionLabel} *</Label>
                      <Textarea value={newChar.description} onChange={(e) => setNewChar({ ...newChar, description: e.target.value })} placeholder={t.character.descriptionPlaceholder} required rows={3} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.appearanceLabel}</Label>
                      <Textarea value={newChar.appearance} onChange={(e) => setNewChar({ ...newChar, appearance: e.target.value })} placeholder={t.character.appearancePlaceholder} rows={3} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.personalityLabel}</Label>
                      <Textarea value={newChar.personality} onChange={(e) => setNewChar({ ...newChar, personality: e.target.value })} placeholder={t.character.personalityPlaceholder} rows={3} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.voiceLabel}</Label>
                      <Textarea value={newChar.voice} onChange={(e) => setNewChar({ ...newChar, voice: e.target.value })} placeholder={t.character.voicePlaceholder} rows={2} className="input-themed mt-1.5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label style={{ color: 'var(--foreground)' }}>{t.character.likesLabel}</Label>
                        <Textarea value={newChar.likes} onChange={(e) => setNewChar({ ...newChar, likes: e.target.value })} placeholder={t.character.likesPlaceholder} rows={2} className="input-themed mt-1.5" />
                      </div>
                      <div>
                        <Label style={{ color: 'var(--foreground)' }}>{t.character.dislikesLabel}</Label>
                        <Textarea value={newChar.dislikes} onChange={(e) => setNewChar({ ...newChar, dislikes: e.target.value })} placeholder={t.character.dislikesPlaceholder} rows={2} className="input-themed mt-1.5" />
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.backstoryLabel}</Label>
                      <Textarea value={newChar.backstory} onChange={(e) => setNewChar({ ...newChar, backstory: e.target.value })} placeholder={t.character.backstoryPlaceholder} rows={4} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.scenarioLabel}</Label>
                      <Textarea value={newChar.scenario} onChange={(e) => setNewChar({ ...newChar, scenario: e.target.value })} placeholder={t.character.scenarioPlaceholder} rows={3} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.greetingLabel}</Label>
                      <Textarea value={newChar.greeting} onChange={(e) => setNewChar({ ...newChar, greeting: e.target.value })} placeholder={t.character.greetingPlaceholder} rows={2} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.exampleDialogueLabel}</Label>
                      <Textarea value={newChar.exampleDialogue} onChange={(e) => setNewChar({ ...newChar, exampleDialogue: e.target.value })} placeholder={t.character.exampleDialoguePlaceholder} rows={3} className="input-themed mt-1.5" />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.universeLabel}</Label>
                      <Textarea value={newChar.universe} onChange={(e) => setNewChar({ ...newChar, universe: e.target.value })} placeholder={t.character.universePlaceholder} rows={2} className="input-themed mt-1.5" />
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.character.universeHint}</p>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground)' }}>{t.character.tagsLabel}</Label>
                      <Input value={newChar.tags} onChange={(e) => setNewChar({ ...newChar, tags: e.target.value })} placeholder={t.character.tagsPlaceholder} className="input-themed mt-1.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="isPublic" checked={newChar.isPublic} onCheckedChange={(v) => setNewChar({ ...newChar, isPublic: !!v })} />
                      <Label htmlFor="isPublic" style={{ color: 'var(--foreground)' }}>{t.character.makePublic}</Label>
                    </div>
                    <Button type="submit" className="w-full gradient-primary hover:opacity-90">
                      <Sparkles className="w-4 h-4 mr-2" /> {t.character.createBtn}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="glass-strong border-themed">
                  <DialogHeader>
                    <DialogTitle style={{ color: 'var(--foreground)' }}>{t.character.deleteTitle}</DialogTitle>
                    <DialogDescription style={{ color: 'var(--muted-foreground)' }}>{t.character.deleteDescription}</DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" onClick={() => { setShowDelete(false); setToDelete(null); }} className="flex-1 border-themed" style={{ color: 'var(--foreground)' }}>{t.character.cancel}</Button>
                    <Button onClick={handleDelete} className="flex-1" style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>{t.character.delete}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.length === 0 ? (
                <Card className="glass col-span-full">
                  <CardContent className="py-12 text-center">
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--primary)' }} />
                    <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>{t.dashboard.noCharactersYet}</p>
                    <Button onClick={() => setShowCreate(true)} className="gradient-primary hover:opacity-90">{t.dashboard.createFirstCharacter}</Button>
                  </CardContent>
                </Card>
              ) : characters.map((c) => (
                <Card key={c._id || c.id} className="glass hover:glass-strong transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Avatar className="w-16 h-16 ring-2 ring-themed">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback className="gradient-primary text-xl">{c.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {c.isPublic && <Badge variant="secondary">{t.character.public}</Badge>}
                    </div>
                    <CardTitle className="mt-3" style={{ color: 'var(--foreground)' }}>{c.name}</CardTitle>
                    <CardDescription className="line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{c.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button onClick={() => onStartChat(c)} className="flex-1 gradient-primary hover:opacity-90 font-semibold">
                        <MessageCircle className="w-4 h-4 mr-2" /> {t.dashboard.startChat}
                      </Button>
                      <Button onClick={() => { setToDelete(c); setShowDelete(true); }} variant="outline" className="border-themed" style={{ color: 'var(--destructive)' }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recent Chats */}
          <TabsContent value="chats" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{t.dashboard.recentChats}</h2>
            <div className="space-y-3">
              {chats.length === 0 ? (
                <Card className="glass">
                  <CardContent className="py-12 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--muted-foreground)' }}>{t.dashboard.noChatHistory}</p>
                  </CardContent>
                </Card>
              ) : chats.map((chat) => (
                <Card key={chat._id || chat.id} className="glass hover:glass-strong transition-all">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={chat.character?.avatar} />
                          <AvatarFallback className="gradient-primary">{chat.character?.name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>{chat.character?.name}</h3>
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{(chat.messages?.length || 0)} {t.dashboard.messages}</p>
                        </div>
                      </div>
                      <Button onClick={() => onStartChat(chat.character)} variant="outline" className="border-themed" style={{ color: 'var(--foreground)' }}>
                        <MessageCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t.dashboard.continueChat}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{t.dashboard.publicGallery}</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  <Input placeholder={t.explore.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 input-themed" />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40 input-themed"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong border-themed">
                    <SelectItem value="all">{t.explore.filterAll}</SelectItem>
                    <SelectItem value="popular">{t.explore.filterPopular}</SelectItem>
                    <SelectItem value="recent">{t.explore.filterRecent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPublic.length === 0 ? (
                <Card className="glass col-span-full">
                  <CardContent className="py-12 text-center">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--muted-foreground)' }}>{t.explore.noPublicCharacters}</p>
                  </CardContent>
                </Card>
              ) : filteredPublic.map((c) => (
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
                      <MessageCircle className="w-4 h-4 mr-2" /> {t.explore.chatNow}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

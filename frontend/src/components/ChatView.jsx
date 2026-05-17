import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from './ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from './ui/tooltip';
import {
  ArrowLeft, Send, RefreshCcw, Copy, Check, Sparkles,
  Pencil, Trash2, X, ChevronLeft, ChevronRight, ShieldAlert, Lock,
  MoreVertical, Save, FilePlus2, History, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import ChatPet from './ChatPet';
import { chatsAPI, enginesAPI, archivesAPI } from '../lib/api';

const COOLDOWN_SECONDS = 4;

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Renderiza el contenido del mensaje del personaje resaltando acciones y diálogo.
 *  - *acción*  → cursiva + negrita, color acento (var(--primary))
 *  - "diálogo" → texto normal foreground
 */
function renderRichContent(text) {
  if (!text) return null;
  const regex = /(\*[^*]+\*|"[^"]+"|“[^”]+”|«[^»]+»)/g;
  const parts = text.split(regex).filter((p) => p !== '');
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1).trim();
      return (
        <em
          key={i}
          className="font-bold italic"
          style={{ color: 'var(--primary)', textShadow: '0 0 8px color-mix(in srgb, var(--primary) 25%, transparent)' }}
        >
          *{inner}*
        </em>
      );
    }
    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith('“') && part.endsWith('”')) ||
      (part.startsWith('«') && part.endsWith('»'))
    ) {
      return (
        <span key={i} className="font-medium" style={{ color: 'var(--foreground)' }}>
          {part}
        </span>
      );
    }
    return (
      <span key={i} style={{ color: 'color-mix(in srgb, var(--foreground) 78%, transparent)' }}>
        {part}
      </span>
    );
  });
}

export default function ChatView({
  t, user, chat, character,
  onSendMessage, onRegenerate,
  onEditMessage, onDeleteMessage, onNavigateVariant,
  onChatUpdated,
  onBack,
}) {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  // AI Engine selector
  const [engines, setEngines] = useState([]);          // [{id,label,tier,locked,tagline}]
  const [currentEngine, setCurrentEngine] = useState(chat?.ai_engine || null);
  const [engineSwitching, setEngineSwitching] = useState(false);
  // Save / New / History
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSaveFirst, setResetSaveFirst] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archives, setArchives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [confirmDeleteArchiveId, setConfirmDeleteArchiveId] = useState(null);
  const messagesEndRef = useRef(null);

  // Load engine catalog once
  useEffect(() => {
    let alive = true;
    enginesAPI.list().then((res) => {
      if (!alive) return;
      const data = res?.data || {};
      setEngines(data.engines || []);
      if (!currentEngine) {
        setCurrentEngine(chat?.ai_engine || data.default || 'mercury');
      }
    }).catch(() => { /* silent — selector just won't render */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync if parent updates chat.ai_engine externally (e.g. after re-fetch)
  useEffect(() => {
    if (chat?.ai_engine && chat.ai_engine !== currentEngine) {
      setCurrentEngine(chat.ai_engine);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.ai_engine]);

  const handlePickEngine = async (eng) => {
    if (!eng || eng.locked || eng.id === currentEngine || engineSwitching) return;
    const chatId = chat?._id || chat?.id;
    if (!chatId) return;
    setEngineSwitching(true);
    const prev = currentEngine;
    setCurrentEngine(eng.id);  // optimistic
    try {
      await chatsAPI.setEngine(chatId, eng.id);
      toast.success(`Motor activado: ${eng.label}`);
    } catch (e) {
      setCurrentEngine(prev);
      toast.error(e?.response?.data?.detail || 'No se pudo cambiar el motor');
    } finally {
      setEngineSwitching(false);
    }
  };

  const chatId = chat?._id || chat?.id;

  const reloadArchives = async () => {
    if (!chatId) return;
    setArchivesLoading(true);
    try {
      const res = await chatsAPI.archives(chatId);
      setArchives(res?.data?.archives || []);
    } catch (e) {
      toast.error('No se pudo cargar el historial');
    } finally {
      setArchivesLoading(false);
    }
  };

  const handleOpenSave = () => {
    const messages = chat?.messages || [];
    if (!messages.length) {
      toast.error('El chat está vacío, no hay nada que guardar');
      return;
    }
    setSaveName('');
    setSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!chatId) return;
    setSaving(true);
    try {
      await chatsAPI.save(chatId, saveName.trim() || null);
      toast.success('Chat guardado en tu historial');
      setSaveOpen(false);
      setSaveName('');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo guardar el chat');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenReset = () => {
    setResetSaveFirst(Boolean((chat?.messages || []).length));
    setResetOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!chatId) return;
    setResetting(true);
    try {
      const res = await chatsAPI.reset(chatId, {
        saveFirst: resetSaveFirst && (chat?.messages || []).length > 0,
      });
      if (res?.data?.chat) {
        onChatUpdated?.(res.data.chat);
      }
      toast.success(
        res?.data?.saved_archive
          ? 'Chat anterior guardado. Empieza una nueva conversación ✨'
          : 'Nueva conversación iniciada ✨',
      );
      setResetOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo iniciar el nuevo chat');
    } finally {
      setResetting(false);
    }
  };

  const handleOpenHistory = async () => {
    setHistoryOpen(true);
    await reloadArchives();
  };

  const handleRestoreArchive = async (archiveId) => {
    if (!archiveId) return;
    try {
      const res = await archivesAPI.restore(archiveId);
      if (res?.data?.chat) {
        onChatUpdated?.(res.data.chat);
        toast.success('Conversación restaurada. El chat actual se guardó automáticamente.');
        setHistoryOpen(false);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo restaurar el chat');
    }
  };

  const handleDeleteArchive = async () => {
    const id = confirmDeleteArchiveId;
    if (!id) return;
    setConfirmDeleteArchiveId(null);
    try {
      await archivesAPI.delete(id);
      setArchives((prev) => prev.filter((a) => (a.archive_id || a.id) !== id));
      toast.success('Archivo eliminado');
    } catch (e) {
      toast.error('No se pudo eliminar el archivo');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages?.length, isGenerating, isRegenerating]);

  // Cooldown countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => {
      setCooldown((c) => (c <= 0.1 ? 0 : +(c - 0.1).toFixed(1)));
    }, 100);
    return () => clearInterval(t);
  }, [cooldown]);

  const startCooldown = () => setCooldown(COOLDOWN_SECONDS);

  const handleSend = async () => {
    if (!message.trim() || isGenerating || isRegenerating || cooldown > 0) return;
    setIsGenerating(true);
    const msg = message;
    setMessage('');
    startCooldown();
    try {
      await onSendMessage(msg);
    } catch (e) {
      // restore textarea content if server rejected (e.g. 429)
      if (e?.response?.status === 429) setMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (isGenerating || isRegenerating || cooldown > 0) return;
    setIsRegenerating(true);
    startCooldown();
    try {
      await onRegenerate?.();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async (content, idx) => {
    try {
      await navigator.clipboard.writeText(content || '');
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const beginEdit = (idx, current) => {
    setEditingIdx(idx);
    setEditText(current || '');
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditText('');
  };

  const saveEdit = async (idx) => {
    if (!editText.trim()) {
      toast.error('El mensaje no puede estar vacío');
      return;
    }
    setIsRegenerating(true);
    startCooldown();
    try {
      await onEditMessage?.(idx, editText.trim());
      cancelEdit();
      toast.success('Mensaje editado, regenerando respuesta…');
    } catch {
      /* toast already shown */
    } finally {
      setIsRegenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (confirmDeleteIdx == null) return;
    const idx = confirmDeleteIdx;
    setConfirmDeleteIdx(null);
    try {
      await onDeleteMessage?.(idx);
      toast.success('Mensaje borrado');
    } catch { /* toast handled */ }
  };

  const goVariant = async (idx, direction) => {
    if (variantLoading) return;
    setVariantLoading(true);
    try {
      await onNavigateVariant?.(idx, direction);
    } finally {
      setVariantLoading(false);
    }
  };

  const messages = chat?.messages || [];
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  return (
    <div className="gradient-dark flex flex-col min-h-screen">
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="px-2" style={{ color: 'var(--foreground)' }} data-testid="chat-back-btn">
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.chat.back}</span>
          </Button>
          <Avatar className="w-11 h-11 ring-2" style={{ '--tw-ring-color': 'var(--primary)' }}>
            <AvatarImage src={character?.avatar} />
            <AvatarFallback className="gradient-primary font-bold">{character?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>{character?.name}</h2>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span>{t.chat.aiCharacter}</span>
            </p>
          </div>

          {/* AI Engine selector — small, unobtrusive pills */}
          {engines.length > 0 && (
            <TooltipProvider delayDuration={150}>
              <div
                className="hidden sm:flex items-center gap-1 p-1 rounded-full border"
                style={{
                  borderColor: 'color-mix(in srgb, var(--primary) 28%, transparent)',
                  background: 'color-mix(in srgb, var(--background) 60%, transparent)',
                  backdropFilter: 'blur(8px)',
                }}
                data-testid="chat-engine-selector"
              >
                {engines.map((eng) => {
                  const active = eng.id === currentEngine;
                  const disabled = eng.locked || engineSwitching;
                  return (
                    <Tooltip key={eng.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handlePickEngine(eng)}
                          disabled={disabled}
                          aria-label={`Cambiar a ${eng.label}`}
                          data-testid={`engine-pill-${eng.id}`}
                          className="relative text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full transition-all flex items-center gap-1"
                          style={{
                            color: active
                              ? 'var(--primary-foreground)'
                              : (eng.locked ? 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' : 'var(--foreground)'),
                            background: active
                              ? 'var(--primary)'
                              : 'transparent',
                            opacity: eng.locked ? 0.55 : 1,
                            cursor: disabled ? (eng.locked ? 'not-allowed' : 'wait') : 'pointer',
                            boxShadow: active ? '0 0 12px color-mix(in srgb, var(--primary) 45%, transparent)' : 'none',
                          }}
                        >
                          {eng.locked && <Lock className="w-3 h-3" />}
                          <span>{eng.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs max-w-[220px] leading-snug">
                        <div className="font-semibold mb-0.5">{eng.label} <span className="opacity-60">· {eng.tier?.toUpperCase()}</span></div>
                        <div className="opacity-80">{eng.tagline}</div>
                        {eng.locked && (
                          <div className="mt-1 text-[10px] opacity-70">Bloqueado · sube de plan para usarlo</div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}

          {/* Chat actions: Guardar / Nuevo / Historial */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                style={{ color: 'var(--foreground)' }}
                aria-label="Acciones del chat"
                data-testid="chat-actions-trigger"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{ background: 'var(--popover)', color: 'var(--popover-foreground)', borderColor: 'var(--border)' }}
            >
              <DropdownMenuItem onClick={handleOpenSave} data-testid="action-save-chat" className="cursor-pointer">
                <Save className="w-4 h-4 mr-2" />
                Guardar chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenHistory} data-testid="action-history" className="cursor-pointer">
                <History className="w-4 h-4 mr-2" />
                Historial guardado
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleOpenReset}
                data-testid="action-new-chat"
                className="cursor-pointer"
                style={{ color: 'var(--primary)' }}
              >
                <FilePlus2 className="w-4 h-4 mr-2" />
                Nuevo chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Mobile-only compact engine row */}
        {engines.length > 0 && (
          <div className="sm:hidden px-3 pb-2 -mt-1 flex items-center gap-1.5 overflow-x-auto" data-testid="chat-engine-selector-mobile">
            {engines.map((eng) => {
              const active = eng.id === currentEngine;
              const disabled = eng.locked || engineSwitching;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => handlePickEngine(eng)}
                  disabled={disabled}
                  data-testid={`engine-pill-m-${eng.id}`}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0"
                  style={{
                    color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
                    background: active ? 'var(--primary)' : 'transparent',
                    borderColor: 'color-mix(in srgb, var(--primary) 28%, transparent)',
                    opacity: eng.locked ? 0.5 : 1,
                  }}
                >
                  {eng.locked && <Lock className="w-2.5 h-2.5" />}
                  {eng.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
          {messages.length === 0 && character?.scenario && (
            <div className="chat-bubble assistant">
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 mt-1 flex-shrink-0">
                  <AvatarImage src={character.avatar} />
                  <AvatarFallback className="gradient-primary text-xs">{character.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold mb-1.5 text-sm" style={{ color: 'var(--foreground)' }}>{character.name}</p>
                  <p className="whitespace-pre-wrap leading-relaxed italic" style={{ color: 'var(--muted-foreground)' }}>{character.scenario}</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && idx === lastAssistantIdx;
            const variants = msg.variants || [];
            const currentVariant = (typeof msg.current_variant === 'number') ? msg.current_variant : (variants.length ? variants.length - 1 : 0);
            const hasVariants = !isUser && variants.length > 1;
            const isEditingThis = isUser && editingIdx === idx;
            return (
              <div key={idx} className={`chat-bubble group ${isUser ? 'user' : 'assistant'} ${msg.regenerated ? 'animate-in fade-in duration-500' : ''}`}>
                <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-9 h-9 mt-1 flex-shrink-0">
                    {isUser ? (
                      <>
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="gradient-primary text-xs">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={character?.avatar} />
                        <AvatarFallback className="gradient-primary text-xs">{character?.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-baseline gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {isUser ? user?.name : character?.name}
                      </span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-foreground)' }}>
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.edited && (
                        <span className="text-[10px] italic" style={{ color: 'var(--muted-foreground)' }}>(editado)</span>
                      )}
                      {msg.regenerated && !isUser && (
                        <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                          <Sparkles className="w-3 h-3" /> regenerado
                        </span>
                      )}
                      {hasVariants && (
                        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          versión {currentVariant + 1} / {variants.length}
                        </span>
                      )}
                    </div>

                    {/* CONTENT or EDIT MODE */}
                    {isEditingThis ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          autoFocus
                          className="input-themed resize-y"
                          data-testid={`edit-textarea-${idx}`}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <X className="w-3 h-3 mr-1" /> Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(idx)}
                            disabled={!editText.trim() || isRegenerating}
                            className="gradient-primary"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Guardar y regenerar
                          </Button>
                        </div>
                      </div>
                    ) : msg.imageUrl ? (
                      <div className="space-y-2">
                        <img src={msg.imageUrl} alt="scene" className="rounded-lg w-full max-w-md" />
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{msg.content}</p>
                      </div>
                    ) : isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--foreground)' }}>{msg.content}</p>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{renderRichContent(msg.content)}</p>
                    )}

                    {/* ACTION BAR — ASSISTANT */}
                    {!isUser && !msg._optimistic && !isEditingThis && (
                      <div className={`mt-2 flex flex-wrap items-center gap-1.5 transition-opacity ${isLastAssistant ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {hasVariants && (
                          <div className="inline-flex items-center rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                            <button
                              onClick={() => goVariant(idx, 'prev')}
                              disabled={variantLoading || currentVariant <= 0}
                              className="px-1.5 py-1 text-[11px] hover:bg-[color:var(--secondary)] disabled:opacity-30"
                              style={{ color: 'var(--foreground)' }}
                              title="Versión anterior"
                              data-testid={`variant-prev-${idx}`}
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <span className="px-1.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                              {currentVariant + 1}/{variants.length}
                            </span>
                            <button
                              onClick={() => goVariant(idx, 'next')}
                              disabled={variantLoading || currentVariant >= variants.length - 1}
                              className="px-1.5 py-1 text-[11px] hover:bg-[color:var(--secondary)] disabled:opacity-30"
                              style={{ color: 'var(--foreground)' }}
                              title="Versión siguiente"
                              data-testid={`variant-next-${idx}`}
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[color:var(--secondary)]"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                          data-testid={`copy-msg-${idx}`}
                          title="Copiar"
                        >
                          {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIdx === idx ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        {isLastAssistant && (
                          <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating || isGenerating || cooldown > 0}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[color:var(--secondary)] disabled:opacity-50"
                            style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                            data-testid="regenerate-btn"
                            title="Regenerar respuesta (guarda la anterior)"
                          >
                            <RefreshCcw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>{isRegenerating ? 'Regenerando…' : 'Regenerar'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* ACTION BAR — USER */}
                    {isUser && !msg._optimistic && !isEditingThis && (
                      <div className="mt-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[color:var(--secondary)]"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                          data-testid={`copy-msg-${idx}`}
                          title="Copiar"
                        >
                          {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIdx === idx ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        <button
                          onClick={() => beginEdit(idx, msg.content)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[color:var(--secondary)]"
                          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                          data-testid={`edit-msg-${idx}`}
                          title="Editar mensaje (la IA responderá de nuevo)"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(idx)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors hover:bg-[color:var(--destructive)]/20"
                          style={{ borderColor: 'var(--border)', color: 'var(--destructive)' }}
                          data-testid={`delete-msg-${idx}`}
                          title="Borrar este mensaje y la respuesta de la IA"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {(isGenerating || isRegenerating) && (
            <div className="chat-bubble assistant">
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 mt-1">
                  <AvatarImage src={character?.avatar} />
                  <AvatarFallback className="gradient-primary text-xs">{character?.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold mb-2 text-sm" style={{ color: 'var(--foreground)' }}>{character?.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="typing-dot" />
                      <span className="typing-dot" style={{ animationDelay: '0.16s' }} />
                      <span className="typing-dot" style={{ animationDelay: '0.32s' }} />
                    </div>
                    <span className="text-xs italic" style={{ color: 'var(--muted-foreground)' }}>
                      {isRegenerating ? 'Regenerando respuesta…' : 'pensando…'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="glass-strong sticky bottom-0 border-t border-themed">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-end gap-2">
            <Textarea
              placeholder={cooldown > 0 ? `Espera ${cooldown.toFixed(1)}s…` : t.chat.typePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isGenerating || isRegenerating}
              rows={1}
              className="input-themed resize-none min-h-[44px] max-h-32 text-sm leading-snug"
              data-testid="chat-message-input"
            />
            <Button
              onClick={handleSend}
              disabled={isGenerating || isRegenerating || !message.trim() || cooldown > 0}
              className="gradient-primary h-[44px] px-4 hover:opacity-90 transition-opacity relative"
              data-testid="chat-send-btn"
            >
              {cooldown > 0 ? (
                <span className="text-xs font-bold tabular-nums">{cooldown.toFixed(1)}s</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-center mt-1.5 flex items-center justify-center gap-2 flex-wrap" style={{ color: 'var(--muted-foreground)' }}>
            <span className="hidden sm:inline">{t.chat.pressEnter}</span>
            <span className="hidden sm:inline mx-1 opacity-50">·</span>
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Anti-spam: 1 msg/{COOLDOWN_SECONDS}s
            </span>
          </p>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={confirmDeleteIdx != null} onOpenChange={(o) => !o && setConfirmDeleteIdx(null)}>
        <AlertDialogContent className="glass-strong" style={{ borderColor: 'var(--border)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--foreground)' }}>¿Borrar este mensaje?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--muted-foreground)' }}>
              También se borrará la respuesta de la IA que vino justo después. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: 'var(--foreground)' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[color:var(--destructive)] hover:opacity-90"
              style={{ color: 'var(--destructive-foreground)' }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SAVE CHAT DIALOG */}
      <Dialog open={saveOpen} onOpenChange={(o) => !saving && setSaveOpen(o)}>
        <DialogContent className="glass-strong" style={{ borderColor: 'var(--border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Guardar conversación</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Se guarda una copia inmutable de la conversación actual en tu historial.
              El chat sigue activo y puedes seguir hablando con {character?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Título (opcional). Ej.: Primer encuentro en la taberna…"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={120}
              className="input-themed"
              data-testid="save-chat-name-input"
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSave(); }}
            />
            <p className="text-[11px] mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Si lo dejas vacío, usaremos un nombre automático.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)} disabled={saving} style={{ color: 'var(--foreground)' }}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saving}
              className="gradient-primary"
              data-testid="save-chat-confirm"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW CHAT (RESET) DIALOG */}
      <Dialog open={resetOpen} onOpenChange={(o) => !resetting && setResetOpen(o)}>
        <DialogContent className="glass-strong" style={{ borderColor: 'var(--border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Empezar un nuevo chat</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              {character?.name} olvidará la conversación actual y empezarás de cero.
              La memoria a largo plazo, los hechos clave y el estado de la escena se reinician.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={resetSaveFirst}
              onChange={(e) => setResetSaveFirst(e.target.checked)}
              className="mt-1"
              data-testid="reset-save-first"
            />
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Guardar la conversación actual antes de reiniciar
              </div>
              <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Recomendado. Podrás restaurarla luego desde el Historial guardado.
              </div>
            </div>
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={resetting} style={{ color: 'var(--foreground)' }}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReset}
              disabled={resetting}
              className="gradient-primary"
              data-testid="reset-chat-confirm"
            >
              <FilePlus2 className="w-4 h-4 mr-2" />
              {resetting ? 'Reiniciando…' : 'Empezar nuevo chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HISTORY SHEET */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col"
          style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ color: 'var(--foreground)' }}>
              Historial guardado — {character?.name}
            </SheetTitle>
            <SheetDescription style={{ color: 'var(--muted-foreground)' }}>
              Tus conversaciones guardadas con este personaje. Puedes restaurarlas en cualquier momento.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
            {archivesLoading && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cargando…</p>
            )}
            {!archivesLoading && archives.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Aún no has guardado ninguna conversación.
                <br />Pulsa <span className="font-medium">“Guardar chat”</span> para empezar.
              </div>
            )}
            {!archivesLoading && archives.map((a) => {
              const id = a.archive_id || a.id;
              const date = a.archived_at ? new Date(a.archived_at) : null;
              const dateStr = date ? date.toLocaleString([], {
                year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
              }) : '';
              return (
                <div
                  key={id}
                  className="rounded-xl p-3 border flex flex-col gap-1 transition-colors"
                  style={{
                    background: 'color-mix(in srgb, var(--card) 80%, transparent)',
                    borderColor: 'var(--border)',
                  }}
                  data-testid={`archive-item-${id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                        {a.name}
                      </h4>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {a.message_count} mensajes · {dateStr}
                        {a.ai_engine && (
                          <> · <span className="uppercase tracking-wide">{a.ai_engine}</span></>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        title="Restaurar este chat"
                        onClick={() => handleRestoreArchive(id)}
                        data-testid={`archive-restore-${id}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        title="Eliminar"
                        onClick={() => setConfirmDeleteArchiveId(id)}
                        data-testid={`archive-delete-${id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--destructive)' }} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* CONFIRM DELETE ARCHIVE */}
      <AlertDialog open={confirmDeleteArchiveId != null} onOpenChange={(o) => !o && setConfirmDeleteArchiveId(null)}>
        <AlertDialogContent className="glass-strong" style={{ borderColor: 'var(--border)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--foreground)' }}>¿Eliminar este chat guardado?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Esta acción es permanente y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: 'var(--foreground)' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArchive}
              className="bg-[color:var(--destructive)] hover:opacity-90"
              style={{ color: 'var(--destructive-foreground)' }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating equipped pet (optional, non-blocking). */}
      <ChatPet petId={user?.equipped_pet} messagesCount={messages.length} />
    </div>
  );
}

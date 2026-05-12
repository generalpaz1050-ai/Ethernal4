import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, Send } from 'lucide-react';

export default function ChatView({ t, user, chat, character, onSendMessage, onBack }) {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || isGenerating) return;
    setIsGenerating(true);
    const msg = message;
    setMessage('');
    try {
      await onSendMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="gradient-dark flex flex-col min-h-screen">
      <header className="glass-strong sticky top-0 z-50 border-b border-themed">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="px-2" style={{ color: 'var(--foreground)' }}>
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.chat.back}</span>
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={character?.avatar} />
            <AvatarFallback className="gradient-primary">{character?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>{character?.name}</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.chat.aiCharacter}</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-3">
          {(!chat?.messages || chat.messages.length === 0) && character?.scenario && (
            <div className="chat-bubble assistant">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={character.avatar} />
                  <AvatarFallback className="gradient-primary text-xs">{character.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{character.name}</p>
                  <p className="whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{character.scenario}</p>
                </div>
              </div>
            </div>
          )}

          {chat?.messages?.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8 mt-1">
                  {msg.role === 'user' ? (
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
                  <p className={`font-semibold mb-1 ${msg.role === 'user' ? 'text-right' : ''}`} style={{ color: 'var(--foreground)' }}>
                    {msg.role === 'user' ? user?.name : character?.name}
                  </p>
                  {msg.imageUrl ? (
                    <div className="space-y-2">
                      <img src={msg.imageUrl} alt="scene" className="rounded-lg w-full max-w-md" />
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{msg.content}</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="chat-bubble assistant">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={character?.avatar} />
                  <AvatarFallback className="gradient-primary text-xs">{character?.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{character?.name}</p>
                  <div className="flex gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: '0.16s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.32s' }} />
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
              placeholder={t.chat.typePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isGenerating}
              rows={3}
              className="input-themed resize-none"
            />
            <Button onClick={handleSend} disabled={isGenerating || !message.trim()} className="gradient-primary h-[76px] hover:opacity-90">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--muted-foreground)' }}>{t.chat.pressEnter}</p>
        </div>
      </div>
    </div>
  );
}

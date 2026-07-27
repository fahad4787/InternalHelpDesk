'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatService } from '@/services/chat.service';
import { ChatMessage } from '@/types/api.types';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ChatSource = { documentTitle: string; section?: string; excerpt: string };

function formatSourceLine(source: ChatSource) {
  const section = source.section ? ` ${source.section.replace(/^\d+\.\s+/, '')}` : '';
  return `Source · ${source.documentTitle}${section}`;
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isNewChat, setIsNewChat] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatService.getSessions(),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      chatService.sendMessage({ content, sessionId }),
    onMutate: (content) => {
      setSendError('');
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      return { content };
    },
    onSuccess: (res) => {
      setMessages((prev) => [...prev, res.data.message]);
      setSessionId(res.data.sessionId);
      setIsNewChat(false);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (err, _content, context) => {
      setMessages((prev) => prev.slice(0, -1));
      if (context?.content) setInput(context.content);
      setSendError(getErrorMessage(err));
    },
  });

  const handleSend = () => {
    const content = input.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteSession(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      if (sessionId === deletedId) {
        setSessionId(undefined);
        setMessages([]);
        setInput('');
        setIsNewChat(true);
      }
    },
  });

  const loadSession = useCallback(async (id: string) => {
    setIsNewChat(false);
    const res = await chatService.getSession(id);
    setSessionId(id);
    setMessages(res.data.messages ?? []);
  }, []);

  const startNewChat = () => {
    setSessionId(undefined);
    setMessages([]);
    setInput('');
    setIsNewChat(true);
  };

  useEffect(() => {
    if (sessionId || isNewChat || !sessions?.data?.length) return;
    loadSession(sessions.data[0].id);
  }, [sessions?.data, sessionId, isNewChat, loadSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  return (
    <PageContainer title="AI Chat" description="Chat naturally or ask about your company documents">
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        <div className="hidden w-64 shrink-0 overflow-y-auto rounded-2xl border border-border-warm bg-white shadow-sm lg:block">
          <div className="border-b border-border-warm p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={startNewChat}
            >
              <Sparkles className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>
          <div className="p-2">
            {sessions?.data?.map((s) => {
              const isActive = sessionId === s.id;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'group mb-1 flex items-center gap-1 rounded-xl transition-all',
                    isActive ? 'bg-brand shadow-sm' : 'hover:bg-canvas',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => loadSession(s.id)}
                    className={cn(
                      'min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm',
                      isActive
                        ? 'text-white'
                        : 'text-muted group-hover:text-ink',
                    )}
                  >
                    {s.title || 'Untitled chat'}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'mr-1 h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                      isActive && 'opacity-100 hover:bg-white/20',
                    )}
                    onClick={() => deleteMutation.mutate(s.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2
                      className={cn(
                        'h-3.5 w-3.5',
                        isActive ? 'text-white' : 'text-red-500',
                      )}
                    />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 shadow-lg"
          style={{ background: 'oklch(0.22 0.03 250)' }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              AI Chat
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.15_150)]" />
              Live
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && !sendMutation.isPending && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-white/55">
                  Ask about HR policies, IT guides, or company procedures
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Vacation policy?', 'Password requirements?', 'Remote work rules?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs text-white/70 transition-colors hover:border-brand hover:bg-brand/20 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const sources = Array.isArray(msg.sources) ? (msg.sources as ChatSource[]) : [];
              return (
                <div key={msg.id} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                      isUser
                        ? 'rounded-tr-md bg-brand font-medium text-white shadow-md shadow-brand/25'
                        : 'rounded-tl-md border border-white/5 bg-white/[0.06] text-white/90',
                    )}
                  >
                    {!isUser && (
                      <div className="mb-1 text-xs font-semibold text-brand">Workhub AI</div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {!isUser && sources.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {sources.map((s, i) => (
                          <p key={i} className="text-xs italic text-white/45">
                            {formatSourceLine(s)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-white/5 bg-white/[0.06] px-4 py-3 text-sm text-white/90">
                  <div className="mb-1 text-xs font-semibold text-brand">Workhub AI</div>
                  <div className="flex items-center gap-1 py-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand/70 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand/70 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand/70 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 p-4">
            {sendError && (
              <p className="mb-2 text-sm text-red-400">{sendError}</p>
            )}
            <div className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (sendError) setSendError('');
                }}
                placeholder="Ask a question about your company docs..."
                className="min-h-12 h-12 resize-none border-white/10 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:ring-brand"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                size="icon"
                className="h-12 w-12 shrink-0"
                disabled={!input.trim() || sendMutation.isPending}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

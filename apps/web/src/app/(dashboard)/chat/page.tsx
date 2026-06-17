'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatService } from '@/services/chat.service';
import { ChatMessage } from '@/types/api.types';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

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
        <div className="hidden w-64 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="border-b border-slate-200 p-3">
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
                    isActive ? 'bg-brand shadow-sm' : 'hover:bg-slate-100',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => loadSession(s.id)}
                    className={cn(
                      'min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm',
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 group-hover:text-slate-900',
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

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-accent">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
              <p className="text-xs text-slate-500">Powered by your knowledge base</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full border border-brand-muted bg-brand-light p-5">
                  <Bot className="h-10 w-10 text-brand" />
                </div>
                <p className="text-sm text-slate-600">
                  Ask about HR policies, IT guides, or company procedures
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Vacation policy?', 'Password requirements?', 'Remote work rules?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs text-slate-600 shadow-sm transition-colors hover:border-brand hover:bg-brand-light hover:text-brand"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sendMutation.isPending && (
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-accent">
                  <Bot className="h-3 w-3" />
                  AI Assistant
                </div>
                <div className="flex items-center gap-1 py-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'ml-auto rounded-br-sm bg-brand text-white shadow-md shadow-brand/20'
                    : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-accent">
                    <Bot className="h-3 w-3" />
                    AI Assistant
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="text-xs font-medium text-slate-500">Sources</p>
                    {(msg.sources as { documentTitle: string; section?: string; excerpt: string }[]).map((s, i) => (
                      <p key={i} className="mt-1 text-xs text-slate-500">
                        {s.documentTitle}
                        {s.section ? ` · ${s.section.replace(/^\d+\.\s+/, '')}` : ''}: {s.excerpt}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-4">
            {sendError && (
              <p className="mb-2 text-sm text-red-600">{sendError}</p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (sendError) setSendError('');
                }}
                placeholder="Ask a question about your company docs..."
                className="min-h-[48px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                size="icon"
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

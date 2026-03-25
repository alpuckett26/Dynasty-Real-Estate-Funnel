'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm Dynasty, your real estate assistant. Are you looking to buy, sell, or relocate? I'd love to help!",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [showBooking, setShowBooking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId }),
      });

      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.bookingPrompt || data.humanHandoffRequired) {
        setShowBooking(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again or call us directly." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all md:bottom-6',
          open ? 'bg-gray-700 rotate-12' : 'bg-brand-600 hover:bg-brand-700 animate-pulse-soft'
        )}
        aria-label="Open chat"
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat window */}
      <div
        className={cn(
          'fixed bottom-36 right-5 z-50 flex w-80 flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 transition-all duration-300 md:bottom-24 md:w-96',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        style={{ maxHeight: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-navy-900 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white font-serif font-bold text-sm">
            D
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Dynasty Assistant</p>
            <p className="text-xs text-navy-300">Typically replies instantly</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 200 }}>
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}

          {showBooking && (
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-3 text-center">
              <p className="text-xs font-medium text-brand-800 mb-2">Ready to talk to an agent?</p>
              <a
                href={process.env.NEXT_PUBLIC_CALENDLY_URL ?? '/book'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                Book Free Consultation
              </a>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            AI assistant — for legal/financial advice, please consult a professional.
          </p>
        </div>
      </div>
    </>
  );
}

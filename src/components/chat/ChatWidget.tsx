'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm Adreanne's assistant. Are you looking to buy, sell, or just find out what you qualify for? I can help right now!",
};

// Teaser messages that rotate through — shown in the bubble before user opens chat
const TEASERS = [
  "👋 Thinking about buying in Baton Rouge?",
  "💰 Did you know you may qualify for up to $15k in down payment help?",
  "🏡 Wondering what your home is worth?",
  "✅ First-time buyer? I can walk you through the whole process.",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [showBooking, setShowBooking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show teaser bubble after 4 seconds, rotate every 6 seconds
  useEffect(() => {
    const showTimer = setTimeout(() => {
      if (!bubbleDismissed) {
        setShowBubble(true);
        setHasUnread(true);
      }
    }, 4000);

    return () => clearTimeout(showTimer);
  }, [bubbleDismissed]);

  useEffect(() => {
    if (!showBubble || open) return;
    const rotateTimer = setInterval(() => {
      setTeaserIndex((i) => (i + 1) % TEASERS.length);
    }, 6000);
    return () => clearInterval(rotateTimer);
  }, [showBubble, open]);

  // Auto-dismiss bubble after 18 seconds
  useEffect(() => {
    if (!showBubble) return;
    const dismissTimer = setTimeout(() => {
      setShowBubble(false);
    }, 18000);
    return () => clearTimeout(dismissTimer);
  }, [showBubble]);

  useEffect(() => {
    if (open) {
      setShowBubble(false);
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  function dismissBubble(e: React.MouseEvent) {
    e.stopPropagation();
    setShowBubble(false);
    setBubbleDismissed(true);
    setHasUnread(false);
  }

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
        { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please call Adreanne directly at (225) 284-6854." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Teaser bubble */}
      <div
        className={cn(
          'fixed bottom-24 right-5 z-50 max-w-[260px] transition-all duration-500 md:bottom-20',
          showBubble && !open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
        )}
      >
        <div
          className="relative cursor-pointer rounded-2xl rounded-br-sm bg-white px-4 py-3 shadow-xl ring-1 ring-black/8"
          onClick={() => setOpen(true)}
        >
          {/* Close */}
          <button
            onClick={dismissBubble}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>

          <p className="text-sm font-medium text-navy-950 leading-snug pr-2">
            {TEASERS[teaserIndex]}
          </p>
          <p className="mt-1.5 text-xs text-brand-600 font-semibold flex items-center gap-1">
            Chat with me <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
          </p>
        </div>
        {/* Tail */}
        <div className="absolute -bottom-2 right-5 h-3 w-3 rotate-45 bg-white ring-1 ring-black/8 clip-bottom" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
      </div>

      {/* Launcher button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-5 z-50 flex items-center gap-2.5 rounded-full shadow-xl transition-all duration-300 md:bottom-6',
          open
            ? 'bg-gray-700 h-12 w-12 justify-center'
            : 'bg-brand-600 hover:bg-brand-700 hover:shadow-2xl hover:scale-105 px-4 h-13'
        )}
        style={{ height: open ? undefined : '52px' }}
        aria-label="Open chat"
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <>
            <div className="relative flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
              {hasUnread && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-brand-600">
                  1
                </span>
              )}
            </div>
            <span className="text-sm font-semibold text-white pr-1">Ask Adreanne</span>
          </>
        )}
      </button>

      {/* Chat window */}
      <div
        className={cn(
          'fixed bottom-24 right-5 z-50 flex w-80 flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/8 transition-all duration-300 md:bottom-24 md:w-[360px]',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        style={{ maxHeight: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-navy-950 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white font-serif font-bold text-sm">
                A
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-navy-950" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Adreanne&apos;s Assistant</p>
              <p className="text-xs text-green-400 font-medium">Online now</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 200 }}>
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
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
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {showBooking && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 text-center">
              <p className="text-xs font-medium text-brand-900 mb-2">Ready to talk to Adreanne directly?</p>
              <a
                href="/book"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
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
              placeholder="Ask me anything..."
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            AI assistant · Not legal or financial advice
          </p>
        </div>
      </div>
    </>
  );
}

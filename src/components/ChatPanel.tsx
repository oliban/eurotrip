'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLocale } from '@/hooks/useLocale';
import { useTripDispatch, useTripContext } from '@/store/trip-context';
import ChatInput, { ChatInputHandle } from './ChatInput';
import ChatMessage from './ChatMessage';
import { ModeSelector } from './ModeSelector';
import { BurgerProgress } from './BurgerProgress';
import type { Locale } from '@/lib/i18n';
import type { TripMode } from '@/lib/types';

const LOCALE_OPTIONS: { value: Locale; flag: string; label: string; currencyLabel: string }[] = [
  { value: 'sv', flag: '\u{1F1F8}\u{1F1EA}', label: 'Svenska', currencyLabel: 'SEK' },
  { value: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'English', currencyLabel: 'EUR' },
];

export default function ChatPanel() {
  const { cityName: userLocation } = useUserLocation();
  const { locale, language, currency, t, setLocale } = useLocale();
  const { messages, status, error, sendMessage, stopStreaming, resetChat } = useChat({ userLocation, language, currency });
  const [showLocalePicker, setShowLocalePicker] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const { state: tripState } = useTripContext();

  // Show mode selector if no trip exists yet and no messages
  useEffect(() => {
    if (messages.length === 0 && tripState.stops.length === 0) {
      setShowModeSelector(true);
    }
  }, [messages.length, tripState.stops.length]);

  const suggestions = [t['chat.suggestion1'], t['chat.suggestion2'], t['chat.suggestion3']];
  const dispatch = useTripDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModeSelect = useCallback((mode: TripMode) => {
    dispatch({ type: 'UPDATE_TRIP', payload: { mode } });
    setShowModeSelector(false);
  }, [dispatch]);

  const handleReset = useCallback(() => {
    if (!window.confirm(t['chat.confirmReset'])) return;
    resetChat();
    dispatch({ type: 'RESET' });
    try { localStorage.removeItem('eurotrip_state'); } catch { /* ignore */ }
    setShowModeSelector(true);
  }, [resetChat, dispatch, t]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
    },
    [sendMessage]
  );

  const handleInlineSuggestionClick = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h1 className="text-base font-semibold text-zinc-900">{t['chat.title']}</h1>
        <div className="flex items-center gap-1">
          {/* Locale picker */}
          <div className="relative">
            <button
              onClick={() => setShowLocalePicker((v) => !v)}
              aria-label="Change language and currency"
              className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 min-h-[44px] -my-2"
            >
              <span className="text-base">{LOCALE_OPTIONS.find((o) => o.value === locale)?.flag}</span>
              <span className="text-xs font-medium">{currency}</span>
            </button>
            {showLocalePicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowLocalePicker(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                  {LOCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setLocale(opt.value);
                        setShowLocalePicker(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 ${
                        locale === opt.value ? 'text-blue-600 font-medium' : 'text-zinc-700'
                      }`}
                    >
                      <span className="text-base">{opt.flag}</span>
                      <span className="flex-1">{opt.label}</span>
                      <span className="text-xs text-zinc-400">{opt.currencyLabel}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Reset button */}
          <button
            onClick={handleReset}
            aria-label="Reset conversation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 min-w-[44px] min-h-[44px] -m-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 5H15M6 5V3.5C6 3.224 6.224 3 6.5 3H11.5C11.776 3 12 3.224 12 3.5V5M7 8V13M11 8V13M4.5 5L5.25 14.5C5.275 14.785 5.514 15 5.8 15H12.2C12.486 15 12.725 14.785 12.75 14.5L13.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {status === 'error' && error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-2 text-4xl">
              {/* Car/road emoji as visual cue */}
              <span role="img" aria-hidden="true" className="select-none">{'\u{1F699}'}</span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 text-center">
              {t['chat.emptyTitle']}
            </h2>
            <p className="mb-6 text-sm text-zinc-500 text-center max-w-xs">
              {t['chat.emptySubtitle']}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isLastAssistant =
                msg.role === 'assistant' &&
                index === messages.length - 1 &&
                (status === 'streaming' || status === 'processing_tools');

              const showSuggestions =
                msg.role === 'assistant' &&
                index === messages.length - 1 &&
                status === 'idle';

              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={isLastAssistant}
                  showSuggestions={showSuggestions}
                  onSuggestionClick={handleInlineSuggestionClick}
                />
              );
            })}

            {/* Tool processing indicator */}
            {status === 'processing_tools' && (
              <div className="flex items-center gap-2 px-1 py-2 text-sm text-zinc-500">
                <span className="dot-hop inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="dot-hop inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="dot-hop inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="ml-1">{t['chat.updatingTrip']}</span>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={scrollAnchorRef} />
          </>
        )}
      </div>

      {/* Burger Progress (Burger Challenge Mode) */}
      {tripState.metadata.mode === 'burger_challenge' && tripState.metadata.burgersCollected && (
        <div className="px-4 pb-4">
          <BurgerProgress
            achievements={tripState.metadata.burgersCollected}
            score={tripState.metadata.burgerScore || 0}
          />
        </div>
      )}

      {/* Input */}
      <ChatInput ref={chatInputRef} onSend={sendMessage} onStop={stopStreaming} status={status} />

      {/* Mode Selector */}
      {showModeSelector && <ModeSelector onSelect={handleModeSelect} />}
    </div>
  );
}

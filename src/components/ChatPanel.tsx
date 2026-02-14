'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLocale } from '@/hooks/useLocale';
import { useTripDispatch, useTripContext } from '@/store/trip-context';
import { hasApiKey } from '@/lib/storage';
import ChatInput, { ChatInputHandle } from './ChatInput';
import ChatMessage from './ChatMessage';
import { ApiKeyModal } from './ApiKeyModal';
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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const { state: tripState } = useTripContext();

  // Check for API key on mount
  useEffect(() => {
    if (!hasApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);

  // Show mode selector if no trip exists yet and no messages
  useEffect(() => {
    if (messages.length === 0 && tripState.stops.length === 0 && hasApiKey()) {
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
          {/* API Key Settings button */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            aria-label="API Key Settings"
            title="Manage API Key"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 min-w-[44px] min-h-[44px] -m-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
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

      {/* API Key Modal */}
      <ApiKeyModal open={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />

      {/* Mode Selector */}
      {showModeSelector && <ModeSelector onSelect={handleModeSelect} />}
    </div>
  );
}

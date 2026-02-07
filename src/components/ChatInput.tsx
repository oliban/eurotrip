'use client';

import React, { useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { ChatStatus } from '@/lib/types';
import { useLocale } from '@/hooks/useLocale';

export interface ChatInputHandle {
  setDraft: (text: string) => void;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  status: ChatStatus;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({ onSend, onStop, status }, ref) {
  const { t } = useLocale();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    setDraft: (text: string) => {
      setValue(text);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
      });
    },
  }));

  const isActive = status === 'streaming' || status === 'processing_tools';
  const canSend = value.trim().length > 0 && status === 'idle';

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Reset height to auto so scrollHeight is recalculated
    textarea.style.height = 'auto';
    // Clamp to 120px max
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || status !== 'idle') return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, status, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      adjustHeight();
    },
    [adjustHeight]
  );

  return (
    <div className="border-t border-zinc-200 bg-white px-3 py-3 sm:px-4">
      <div className="flex items-end gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t['input.placeholder']}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none min-h-[24px]"
          style={{ maxHeight: '120px' }}
        />

        {isActive ? (
          <button
            onClick={onStop}
            aria-label="Stop generating"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-white transition-colors hover:bg-zinc-700 active:bg-zinc-900 min-w-[44px] min-h-[44px] -m-2"
          >
            {/* Square stop icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="2" width="10" height="10" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:bg-zinc-300 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] -m-2"
          >
            {/* Arrow up send icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3L8 13M8 3L4 7M8 3L12 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

export default ChatInput;

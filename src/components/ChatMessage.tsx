'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  showSuggestions?: boolean;
  onSuggestionClick?: (text: string) => void;
}

/** Minimal markdown: convert **bold** and preserve newlines */
function renderFormattedText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split by newlines first, then handle bold within each line
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${lineIndex}`} />);
    }

    // Split by **bold** markers
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    segments.forEach((segment, segIndex) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        parts.push(
          <strong key={`${lineIndex}-${segIndex}`} className="font-semibold">
            {segment.slice(2, -2)}
          </strong>
        );
      } else {
        parts.push(segment);
      }
    });
  });

  return parts;
}

const TOOL_ICONS: Record<string, string> = {
  set_route: '\u{1F5FA}',     // map
  add_stop: '\u{1F4CD}',      // pin
  remove_stop: '\u{2716}',    // cross
  update_stop: '\u{270F}',    // pencil
  reorder_stops: '\u{1F504}', // arrows
  update_trip: '\u{2699}',    // gear
};

/** Extract <<suggestion>> markers from message text */
function extractSuggestions(text: string): { cleanText: string; suggestions: string[] } {
  const suggestions: string[] = [];
  const cleanText = text.replace(/<<(.+?)>>/g, (_, suggestion) => {
    suggestions.push(suggestion.trim());
    return '';
  }).replace(/\n{3,}/g, '\n\n').trim();
  return { cleanText, suggestions };
}

function ToolBadge({ name }: { name: string }) {
  const icon = TOOL_ICONS[name] || '\u{1F527}';
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
      <span className="text-[10px]">{icon}</span>
      {name}
    </span>
  );
}

export default function ChatMessage({ message, isStreaming, showSuggestions, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Extract suggestions from assistant messages
  const { cleanText, suggestions } = !isUser && message.content
    ? extractSuggestions(message.content)
    : { cleanText: message.content, suggestions: [] };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
        }`}
      >
        {/* Message text */}
        {cleanText && (
          <div className="whitespace-pre-wrap break-words">
            {renderFormattedText(cleanText)}
            {isStreaming && (
              <span className="inline-block w-[2px] h-4 bg-zinc-600 ml-0.5 align-text-bottom animate-pulse" />
            )}
          </div>
        )}

        {/* Hopping dots thinking indicator */}
        {!cleanText && isStreaming && (
          <div className="flex items-center gap-1 py-1">
            <span className="dot-hop inline-block h-2 w-2 rounded-full bg-zinc-400" />
            <span className="dot-hop inline-block h-2 w-2 rounded-full bg-zinc-400" />
            <span className="dot-hop inline-block h-2 w-2 rounded-full bg-zinc-400" />
          </div>
        )}

        {/* Tool call badges */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.toolCalls.map((tc) => (
              <ToolBadge key={tc.id} name={tc.name} />
            ))}
          </div>
        )}
      </div>

      {/* Suggestion chips — shown below the bubble */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 max-w-[85%] sm:max-w-[75%]">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300 active:bg-blue-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

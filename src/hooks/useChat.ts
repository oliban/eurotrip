'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ChatMessage,
  ChatStatus,
  ToolCallAccumulator,
  ParsedToolCall,
  ToolCallInfo,
  TripState,
} from '@/lib/types';
import { processToolCall } from '@/lib/process-tool-calls';
import { useTripContext } from '@/store/trip-context';

const MAX_CONTINUATION_ROUNDS = 10;

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

interface AnthropicMessage {
  role: string;
  content: unknown;
}

interface UseChatOptions {
  userLocation?: string | null;
  language?: string;
  currency?: string;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { state: tripState, dispatch } = useTripContext();

  // Refs for stream management
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  // Ref for current assistant text during streaming (avoids excessive re-renders)
  const streamingTextRef = useRef('');
  const rafIdRef = useRef<number | null>(null);
  const currentMessageIdRef = useRef<string>('');

  // Keep a ref to the latest tripState so the streaming loop always sees current state
  const tripStateRef = useRef<TripState>(tripState);
  tripStateRef.current = tripState;

  // Keep a ref to the latest userLocation
  const userLocationRef = useRef<string | null>(options?.userLocation ?? null);
  userLocationRef.current = options?.userLocation ?? null;

  const languageRef = useRef<string | undefined>(options?.language);
  languageRef.current = options?.language;

  const currencyRef = useRef<string | undefined>(options?.currency);
  currencyRef.current = options?.currency;

  // Schedule a state commit via requestAnimationFrame for streaming text
  const scheduleTextCommit = useCallback(() => {
    if (rafIdRef.current !== null) return; // already scheduled
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const text = streamingTextRef.current;
      const msgId = currentMessageIdRef.current;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: text } : m))
      );
    });
  }, []);

  // Cancel any pending animation frame
  const cancelRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  /**
   * Parse and process a single SSE stream from the API.
   * Returns { stopReason, toolCalls, text } when the stream ends.
   */
  const processStream = useCallback(
    async (
      response: Response,
      assistantMsgId: string,
      signal: AbortSignal
    ): Promise<{
      stopReason: string | null;
      parsedToolCalls: ParsedToolCall[];
      toolCallInfos: ToolCallInfo[];
      text: string;
    }> => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let currentEvent = '';
      let stopReason: string | null = null;

      // Tool call accumulation
      const toolAccumulators: Map<number, ToolCallAccumulator> = new Map();
      const parsedToolCalls: ParsedToolCall[] = [];
      const toolCallInfos: ToolCallInfo[] = [];

      try {
        while (true) {
          if (signal.aborted) break;

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            if (!line.startsWith('data: ')) continue;

            const dataStr = line.slice(6);
            if (!dataStr || dataStr === '[DONE]') continue;

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(dataStr);
            } catch {
              // Malformed JSON line, skip
              continue;
            }

            switch (currentEvent) {
              case 'message_start': {
                // Message started; nothing special to do
                break;
              }

              case 'content_block_start': {
                const contentBlock = data.content_block as Record<string, unknown> | undefined;
                if (contentBlock && contentBlock.type === 'tool_use') {
                  const index = data.index as number;
                  toolAccumulators.set(index, {
                    id: contentBlock.id as string,
                    name: contentBlock.name as string,
                    inputJson: '',
                  });
                }
                break;
              }

              case 'content_block_delta': {
                const delta = data.delta as Record<string, unknown> | undefined;
                if (!delta) break;

                if (delta.type === 'text_delta') {
                  const text = delta.text as string;
                  streamingTextRef.current += text;
                  scheduleTextCommit();
                } else if (delta.type === 'input_json_delta') {
                  const index = data.index as number;
                  const accumulator = toolAccumulators.get(index);
                  if (accumulator) {
                    accumulator.inputJson += delta.partial_json as string;
                  }
                }
                break;
              }

              case 'content_block_stop': {
                const index = data.index as number;
                const accumulator = toolAccumulators.get(index);
                if (accumulator) {
                  // Parse the accumulated JSON
                  let parsedInput: Record<string, unknown> = {};
                  try {
                    parsedInput = JSON.parse(accumulator.inputJson || '{}');
                  } catch (e) {
                    console.error('Failed to parse tool call JSON:', e, accumulator.inputJson);
                  }

                  const parsed: ParsedToolCall = {
                    id: accumulator.id,
                    name: accumulator.name,
                    input: parsedInput,
                  };
                  parsedToolCalls.push(parsed);

                  // Process the tool call immediately against current trip state
                  const result = processToolCall(parsed, tripStateRef.current);

                  // Dispatch all actions to the trip reducer
                  for (const action of result.actions) {
                    dispatch(action);
                  }

                  const info: ToolCallInfo = {
                    id: accumulator.id,
                    name: accumulator.name,
                    input: parsedInput,
                    result: result.result,
                  };
                  toolCallInfos.push(info);

                  toolAccumulators.delete(index);
                }
                break;
              }

              case 'message_delta': {
                const delta = data.delta as Record<string, unknown> | undefined;
                if (delta && delta.stop_reason) {
                  stopReason = delta.stop_reason as string;
                }
                break;
              }

              case 'message_stop': {
                // Stream complete
                break;
              }

              case 'error': {
                const errorData = data as Record<string, unknown>;
                throw new Error(
                  (errorData.message as string) ||
                    (errorData.error as Record<string, unknown>)?.message as string ||
                    'Stream error'
                );
              }

              default:
                // Unknown event, ignore
                break;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Final text commit
      cancelRaf();
      const finalText = streamingTextRef.current;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: finalText, toolCalls: toolCallInfos.length > 0 ? toolCallInfos : undefined }
            : m
        )
      );

      return { stopReason, parsedToolCalls, toolCallInfos, text: finalText };
    },
    [scheduleTextCommit, cancelRaf, dispatch]
  );

  /**
   * Build the Anthropic-format messages array from our ChatMessage state,
   * including tool_result blocks for continuation.
   */
  const buildApiMessages = useCallback(
    (
      chatMessages: ChatMessage[],
      pendingToolResults?: Array<{ tool_use_id: string; content: string }>
    ): AnthropicMessage[] => {
      const apiMessages: AnthropicMessage[] = [];
      // Track which tool_use ids will get results from pendingToolResults to avoid duplicates
      const pendingIds = new Set(pendingToolResults?.map((tr) => tr.tool_use_id) ?? []);

      for (const msg of chatMessages) {
        if (msg.role === 'user') {
          apiMessages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          // Build content blocks for assistant message
          const contentBlocks: Array<Record<string, unknown>> = [];

          if (msg.content) {
            contentBlocks.push({ type: 'text', text: msg.content });
          }

          if (msg.toolCalls) {
            for (const tc of msg.toolCalls) {
              contentBlocks.push({
                type: 'tool_use',
                id: tc.id,
                name: tc.name,
                input: tc.input,
              });
            }
          }

          if (contentBlocks.length > 0) {
            apiMessages.push({ role: 'assistant', content: contentBlocks });
          }

          // Every assistant message with tool_use must be followed by tool_result
          // Skip tool calls that will be covered by pendingToolResults
          if (msg.toolCalls && msg.toolCalls.length > 0) {
            const historicalResults = msg.toolCalls.filter((tc) => !pendingIds.has(tc.id));
            if (historicalResults.length > 0) {
              apiMessages.push({
                role: 'user',
                content: historicalResults.map((tc) => ({
                  type: 'tool_result',
                  tool_use_id: tc.id,
                  content: tc.result || 'Done',
                })),
              });
            }
          }
        }
      }

      // Append tool_result blocks as a user message for continuation
      if (pendingToolResults && pendingToolResults.length > 0) {
        apiMessages.push({
          role: 'user',
          content: pendingToolResults.map((tr) => ({
            type: 'tool_result',
            tool_use_id: tr.tool_use_id,
            content: tr.content,
          })),
        });
      }

      return apiMessages;
    },
    []
  );

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreamingRef.current) return;

      setError(null);
      isStreamingRef.current = true;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: userText.trim(),
        timestamp: Date.now(),
      };

      // We need to track current messages for the continuation loop
      let currentMessages: ChatMessage[] = [];
      setMessages((prev) => {
        currentMessages = [...prev, userMessage];
        return currentMessages;
      });

      // Small delay to ensure state is committed
      await new Promise((resolve) => setTimeout(resolve, 0));

      let continuationRound = 0;
      let pendingToolResults: Array<{ tool_use_id: string; content: string }> | undefined;

      try {
        while (continuationRound < MAX_CONTINUATION_ROUNDS) {
          if (abortController.signal.aborted) break;

          continuationRound++;

          // Set status based on whether this is a tool continuation
          setStatus(pendingToolResults ? 'processing_tools' : 'streaming');

          // Create a placeholder assistant message
          const assistantMsgId = generateMessageId();
          currentMessageIdRef.current = assistantMsgId;
          streamingTextRef.current = '';

          const assistantMessage: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          currentMessages = [...currentMessages, assistantMessage];

          // Build API messages
          const apiMessages = buildApiMessages(currentMessages.slice(0, -1), pendingToolResults);

          // Make the API request (server-side API key only)
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: apiMessages,
              tripState: tripStateRef.current,
              userLocation: userLocationRef.current,
              language: languageRef.current,
              currency: currencyRef.current,
            }),
            signal: abortController.signal,
          });

          if (!response.ok) {
            let errorMsg = `API error: ${response.status}`;
            try {
              const errorBody = await response.json();
              errorMsg = errorBody.error || errorMsg;
            } catch {
              // Use default error message
            }
            throw new Error(errorMsg);
          }

          if (!response.body) {
            throw new Error('No response body');
          }

          // Process the SSE stream
          const streamResult = await processStream(
            response,
            assistantMsgId,
            abortController.signal
          );

          // Update currentMessages with the final assistant message
          currentMessages = currentMessages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: streamResult.text,
                  toolCalls:
                    streamResult.toolCallInfos.length > 0
                      ? streamResult.toolCallInfos
                      : undefined,
                }
              : m
          );

          // Also ensure messages state is in sync
          setMessages(currentMessages);

          // Check if we need to continue (tool_use stop reason)
          if (streamResult.stopReason === 'tool_use' && streamResult.toolCallInfos.length > 0) {
            // Build tool results for the continuation request
            pendingToolResults = streamResult.toolCallInfos.map((tc) => ({
              tool_use_id: tc.id,
              content: tc.result || 'Done',
            }));
            // Continue the loop
          } else {
            // We're done (end_turn, max_tokens, or no more tool calls)
            break;
          }
        }

        setStatus('idle');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User cancelled, not an error
          setStatus('idle');
        } else {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
          setError(errorMessage);
          setStatus('error');
          console.error('Chat error:', err);
        }
      } finally {
        cancelRaf();
        isStreamingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [buildApiMessages, processStream, cancelRaf]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStreamingRef.current = false;
    cancelRaf();
    setStatus('idle');
  }, [cancelRaf]);

  const resetChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, [stopStreaming]);

  return { messages, status, error, sendMessage, stopStreaming, resetChat };
}

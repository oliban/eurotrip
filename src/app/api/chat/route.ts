import { TRIP_TOOLS } from '@/lib/tools';
import { buildSystemPrompt } from '@/lib/system-prompt';
import { TripState } from '@/lib/types';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  // Accept user-provided API key or fall back to server key
  const userApiKey = req.headers.get('x-anthropic-key');
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key required. Please provide your Anthropic API key.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { messages: Array<{ role: string; content: unknown }>; tripState: TripState; userLocation?: string | null; language?: string; currency?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { messages, tripState, userLocation, language, currency } = body;

  // Input validation
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), { status: 400 });
  }
  if (messages.length > 100) {
    return new Response(JSON.stringify({ error: 'Too many messages' }), { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(
    tripState ?? { metadata: { name: '' }, stops: [], route_segments: [], selectedStopId: null },
    userLocation ?? undefined,
    language,
    currency
  );

  // Abort controller with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools: TRIP_TOOLS,
        messages,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text().catch(() => '');
      // Send structured error as SSE so client can handle it
      const errorStream = new ReadableStream({
        start(ctrl) {
          const event = `event: error\ndata: ${JSON.stringify({
            type: 'api_error',
            status: anthropicResponse.status,
            message: errorBody || 'Anthropic API error',
          })}\n\n`;
          ctrl.enqueue(new TextEncoder().encode(event));
          ctrl.close();
        },
      });
      return new Response(errorStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Stream through the response
    const stream = new ReadableStream({
      async start(ctrl) {
        const reader = anthropicResponse.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            ctrl.enqueue(value);
          }
          ctrl.close();
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            reader.cancel();
          } else {
            ctrl.error(err);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), { status: 504 });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-anthropic-key');

  if (!key) {
    return Response.json({ error: 'No API key provided' }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: key });

    // Quick test call with minimal tokens
    await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('API key test failed:', e);
    return Response.json(
      { error: 'Invalid API key or authentication failed' },
      { status: 401 }
    );
  }
}

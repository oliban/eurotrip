# Code Review: Burger Features Plan

## Review Date: 2026-02-14
## Reviewer: Rolf

---

## Findings from Current Codebase

### ✅ Already Implemented (Partially)
1. **'burger' category exists** in `tools.ts` activity enum
2. **Burger enthusiasm question** mentioned in `system-prompt.ts`
3. **Reference to `add_burger_recommendations` tool** in system prompt (BUT NOT IMPLEMENTED YET)

### 🔍 Current Structure Analysis

**Activity Type:**
```typescript
// Current (types.ts)
export interface Activity {
  name: string;
  description?: string;
  duration_hours?: number;
  cost_estimate?: number;
  category?: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'relaxation' | 'nightlife' | 'shopping';
}
```
- ❌ No 'burger' in types.ts enum (but EXISTS in tools.ts!)
- ❌ Missing: `specialty`, `address`, `time` fields for detailed burger info

**Tools:**
- ✅ `set_route`, `add_stop`, `update_stop`, `remove_stop`, `reorder_stops`, `update_trip` exist
- ❌ `add_burger_recommendations` mentioned but NOT defined in tools.ts
- ❌ No `add_burger_activity` tool

---

## Plan Revisions Based on Code Review

### CHANGE 1: Fix Activity Category Type Mismatch
**Issue:** `tools.ts` has 'burger' but `types.ts` doesn't

**Fix:**
```typescript
// types.ts - Line ~16
export interface Activity {
  name: string;
  description?: string;
  duration_hours?: number;
  cost_estimate?: number;
  category?: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'relaxation' | 'nightlife' | 'shopping' | 'burger' | 'fondue'; // ADD burger + fondue
  // NEW fields for burger/fondue details:
  specialty?: string;  // e.g., "Smash burger with truffle fries"
  address?: string;    // Restaurant address
  time?: string;       // e.g., "Lunch 13:00"
}
```

### CHANGE 2: Implement the Referenced Tool
**Issue:** System prompt mentions `add_burger_recommendations` but it doesn't exist

**Decision:** 
- Option A: Implement `add_burger_recommendations` as system prompt expects
- Option B: Rename to `add_burger_activity` (more explicit)
- **CHOSEN: Option A** - Honor the existing system prompt reference

**Implementation:**
```typescript
// tools.ts - Add after update_trip tool
{
  name: 'add_burger_recommendations',
  description: 'Add burger restaurant recommendations to one or more stops. Use this after creating a route when the user is a burger enthusiast.',
  input_schema: {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            stop_name: { type: 'string', description: 'Name of the stop/city' },
            burgers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  restaurant_name: { type: 'string' },
                  specialty: { type: 'string', description: 'Signature burger or dish' },
                  address: { type: 'string' },
                  cost_estimate: { type: 'number', description: 'Cost per person in EUR' },
                  time_suggestion: { type: 'string', description: 'e.g., Lunch, Dinner' },
                  description: { type: 'string' }
                },
                required: ['restaurant_name', 'specialty', 'cost_estimate']
              }
            }
          },
          required: ['stop_name', 'burgers']
        }
      }
    },
    required: ['recommendations']
  }
}
```

### CHANGE 3: Simplify Initial Scope

**Original Plan Issues:**
1. Too ambitious for first iteration
2. Google Places API adds complexity + cost + API key management
3. Burger Challenge is fun but can be Phase 2

**REVISED IMPLEMENTATION ORDER:**

#### Phase 1: Core Burger Features (MVP for Bobby)
1. ✅ **AI-Key Support** (3-4h) - CRITICAL for deployment
2. ✅ **Fix Activity Type** (15min) - type safety
3. ✅ **Implement `add_burger_recommendations` tool** (2h)
4. ✅ **Update system prompt** (1h) - refine burger flow
5. ✅ **UI: Burger Activity Cards** (2h) - special rendering for category='burger'
6. ✅ **Test burger flow** (1h)

**TOTAL PHASE 1: ~9-10 hours**

#### Phase 2: Enhanced Features (Post-MVP)
- Places API Integration (4-5h)
- Burger Challenge Mode (5-6h)
- Fondue support (1-2h)

**RATIONALE:**
- Get Bobby something working FAST
- He wants to deploy and use it NOW
- Phase 2 can come after user feedback

---

## Detailed Implementation Plan - Phase 1

### Task 1: AI-Key Support (CRITICAL)
**Priority:** P0 (must have for deployment)
**Estimated Time:** 3-4 hours
**Files:**
- `src/components/ApiKeyModal.tsx` (NEW)
- `src/components/ChatPanel.tsx` (add settings button)
- `src/hooks/useChat.ts` (send API key in headers)
- `src/app/api/chat/route.ts` (accept user key)
- `src/lib/storage.ts` (NEW - localStorage helpers with encryption)

**Implementation Details:**

1. **ApiKeyModal.tsx**
```tsx
'use client';
import { useState, useEffect } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/storage';

export function ApiKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const existing = getApiKey();
    if (existing) setKey('sk-ant-...' + existing.slice(-6));
  }, []);
  
  async function testKey() {
    setTesting(true);
    setError('');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'x-anthropic-key': key }
      });
      if (!res.ok) throw new Error('Invalid API key');
      setApiKey(key);
      onClose();
    } catch (e) {
      setError('Invalid API key. Please check and try again.');
    } finally {
      setTesting(false);
    }
  }
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">🔑 Anthropic API Key Required</h2>
        <p className="text-sm text-gray-600 mb-4">
          This app uses Claude AI to plan your trip. You'll need your own API key from Anthropic.
        </p>
        <a 
          href="https://console.anthropic.com/" 
          target="_blank" 
          className="text-blue-600 text-sm underline mb-4 block"
        >
          Get your free API key here →
        </a>
        
        <input
          type="password"
          placeholder="sk-ant-api03-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-2"
        />
        
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        
        <div className="flex gap-2">
          <button
            onClick={testKey}
            disabled={!key || testing}
            className="flex-1 bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Save & Test'}
          </button>
          <button
            onClick={() => setKey('')}
            className="px-4 py-2 border rounded"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
```

2. **storage.ts**
```typescript
// Simple localStorage wrapper
const API_KEY_STORAGE_KEY = 'eurotrip_anthropic_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}
```

3. **Update useChat.ts**
```typescript
// Add to fetch call
import { getApiKey } from '@/lib/storage';

const apiKey = getApiKey();
if (!apiKey) {
  // Show modal or error
  return;
}

const response = await fetch('/api/chat', {
  // ... existing
  headers: {
    'Content-Type': 'application/json',
    'x-anthropic-key': apiKey, // ADD THIS
  },
});
```

4. **Update api/chat/route.ts**
```typescript
export async function POST(req: Request) {
  const userApiKey = req.headers.get('x-anthropic-key');
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key required' }), 
      { status: 401 }
    );
  }
  
  // Use apiKey in Anthropic client
  const anthropic = new Anthropic({ apiKey });
  // ... rest of existing code
}
```

5. **New route: api/test-key/route.ts**
```typescript
import { Anthropic } from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const key = req.headers.get('x-anthropic-key');
  if (!key) return new Response('No key provided', { status: 400 });
  
  try {
    const anthropic = new Anthropic({ apiKey: key });
    // Quick test call
    await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    });
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Invalid key', { status: 401 });
  }
}
```

6. **ChatPanel.tsx changes**
```tsx
// Add state
const [showKeyModal, setShowKeyModal] = useState(false);

// Check on mount
useEffect(() => {
  const key = getApiKey();
  if (!key) setShowKeyModal(true);
}, []);

// Add to header
<button onClick={() => setShowKeyModal(true)}>⚙️</button>

<ApiKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />
```

---

### Task 2: Fix Activity Type (type safety)
**Priority:** P1
**Estimated Time:** 15 minutes
**Files:** `src/lib/types.ts`

**Change:**
```typescript
// Line ~16
export interface Activity {
  name: string;
  description?: string;
  duration_hours?: number;
  cost_estimate?: number;
  category?: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'relaxation' | 'nightlife' | 'shopping' | 'burger' | 'fondue';
  // New fields for detailed food recommendations:
  specialty?: string;
  address?: string;
  time?: string;
}
```

---

### Task 3: Implement add_burger_recommendations Tool
**Priority:** P1
**Estimated Time:** 2 hours
**Files:**
- `src/lib/tools.ts` (add tool definition)
- `src/lib/process-tool-calls.ts` (handle tool call)
- `src/hooks/useTrip.ts` (add reducer action)

**1. tools.ts - Add tool**
```typescript
{
  name: 'add_burger_recommendations',
  description: 'Add burger restaurant recommendations as activities to specific stops. Use this for burger enthusiasts to suggest the best burger joints at each city.',
  input_schema: {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            stop_name: { type: 'string', description: 'Name of the city/stop' },
            burgers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  restaurant_name: { type: 'string' },
                  specialty: { type: 'string', description: 'Signature burger' },
                  address: { type: 'string' },
                  cost_estimate: { type: 'number', description: 'Price per person in EUR' },
                  time_suggestion: { type: 'string', description: 'Lunch or Dinner' },
                  description: { type: 'string' }
                },
                required: ['restaurant_name', 'specialty', 'cost_estimate']
              }
            }
          },
          required: ['stop_name', 'burgers']
        }
      }
    },
    required: ['recommendations']
  }
}
```

**2. types.ts - Add action**
```typescript
export type TripAction =
  // ... existing
  | { type: 'ADD_BURGER_RECOMMENDATIONS'; payload: { stopName: string; burgers: Array<{
      restaurant_name: string;
      specialty: string;
      address?: string;
      cost_estimate: number;
      time_suggestion?: string;
      description?: string;
    }> }[] };
```

**3. useTrip.ts - Handle action**
```typescript
case 'ADD_BURGER_RECOMMENDATIONS':
  action.payload.forEach(({ stopName, burgers }) => {
    const stop = draft.stops.find(s => s.name === stopName);
    if (!stop) return;
    
    burgers.forEach(burger => {
      stop.activities.push({
        name: burger.restaurant_name,
        category: 'burger',
        specialty: burger.specialty,
        address: burger.address,
        cost_estimate: burger.cost_estimate * (draft.metadata.travelers || 1),
        time: burger.time_suggestion,
        description: burger.description
      });
    });
  });
  break;
```

**4. process-tool-calls.ts - Map tool to action**
```typescript
case 'add_burger_recommendations':
  return {
    type: 'ADD_BURGER_RECOMMENDATIONS',
    payload: parsed.input.recommendations
  };
```

---

### Task 4: Update System Prompt
**Priority:** P1
**Estimated Time:** 1 hour
**Files:** `src/lib/system-prompt.ts`

**Changes:**
1. Make burger question more prominent
2. Add examples of burger recommendations
3. Clarify when to use the tool

```typescript
// Around line 25, update burger question:
7. **Burger enthusiasm** (IMPORTANT if they're foodies) — Do they love burgers? If yes, you'll include 2-3 of the BEST burger restaurants at each stop as activities!

// Around line 60, enhance burger section:
- **BURGER LOVERS:** If the user is a burger enthusiast, ALWAYS use `add_burger_recommendations` immediately AFTER calling `set_route`. Include 2-3 burger spots per stop with:
  * Mix of: famous chains (Five Guys, Shake Shack), local legends, gourmet spots, hidden gems
  * Specific restaurant names (REAL places, not generic)
  * Signature burgers (e.g., "The Big Kahuna Burger with bacon jam")
  * Realistic prices per person
  * Time suggestions (Lunch/Dinner)
  * Addresses when known
  
Example burger recommendation:
{
  stop_name: "Copenhagen",
  burgers: [
    {
      restaurant_name: "Gasoline Grill",
      specialty: "Chili-cheese burger with crispy bacon",
      address: "Landgreven 10, 1301 Copenhagen",
      cost_estimate: 12,
      time_suggestion: "Lunch"
    },
    {
      restaurant_name: "Tommi's Burger Joint",
      specialty: "Classic Tommi burger with homemade fries",
      cost_estimate: 15,
      time_suggestion: "Dinner"
    }
  ]
}
```

---

### Task 5: UI - Burger Activity Cards
**Priority:** P1
**Estimated Time:** 2 hours
**Files:**
- `src/components/BurgerCard.tsx` (NEW)
- `src/components/PlanView.tsx` (use BurgerCard)

**1. BurgerCard.tsx**
```tsx
import { Activity } from '@/lib/types';

export function BurgerCard({ activity, travelers }: { activity: Activity; travelers: number }) {
  return (
    <div className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-3xl">🍔</span>
        <div className="flex-1">
          <h4 className="font-bold text-lg text-gray-900">{activity.name}</h4>
          {activity.specialty && (
            <p className="text-sm italic text-amber-800 mt-1">
              "{activity.specialty}"
            </p>
          )}
          {activity.description && (
            <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
          )}
          {activity.address && (
            <p className="text-xs text-gray-500 mt-1">📍 {activity.address}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            {activity.cost_estimate && (
              <span className="text-sm font-semibold text-gray-900">
                €{activity.cost_estimate} 
                <span className="text-xs text-gray-500 ml-1">
                  (€{Math.round(activity.cost_estimate / travelers)}/person)
                </span>
              </span>
            )}
            {activity.time && (
              <span className="text-xs bg-amber-200 px-2 py-1 rounded">
                {activity.time}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**2. PlanView.tsx - Use BurgerCard**
```tsx
import { BurgerCard } from './BurgerCard';

// In activities rendering section:
{stop.activities.map((activity, i) => 
  activity.category === 'burger' ? (
    <BurgerCard 
      key={i} 
      activity={activity} 
      travelers={trip.metadata.travelers || 1}
    />
  ) : (
    // existing activity card rendering
  )
)}
```

---

### Task 6: Testing
**Priority:** P0
**Estimated Time:** 1 hour

**Test Cases:**

1. **API Key Flow**
   - [ ] Fresh user sees API key modal
   - [ ] Invalid key shows error
   - [ ] Valid key saves and closes modal
   - [ ] Settings button reopens modal
   - [ ] Can clear and re-enter key

2. **Burger Flow**
   - [ ] Start conversation
   - [ ] Answer questions including "Do you love burgers?" → Yes
   - [ ] Claude creates route with `set_route`
   - [ ] Claude immediately calls `add_burger_recommendations`
   - [ ] Burger activities appear in each stop
   - [ ] Burger cards render with special styling
   - [ ] Costs are correct (total for group)

3. **Edge Cases**
   - [ ] User says no to burgers → no burger tool called
   - [ ] Add stop after route → no burgers auto-added (only via explicit request)
   - [ ] Update stop → existing burgers preserved

---

## Summary

**Phase 1 Scope:**
- AI-Key support ✅
- Type fixes ✅
- `add_burger_recommendations` tool ✅
- Enhanced system prompt ✅
- Burger UI cards ✅
- Testing ✅

**Total Estimated Time: 9-10 hours**

**Deferred to Phase 2:**
- Google Places API integration
- Burger Challenge mode
- Fondue support

**Rationale:**
Get Bobby a working, deployable burger-enhanced trip planner ASAP. Phase 2 can come after real-world usage and feedback.

---

## Deployment Options

### Option A: Vercel (Recommended for simplicity)
**Pros:** Zero-config Next.js deployment, automatic HTTPS, global CDN
**Cons:** Limited control over infrastructure

**Steps:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Environment Variables:**
- `NEXT_PUBLIC_MAPBOX_TOKEN` (required)
- `ANTHROPIC_API_KEY` (optional - fallback for demo mode)

---

### Option B: Fly.io (Requested by Fredrik)
**Pros:** Full control, Docker-based, EU hosting (Stockholm region), good free tier
**Cons:** Requires more setup

**Prerequisites:**
- Install flyctl: `curl -L https://fly.io/install.sh | sh`
- Login: `fly auth login`

**Initial Setup (one-time):**
```bash
cd /home/node/.openclaw/workspace/eurotrip

# Create Fly.io app
fly apps create eurotrip

# Set secrets
fly secrets set NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# Optional: Set fallback Anthropic key for demo mode
fly secrets set ANTHROPIC_API_KEY=sk-ant-your_key_here

# Deploy
fly deploy
```

**Subsequent Deploys:**
```bash
fly deploy
```

**Custom Domain (optional):**
```bash
fly certs add eurotrip.yourdomain.com
# Then add CNAME: eurotrip.yourdomain.com → eurotrip.fly.dev
```

**Files Created for Fly.io:**
- ✅ `Dockerfile` - Multi-stage Next.js production build
- ✅ `fly.toml` - Fly.io configuration (Stockholm region, auto-scaling)
- ✅ `.dockerignore` - Optimize Docker build
- ✅ `next.config.ts` - Updated with `output: 'standalone'`

**Monitoring:**
```bash
fly status
fly logs
fly scale show
```

---

## Deployment Checklist

Once Phase 1 is complete:

- [ ] Test locally end-to-end
- [ ] Commit to git
- [ ] Push to GitHub (oliban/eurotrip)
- [ ] **Choose deployment platform:**
  - [ ] Vercel: `vercel --prod`
  - [ ] Fly.io: `fly deploy`
- [ ] Set environment variables (Mapbox token, optional Anthropic key)
- [ ] Test deployed version
- [ ] Send Bobby:
  - URL (e.g., eurotrip.fly.dev or eurotrip.vercel.app)
  - Instructions: "Get your Anthropic API key from console.anthropic.com"
  - Bonus: "Tell the AI you love burgers 🍔"

---

**Status:** Ready for implementation ✅
**Next Step:** Begin Task 1 (API-Key Support)

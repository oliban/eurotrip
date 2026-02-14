# Eurotrip Burger Features - Detaljerad Plan

## 0. AI-Key Support (KRITISKT FÖR DEPLOYMENT)

### Problem
- Just nu: `ANTHROPIC_API_KEY` i `.env.local` (server-side only)
- Deployed: Kan inte dela vår key med alla users (kostar pengar + security risk)

### Lösning: User-Provided API Key
**Implementation:**

1. **New Component: `ApiKeyInput.tsx`**
   - Modal/panel som visas första gången
   - Input field för Anthropic API key
   - "Get your free key at console.anthropic.com"
   - Sparas i localStorage (krypterat med Web Crypto API)
   - "Test Connection" knapp
   - Optional: "Use demo mode" (limited to 5 messages, uses our backend key)

2. **Backend Changes: `/api/chat/route.ts`**
   ```typescript
   // Accept API key from request header
   const userApiKey = request.headers.get('x-anthropic-key');
   const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
   
   if (!apiKey) {
     return new Response('API key required', { status: 401 });
   }
   ```

3. **Frontend Changes: `useChat.ts`**
   ```typescript
   const apiKey = localStorage.getItem('anthropic_api_key');
   
   fetch('/api/chat', {
     headers: {
       'x-anthropic-key': apiKey,
       // ...
     }
   });
   ```

4. **UI/UX Flow:**
   - First visit → API key modal
   - Settings icon in header → manage API key
   - Error "Invalid API key" → prompt to re-enter
   - Optional: Show usage/cost estimate

**Files to modify:**
- `src/components/ApiKeyInput.tsx` (NEW)
- `src/components/ChatPanel.tsx` (add settings icon)
- `src/hooks/useChat.ts` (send key in headers)
- `src/app/api/chat/route.ts` (accept user key)
- `src/lib/crypto.ts` (NEW - encrypt/decrypt key in localStorage)

**Estimated work:** 3-4 hours

---

## 1. Burger Hunter Mode (Vibe Option)

### Koncept
Lägg till "Foodie (Burger Hunter)" som vibe-option. När vald: varje stopp får automatiskt burger-rekommendationer.

### Implementation

**A. System Prompt Changes (`src/lib/system-prompt.ts`)**
```typescript
const vibeOptions = [
  'Luxury',
  'Budget',
  'Party',
  'Foodie (Burger Hunter)', // NEW
  'Chill & Scenic',
  'Cultural & Museums'
];

// När vibe = Burger Hunter:
"When the user has selected 'Foodie (Burger Hunter)' vibe, you MUST include 
at least 2-3 burger restaurant recommendations as activities for each stop. 
Format: 'Burger at [Restaurant Name] - [Specialty] ([Price])'
Example: 'Burger at Tommi's Burger Joint - Classic smash burger with crispy fries (€15)'"
```

**B. Activity Type Extension (`src/lib/types.ts`)**
```typescript
export interface Activity {
  name: string;
  time?: string;
  cost?: number;
  type?: 'burger' | 'museum' | 'restaurant' | 'sightseeing' | 'other'; // NEW
  specialty?: string; // NEW - for burger joints
  address?: string; // NEW
}
```

**C. UI Changes (`src/components/PlanView.tsx`)**
```typescript
// Visa burger-aktiviteter med special icon
{activity.type === 'burger' && <span>🍔</span>}
{activity.specialty && <em className="text-sm">"{activity.specialty}"</em>}
```

**Files to modify:**
- `src/lib/system-prompt.ts`
- `src/lib/types.ts`
- `src/components/PlanView.tsx`
- `src/components/ChatMessage.tsx` (suggestion chips för vibes)

**Data source:** Claude's knowledge (2024+) om burger-ställen
**Estimated work:** 2 hours

---

## 2. Hamburgare som Dedikerad Aktivitet

### Koncept
Burger restaurants blir first-class activities med full metadata (namn, adress, specialitet, pris).

### Implementation

**A. New Tool: `add_burger_activity` (`src/lib/tools.ts`)**
```typescript
{
  name: "add_burger_activity",
  description: "Add a specific burger restaurant as an activity to a stop",
  input_schema: {
    type: "object",
    properties: {
      stopIndex: { type: "number" },
      restaurantName: { type: "string" },
      specialty: { type: "string", description: "Burger specialty (e.g., 'Smash burger with truffle fries')" },
      address: { type: "string" },
      pricePerPerson: { type: "number" },
      recommendedTime: { type: "string", description: "e.g., 'Lunch 13:00' or 'Dinner 19:00'" }
    },
    required: ["stopIndex", "restaurantName", "specialty", "pricePerPerson"]
  }
}
```

**B. Reducer Action (`src/hooks/useTrip.ts`)**
```typescript
case 'ADD_BURGER_ACTIVITY':
  // Add to stop.activities with type='burger'
  const stop = draft.stops[action.stopIndex];
  stop.activities.push({
    name: action.restaurantName,
    type: 'burger',
    specialty: action.specialty,
    address: action.address,
    cost: action.pricePerPerson * trip.groupSize,
    time: action.recommendedTime
  });
```

**C. UI - Burger Activity Card (`src/components/BurgerActivityCard.tsx` - NEW)**
```tsx
export function BurgerActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🍔</span>
        <div>
          <h4 className="font-semibold">{activity.name}</h4>
          <p className="text-sm italic text-gray-700">"{activity.specialty}"</p>
          {activity.address && <p className="text-xs text-gray-500">{activity.address}</p>}
          <p className="text-sm font-medium">€{activity.cost} total</p>
          {activity.time && <p className="text-xs text-gray-600">{activity.time}</p>}
        </div>
      </div>
    </div>
  );
}
```

**Files to modify:**
- `src/lib/tools.ts` (new tool)
- `src/lib/process-tool-calls.ts` (handle new tool)
- `src/hooks/useTrip.ts` (new action)
- `src/components/BurgerActivityCard.tsx` (NEW)
- `src/components/PlanView.tsx` (render burger cards)

**Estimated work:** 3 hours

---

## 3. Burger Route Challenge (Gamification)

### Koncept
Special mode: "Europe's Ultimate Burger Tour". Väljer städer baserat på legendariska burger-ställen. Gamification med achievements.

### Implementation

**A. New Trip Mode (`src/lib/types.ts`)**
```typescript
export type TripMode = 'standard' | 'burger_challenge'; // NEW

export interface TripState {
  mode: TripMode; // NEW
  // ...existing
  burgerScore?: number; // NEW
  burgersCollected?: BurgerAchievement[]; // NEW
}

export interface BurgerAchievement {
  city: string;
  restaurantName: string;
  specialty: string;
  rarity: 'common' | 'rare' | 'legendary';
  collected: boolean;
}
```

**B. Mode Selector (`src/components/ModeSelector.tsx` - NEW)**
```tsx
// Modal/banner på startsidan
<div className="grid grid-cols-2 gap-4">
  <button onClick={() => setMode('standard')}>
    🗺️ Standard Trip Planner
  </button>
  <button onClick={() => setMode('burger_challenge')}>
    🍔 Burger Route Challenge
  </button>
</div>
```

**C. System Prompt Variation (`src/lib/system-prompt.ts`)**
```typescript
export function getSystemPrompt(mode: TripMode, locale: string) {
  if (mode === 'burger_challenge') {
    return `You are planning Europe's Ultimate Burger Tour...
    
    Your goal: Create a route that visits 8-12 legendary burger restaurants across Europe.
    
    Suggest cities famous for their burger scene (Copenhagen, Berlin, London, Paris, Amsterdam, etc.)
    
    Each stop should feature:
    - 1 "legendary" burger spot (iconic, must-visit)
    - 1-2 "rare" spots (hidden gems, local favorites)
    
    Rate each burger experience with rarity: legendary/rare/common
    
    Track progress: "You've collected 3/10 legendary burgers!"
    `;
  }
  // standard mode...
}
```

**D. Progress Tracker (`src/components/BurgerProgress.tsx` - NEW)**
```tsx
// Visa i header eller sidebar
export function BurgerProgress({ achievements }: { achievements: BurgerAchievement[] }) {
  const legendary = achievements.filter(a => a.rarity === 'legendary' && a.collected).length;
  const rare = achievements.filter(a => a.rarity === 'rare' && a.collected).length;
  
  return (
    <div className="bg-amber-100 p-4 rounded">
      <h3 className="font-bold">🏆 Burger Hunter Progress</h3>
      <div className="flex gap-4 mt-2">
        <div>⭐ Legendary: {legendary}/10</div>
        <div>💎 Rare: {rare}/15</div>
      </div>
    </div>
  );
}
```

**E. Achievement Popups**
- När användaren "samlar" en burger (besöker staden i planen)
- Toast notification: "🎉 Legendary Burger Unlocked: Tommi's Burger Joint!"

**Files to modify:**
- `src/lib/types.ts` (new mode, achievements)
- `src/lib/system-prompt.ts` (mode-specific prompts)
- `src/components/ModeSelector.tsx` (NEW)
- `src/components/BurgerProgress.tsx` (NEW)
- `src/components/ChatPanel.tsx` (show progress)
- `src/hooks/useTrip.ts` (track achievements)

**Estimated work:** 5-6 hours

---

## 4. Food Data Integration (Google Places API)

### Koncept
Hämta live burger-data från Google Places API. Visa på kartan med markers. Filter för rating >4.5.

### Implementation

**A. Backend API Route: `/api/places/route.ts` (NEW)**
```typescript
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('query') || 'burger restaurant';
  
  const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  // Google Places Nearby Search
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&keyword=${query}&key=${GOOGLE_PLACES_KEY}`
  );
  
  const data = await response.json();
  
  // Filter: rating >= 4.5
  const filtered = data.results.filter(place => place.rating >= 4.5);
  
  return Response.json({
    places: filtered.map(p => ({
      name: p.name,
      address: p.vicinity,
      rating: p.rating,
      priceLevel: p.price_level,
      location: p.geometry.location,
      placeId: p.place_id
    }))
  });
}
```

**B. Hook: `useBurgerPlaces.ts` (NEW)**
```typescript
export function useBurgerPlaces(stops: Stop[]) {
  const [burgerPlaces, setBurgerPlaces] = useState<BurgerPlace[]>([]);
  
  useEffect(() => {
    async function fetchPlaces() {
      const allPlaces = [];
      for (const stop of stops) {
        const res = await fetch(`/api/places?lat=${stop.lat}&lng=${stop.lng}&query=burger`);
        const data = await res.json();
        allPlaces.push(...data.places);
      }
      setBurgerPlaces(allPlaces);
    }
    
    if (stops.length > 0) {
      fetchPlaces();
    }
  }, [stops]);
  
  return burgerPlaces;
}
```

**C. Map Integration (`src/components/MapView.tsx`)**
```typescript
// Lägg till burger markers
const burgerPlaces = useBurgerPlaces(trip.stops);

useEffect(() => {
  if (!map || !burgerPlaces.length) return;
  
  burgerPlaces.forEach((place, i) => {
    // Add burger icon marker
    const el = document.createElement('div');
    el.className = 'burger-marker';
    el.innerHTML = '🍔';
    el.style.cursor = 'pointer';
    
    const marker = new mapboxgl.Marker(el)
      .setLngLat([place.location.lng, place.location.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <strong>${place.name}</strong><br>
        ⭐ ${place.rating}/5<br>
        ${place.address}
      `))
      .addTo(map);
  });
}, [map, burgerPlaces]);
```

**D. UI Filter Toggle (`src/components/MapView.tsx`)**
```tsx
// Toggle button i map header
<button onClick={() => setShowBurgers(!showBurgers)}>
  {showBurgers ? '🍔 Hide Burgers' : '🍔 Show Burger Spots'}
</button>
```

**E. Integrera med Activities**
```typescript
// När användaren klickar på en burger marker:
// → Suggest to Claude: "Add [Restaurant Name] to stop [City]?"
// → Claude uses add_burger_activity tool
```

**Files to create:**
- `src/app/api/places/route.ts` (NEW)
- `src/hooks/useBurgerPlaces.ts` (NEW)

**Files to modify:**
- `src/components/MapView.tsx`
- `.env.local` (add GOOGLE_PLACES_API_KEY)

**Dependencies:**
- Google Places API key (gratis tier: 28,500 requests/månad)

**Estimated work:** 4-5 hours

---

## 5. Schweizisk Ostfondue Bonus 🧀

### Koncept
Samma som burger-features men för fondue när man är i Schweiz.

### Quick Implementation
- Extend `Activity.type` med `'fondue'`
- I system prompt: "If route passes through Switzerland, suggest fondue restaurants"
- Samma Places API integration men query="fondue restaurant switzerland"
- Special fondue card UI (🧀 icon istället för 🍔)

**Estimated work:** 1-2 hours (återanvänder burger-infrastruktur)

---

## TOTAL ESTIMATED WORK

- **AI-Key Support:** 3-4 hours ⚠️ KRITISKT
- **Burger Hunter Mode:** 2 hours
- **Burger Activities:** 3 hours
- **Burger Challenge:** 5-6 hours
- **Places API Integration:** 4-5 hours
- **Fondue Bonus:** 1-2 hours

**TOTALT: ~18-22 timmar**

---

## IMPLEMENTATION ORDER (Rekommenderad)

1. **AI-Key Support** (först - krävs för deployment)
2. **Burger Hunter Mode** (enklast, quick win)
3. **Burger Activities** (bygger på Mode)
4. **Places API Integration** (live data)
5. **Burger Challenge** (gamification, mest komplex)
6. **Fondue Bonus** (sist, nice-to-have)

---

## DEPLOYMENT STRATEGI

**Platform:** Vercel (recommended för Next.js)

**Environment Variables:**
```env
ANTHROPIC_API_KEY=sk-ant-xxx (optional - fallback for demo mode)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
GOOGLE_PLACES_API_KEY=AIzaxxx
```

**Deploy Command:**
```bash
vercel --prod
```

**Custom Domain:** 
- `eurotrip.bobby.com` eller liknande

**Sharing med Bobby:**
1. Deploy to Vercel
2. Skicka URL + instruktioner för API key
3. Alternativt: Sätt upp en shared API key med usage limits

---

## NÄSTA STEG

Vill du att jag:
1. Börjar implementera i ordning (AI-Key först)?
2. Skapar alla filer i ett PR?
3. Kör igenom en feature i taget för review?

Säg till! 🚀

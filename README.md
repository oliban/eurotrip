# Eurotrip Planner

A conversational European road trip planner powered by Claude AI and Mapbox.

Chat with Claude to plan your driving trip across Europe. Describe where you want to go, and the AI builds your itinerary step by step — asking smart questions, suggesting stops with activities and hotels, and visualizing everything on an interactive map in real-time.

## Features

- **Smart conversational flow** - Claude asks one question at a time with clickable suggestion chips, gathering your starting point, destination, dates, group size, vibe, and budget before plotting
- **Interactive Mapbox map** - Real driving routes via Mapbox Directions API with numbered stop markers and popups
- **Ferry/water crossing detection** - Dashed lines for ferry segments, auto-detected from Mapbox steps or distance-ratio heuristics
- **Day-by-day itinerary** - Plan view with stop cards, travel segment cards (driving time + distance), activities, and accommodation details
- **Hotel suggestions** - 3-5 specific accommodation options per stop with names, types, and nightly costs
- **Itemized cost breakdown** - Per-night and total accommodation costs, activity costs, all as group totals
- **PDF export** - Map snapshot + full itinerary as a printable PDF via react-to-print
- **i18n** - Swedish and English with a locale/currency picker (SEK/EUR)
- **Geolocation** - Auto-detects your city via browser geolocation + Mapbox reverse geocoding for smart starting point suggestions
- **Iterative refinement** - "Skip Nice, add Florence instead" and watch the map update instantly
- **Mobile-friendly** - Responsive layout with bottom navigation (Chat | Map | Plan)
- **Persistent** - Trip state and chat history save to localStorage, hydration-safe

## Tech Stack

- Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- Anthropic Claude API (SSE streaming with tool_use continuation loop)
- Mapbox GL JS + Directions API + Geocoding API
- React Context + useReducer for state management
- react-to-print for PDF export

## Architecture

```
src/
  app/
    api/chat/route.ts    # SSE streaming proxy to Anthropic API
    page.tsx             # Main layout with responsive chat/map/plan views
  components/
    ChatPanel.tsx        # Chat UI with locale picker and reset
    ChatInput.tsx        # Message input (stays enabled during streaming)
    ChatMessage.tsx      # Message bubbles with suggestion chips and tool badges
    MapView.tsx          # Mapbox GL map (dynamic import, no SSR)
    PlanView.tsx         # Day-by-day itinerary with travel/stop cards
    MobileNav.tsx        # Bottom navigation for mobile
    ViewTabs.tsx         # Desktop tab switcher (Map/Plan)
    TripPrintLayout.tsx  # PDF export layout
  hooks/
    useChat.ts           # Stream parser, tool call accumulation, continuation loop
    useTrip.ts           # Trip state reducer
    useRoute.ts          # Auto-fetches Mapbox routes with caching and ferry fallback
    useLocale.ts         # i18n with localStorage persistence
    useUserLocation.ts   # Browser geolocation + reverse geocoding
  lib/
    system-prompt.ts     # Claude system prompt with question flow
    tools.ts             # Claude tool definitions (set_route, add_stop, etc.)
    process-tool-calls.ts # Maps tool calls to TripAction dispatches
    types.ts             # TypeScript types and interfaces
    i18n.ts              # Translation strings (en/sv)
    mapbox.ts            # Mapbox Directions API with ferry detection
  store/
    trip-context.tsx     # React Context provider for trip state
```

## Getting Started

### Prerequisites

- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/)
- [Mapbox access token](https://account.mapbox.com/)

### Setup

```bash
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start planning your trip.

## Usage

1. Start a conversation — Claude asks about your starting point, destination, dates, group, vibe, and budget
2. Click suggestion chips or type your own answers
3. Once Claude has enough info, it plots the full route on the map with stops, activities, and hotels
4. Refine: "Add 2 nights in Florence", "Skip Marseille", "Change the hotel in Rome"
5. Switch to Plan tab for the day-by-day itinerary with cost breakdown
6. Toggle language/currency with the flag icon in the chat header
7. Export as PDF when you're happy with the plan

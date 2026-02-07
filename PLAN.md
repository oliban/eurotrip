# European Road Trip Planner

## Context
Build a conversational road trip planner where the user chats with Claude to plan a European driving trip. Claude suggests routes, stops, activities, accommodations, and budgets. The map updates in real-time as Claude makes suggestions, and the user can iteratively refine ("skip Nice, add Florence"). Includes a day-by-day plan view and PDF export of map + itinerary combined.

## Tech Stack
- **Next.js 14+** (App Router, TypeScript, Tailwind CSS)
- **Anthropic API** with streaming + tool_use (Claude Sonnet 4)
- **Mapbox GL JS** + Mapbox Directions API for real driving routes
- **React Context + useReducer** for state, **localStorage** for persistence
- **react-to-print** for PDF export

## Architecture

### Layout - Responsive
**Desktop** (>=768px): Chat panel (left, 420px) + Right panel (flex-1) with **Map | Plan tabs**
**Mobile** (<768px): Full-screen with bottom nav tabs: **Chat | Map | Plan**. Each tab takes full screen. Chat has a floating "show map" mini-preview button.

- **Map tab**: Mapbox GL map with driving routes, numbered markers, popups
- **Plan tab**: Day-by-day itinerary view - a printable travel document showing each day's drive, activities, accommodation, and budget. "Export PDF" button at top. Derived from stops + nights.

### Data Flow
User message -> `/api/chat` -> Anthropic streaming -> client parses `tool_use` blocks -> dispatches to trip reducer -> map re-renders markers + routes -> `tool_result` sent back -> Claude returns text summary.

### Claude Tools (6 total)
| Tool | Purpose |
|------|---------|
| `set_route` | Replace entire itinerary (initial trip creation) |
| `add_stop` | Add a stop at a specific position |
| `remove_stop` | Remove a stop by name |
| `update_stop` | Modify nights, activities, accommodation for a stop |
| `reorder_stops` | Change stop order |
| `update_trip` | Update trip metadata (name, dates, budget, travelers) |

Each tool returns rich data: coordinates, activities with costs, accommodation suggestions, daily budget estimates.

## Implementation Plan

### Phase 1: Project Setup + Core Types
1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir` (in eurotrip dir)
2. `npm install @anthropic-ai/sdk mapbox-gl react-to-print && npm install -D @types/mapbox-gl`
3. Create `.env.local` with `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN`
4. Create `src/lib/types.ts` - Trip, Stop, RouteSegment, Activity, Accommodation, ChatMessage, TripAction types
5. Create `src/lib/tools.ts` - 6 tool definitions with JSON schemas
6. Create `src/lib/system-prompt.ts` - Claude's role as European trip planner, instructions to always use tools

### Phase 2: API + State Management
7. Create `src/app/api/chat/route.ts` - POST handler that streams Anthropic response as SSE, injects current trip state into system prompt
8. Create `src/hooks/useTrip.ts` - useReducer with handlers for SET_ROUTE, ADD_STOP, REMOVE_STOP, UPDATE_STOP, REORDER_STOPS, UPDATE_TRIP, SET_ROUTE_SEGMENT
9. Create `src/store/trip-context.tsx` - React Context provider, loads from localStorage on mount, persists on every state change
10. Create `src/lib/process-tool-calls.ts` - Maps Claude tool names to TripAction dispatches

### Phase 3: Chat UI + Streaming
11. Create `src/components/ChatInput.tsx` - Text input + send button, mobile-friendly touch targets
12. Create `src/components/ChatMessage.tsx` - User/assistant bubbles, tool call badges
13. Create `src/components/ChatPanel.tsx` - Message list + input, scrolls to bottom
14. Create `src/hooks/useChat.ts` - Core streaming logic:
    - SSE stream parsing (text_delta for display, input_json_delta for tool accumulation)
    - On `content_block_stop` for tool_use: parse JSON, call processToolCall, dispatch to reducer
    - On `stop_reason: tool_use`: send tool_result continuation, loop until `end_turn`

### Phase 4: Map Integration
15. Create `src/lib/mapbox.ts` - `fetchRouteSegment()` and `fetchAllRouteSegments()` using Mapbox Directions API
16. Create `src/components/MapView.tsx` - Mapbox GL map (dynamic import, ssr: false), renders numbered markers with popups, renders route lines as GeoJSON layers, fits bounds on stop changes
17. Create `src/hooks/useRoute.ts` - Watches for stops changes, fetches driving routes when route_segments is empty

### Phase 5: Layout + Navigation
18. Create `src/components/ViewTabs.tsx` - Desktop: Map | Plan tabs at top of right panel. Mobile: bottom nav with Chat | Map | Plan tabs
19. Create `src/components/MobileNav.tsx` - Bottom tab bar for mobile (fixed bottom, safe-area-inset padding for notch devices)
20. Wire up `src/app/page.tsx` - TripProvider wrapping responsive layout:
    - Desktop: `flex` with ChatPanel + tabbed right panel
    - Mobile: full-screen panels switched via MobileNav state

### Phase 6: Plan View + PDF Export
21. Create `src/components/PlanView.tsx` - Day-by-day itinerary:
    - Compute day numbers from start_date + cumulative nights
    - For each stop: arrival day, departure day, driving time from previous stop
    - Activities grouped by day, accommodation details, daily budget
    - Driving days between stops ("Day 4: Drive Barcelona -> Marseille, 4.5hrs")
    - Trip summary header: total days, total distance, total budget
    - Clean typography, mobile-scrollable
22. Create `src/components/TripPrintLayout.tsx` - Combined print layout:
    - Map snapshot at top (captured via `map.getCanvas().toDataURL()`)
    - Full day-by-day itinerary below
    - Trip summary header with dates, travelers, total budget
23. Create `src/lib/pdf-export.ts` - "Export PDF" button uses react-to-print on TripPrintLayout
24. Print CSS: full-width itinerary, page breaks between stops, hide UI chrome

### Phase 7: Polish + Responsive
25. Create `src/components/StopCard.tsx` - Expandable stop detail cards
26. Style: numbered marker badges, route line styling (blue, 4px, 0.8 opacity)
27. Mobile polish: touch-friendly markers, swipe gestures, proper viewport handling
28. Loading states, error handling, empty states with onboarding prompt
29. Tailwind responsive breakpoints throughout all components

## Key Files
- `src/app/api/chat/route.ts` - Server endpoint proxying to Anthropic
- `src/hooks/useChat.ts` - Most complex logic: stream parsing + tool continuation loop
- `src/lib/types.ts` - All TypeScript interfaces (everything depends on this)
- `src/components/MapView.tsx` - Mapbox GL integration with reactive markers/routes
- `src/lib/process-tool-calls.ts` - Bridge between Claude tools and trip state
- `src/components/PlanView.tsx` - Day-by-day itinerary derived from trip state
- `src/components/TripPrintLayout.tsx` - Combined map snapshot + itinerary for PDF
- `src/app/page.tsx` - Responsive layout orchestration (desktop vs mobile)

## Technical Notes
- MapView must use `next/dynamic` with `ssr: false` (mapbox-gl needs `window`)
- Tool input JSON from streaming: accumulate as raw strings, parse only on `content_block_stop`
- When `stop_reason` is `tool_use`, client must loop: send tool_result -> get next response -> repeat until `end_turn`
- Mapbox Directions API: `https://api.mapbox.com/directions/v5/mapbox/driving/{coords}?geometries=geojson&overview=full`
- Cache route segments by stop pair to avoid refetching unchanged segments
- Mobile: use `dvh` (dynamic viewport height) instead of `vh` to handle mobile browser chrome
- Map canvas export: call `map.getCanvas().toDataURL()` - requires `preserveDrawingBuffer: true` on map init

## Workflow: TDD + Chrome Extension Testing
- **Test-driven development**: Write acceptance criteria first, then implement
- After each phase, launch **test-game agent** via Chrome extension to verify features at localhost:3000
- Test agent checks: UI renders, chat works, map updates, tabs switch, mobile responsive, PDF exports
- Team lead (main agent) handles implementation; test agents validate via browser automation

## Prerequisites
- Anthropic API key (for Claude)
- Mapbox access token (free tier: 100k direction requests/month)

## Verification (Chrome Extension Tests)
After each phase, test agent verifies via browser at localhost:3000:

1. **Phase 3 done**: Open app -> type message -> see streaming response from Claude
2. **Phase 4 done**: Type "Plan a trip from Barcelona to Rome" -> see markers + driving routes on map
3. **Phase 5 done**: Desktop: see split-screen layout. Resize to mobile width: see bottom nav with Chat/Map/Plan tabs
4. **Phase 6 done**: Switch to Plan tab -> see day-by-day itinerary. Click Export PDF -> get combined map + plan document
5. **Refinement**: Type "Skip Nice, add Florence" -> map updates, plan view updates, driving routes recalculate
6. **Persistence**: Refresh browser -> trip still loaded from localStorage
7. **Mobile**: At 375px width, all three views (Chat, Map, Plan) are usable with touch-friendly controls

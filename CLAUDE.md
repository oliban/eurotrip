# Eurotrip Planner - Project Instructions

## Project Overview
European road trip planner: chat with Claude AI to plan driving trips, visualized on an interactive Mapbox map with a day-by-day itinerary view and PDF export.

## Tech Stack
- Next.js 14+ with App Router, TypeScript, Tailwind CSS
- Anthropic Claude API (streaming + tool_use)
- Mapbox GL JS + Mapbox Directions API
- React Context + useReducer for state, localStorage for persistence
- react-to-print for PDF export

## Architecture
- `src/app/api/chat/route.ts` - SSE streaming proxy to Anthropic API
- `src/hooks/useChat.ts` - Client-side stream parser, tool call accumulation, tool_result continuation loop
- `src/hooks/useTrip.ts` - Trip state reducer (stops, routes, metadata)
- `src/lib/process-tool-calls.ts` - Maps Claude tool calls to TripAction dispatches
- `src/components/MapView.tsx` - Mapbox GL (dynamic import, no SSR)
- `src/components/PlanView.tsx` - Day-by-day itinerary
- `src/components/TripPrintLayout.tsx` - Map snapshot + itinerary for PDF

## Key Patterns
- Claude uses tool_use (not JSON in markdown) to update the map: set_route, add_stop, remove_stop, update_stop, reorder_stops, update_trip
- Tool calls are processed client-side, NOT server-side. The API route just streams through.
- When stop_reason is tool_use, the client sends tool_result back and loops until end_turn
- Tool input JSON from streaming must be accumulated as raw strings, parsed only on content_block_stop
- MapView uses next/dynamic with ssr: false (mapbox-gl needs window)
- Map canvas export requires preserveDrawingBuffer: true on map init

## Responsive Layout
- Desktop (>=768px): Side-by-side chat + map/plan with tabs
- Mobile (<768px): Full-screen views with bottom nav (Chat | Map | Plan)
- Use dvh instead of vh for mobile viewport handling

## Development Workflow
- TDD: Write acceptance criteria first, then implement
- Test via Chrome extension browser automation at localhost:3000
- Team lead handles implementation; test agents validate via browser

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Lint check

## Environment Variables
- `ANTHROPIC_API_KEY` - Claude API key (server-side only)
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token (client-side, public)

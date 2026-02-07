# Eurotrip Planner

A conversational European road trip planner powered by Claude AI and Mapbox.

Chat with Claude to plan your driving trip across Europe. Describe where you want to go, and the AI suggests routes, stops, activities, accommodations, and budget estimates - all visualized on an interactive map in real-time.

## Features

- **Conversational planning** - Chat naturally with Claude to build and refine your trip
- **Interactive map** - See your route with real driving directions via Mapbox
- **Day-by-day itinerary** - Switch to Plan view for a detailed travel document
- **PDF export** - Download your trip as a combined map + itinerary PDF
- **Iterative refinement** - "Skip Nice, add Florence instead" and watch the map update
- **Mobile-friendly** - Full responsive design with dedicated mobile navigation
- **Persistent** - Your trip saves to localStorage and survives page refreshes

## Tech Stack

- Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- Anthropic Claude API (streaming with tool use)
- Mapbox GL JS + Directions API
- react-to-print for PDF export

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

1. Type something like "Plan a 10-day road trip from Barcelona to Rome"
2. Claude suggests stops with activities, accommodation, and budget
3. The map shows your route with driving directions
4. Refine: "Add 2 nights in Florence" or "Skip Marseille"
5. Switch to Plan tab for the day-by-day itinerary
6. Export as PDF when you're happy with the plan

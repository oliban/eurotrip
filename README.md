# Eurotrip Planner

A conversational European road trip planner powered by Claude AI and Mapbox.

🚀 **Live at:** https://eurotrip.fly.dev

Chat with Claude to plan your driving trip across Europe. Describe where you want to go, and the AI builds your itinerary step by step — asking smart questions, suggesting stops with activities and hotels, and visualizing everything on an interactive map in real-time.

## 🍔 Burger Features

- **Burger Hunter Mode** - Get 2-3 burger recommendations per city
- **Burger Challenge Mode** - Gamified burger tour with achievements (Legendary/Rare/Common)
- **Beautiful Burger Cards** - Special UI for food activities
- **Swiss Fondue Support** - Cheese fondue recommendations for Swiss stops

## Features

- **Smart conversational flow** - Claude asks one question at a time with clickable suggestion chips
- **Interactive Mapbox map** - Real driving routes with numbered stop markers
- **Day-by-day itinerary** - Plan view with stop cards, activities, and accommodation
- **Hotel suggestions** - 3-5 specific accommodation options per stop
- **Cost breakdown** - Per-night and total accommodation costs, activity costs
- **PDF export** - Map snapshot + full itinerary as printable PDF
- **i18n** - Swedish and English with locale/currency picker
- **User API Keys** - Bring your own Anthropic API key (no backend cost!)
- **Mobile-friendly** - Responsive layout

## Getting Started

### For Users

1. Visit the deployed app
2. Get a free Anthropic API key from https://console.anthropic.com/
3. Paste it in the settings modal
4. Choose Standard or Burger Challenge mode
5. Start planning your trip!

### For Developers

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- Anthropic Claude API (SSE streaming)
- Mapbox GL JS + Directions API + Geocoding API
- React Context + useReducer for state management
- Fly.io deployment

## Deployment

Auto-deploys to Fly.io on push to `master` via GitHub Actions.

Required Fly.io secrets:
- `NEXT_PUBLIC_MAPBOX_TOKEN` (required)
- `ANTHROPIC_API_KEY` (optional - fallback for users without own key)
- `GOOGLE_PLACES_API_KEY` (optional - enables live burger spot discovery)

## License

MIT

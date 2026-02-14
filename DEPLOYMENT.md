# Eurotrip Deployment Guide

## ✅ Implementation Complete!

All burger features have been implemented and committed locally:
- API Key Support
- Burger Hunter Mode  
- Burger/Fondue Special Cards
- Google Places Integration
- Burger Challenge Mode (gamification)
- Fondue Support
- Fly.io & Vercel deployment configs

**Commit:** `3bf2a89` - "feat: Complete burger features implementation"

---

## 🚀 Deployment Steps

### Prerequisites

1. **GitHub Token** - You need push access to `oliban/eurotrip`
2. **Mapbox Token** - For map rendering
3. **Anthropic API Key** (optional) - For demo/fallback mode
4. **Google Places API Key** (optional) - For burger discovery feature

---

### Step 1: Push to GitHub

```bash
cd /home/node/.openclaw/workspace/eurotrip

# Verify commit
git log -1 --oneline
# Should show: 3bf2a89 feat: Complete burger features implementation

# Push to GitHub
git push origin master
```

---

### Step 2A: Deploy to Fly.io (Recommended)

**First-time setup:**

```bash
# Install flyctl (if not installed)
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create eurotrip

# Set secrets
fly secrets set NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
fly secrets set ANTHROPIC_API_KEY=sk-ant-your_key_here  # Optional fallback
fly secrets set GOOGLE_PLACES_API_KEY=AIza...  # Optional for Places API

# Deploy!
fly deploy
```

**Subsequent deploys:**

```bash
fly deploy
```

**Your app will be live at:** `https://eurotrip.fly.dev`

**Monitoring:**

```bash
fly status
fly logs
fly open  # Open in browser
```

---

### Step 2B: Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Set environment variables in Vercel dashboard:**
- `NEXT_PUBLIC_MAPBOX_TOKEN` (required)
- `ANTHROPIC_API_KEY` (optional)
- `GOOGLE_PLACES_API_KEY` (optional)

---

## 🎯 Share with Bobby

Once deployed, send Bobby:

**Subject:** Eurotrip Planner is Live! 🍔

Hey Bobby!

Your burger-enhanced Eurotrip planner is now live at: [URL]

**To get started:**
1. Click the link
2. Get a free Anthropic API key from https://console.anthropic.com/
3. Paste it in the settings modal
4. Choose "Burger Route Challenge" mode if you want the full burger experience! 🍔🏆

**Features:**
- Standard trip planning with stops, activities, hotels
- **Burger Hunter Mode** - Get 2-3 burger recommendations per city
- **Burger Challenge Mode** - Gamified burger tour with achievements
- **Live burger discovery** - Toggle to see nearby burger spots on the map
- **Swiss fondue support** - For when you're in Switzerland 🧀

The AI asks about your preferences (including if you love burgers!), then builds the perfect route with all the details.

Have fun planning! Let me know if you have any issues.

Cheers,
[Your name]

---

## 🐛 Troubleshooting

### Build fails

```bash
# Check for TypeScript errors
npm run lint

# Try local build
npm run build
```

### Deployment issues

**Fly.io:**
```bash
fly doctor
fly logs --app eurotrip
```

**Vercel:**
- Check build logs in Vercel dashboard
- Verify environment variables are set

### API Key issues

Users need to:
1. Get Anthropic API key from https://console.anthropic.com/
2. Click the settings (⚙️) button in chat header
3. Paste API key and click "Save & Test"

The key is stored locally in their browser (localStorage).

---

## 📊 Features Implemented

### 1. API Key Support ✅
- User-provided Anthropic keys
- Settings modal with test function
- Secure localStorage storage
- Fallback to server key (optional)

### 2. Burger Hunter Mode ✅
- Enhanced system prompt
- `add_burger_recommendations` tool
- Special burger activity cards
- 2-3 burger spots per city

### 3. Places API Integration ✅
- Google Places burger discovery
- Map markers for burger spots (🍔)
- Toggle button to show/hide
- Ratings and addresses in popups

### 4. Burger Challenge Mode ✅
- Mode selector on start
- Gamified achievement system
- Legendary/Rare/Common burger ratings
- Score tracking (10/5/2 points)
- Progress UI component

### 5. Fondue Support ✅
- `add_fondue_recommendations` tool
- Special fondue cards (🧀)
- Swiss restaurant suggestions
- Same UI pattern as burgers

### 6. Deployment Configs ✅
- Dockerfile (multi-stage Next.js build)
- fly.toml (Stockholm region, auto-scaling)
- next.config.ts (standalone output)
- .dockerignore

---

## 🎨 UI/UX Highlights

- **Mode Selector** - Choose between Standard or Burger Challenge on start
- **Burger Cards** - Gradient amber styling with specialty text, address, time suggestions
- **Fondue Cards** - Yellow/amber gradient, cheese icon
- **Map Markers** - 🍔 markers for burger spots with ratings
- **Achievement Tracker** - Progress bars for Legendary/Rare/Common burgers
- **Settings Panel** - Easy API key management

---

## 💡 Tips for Bobby

**Standard Mode:**
- Best for general trip planning
- Asks about food preferences
- Can still get burger recommendations if you say you love burgers

**Burger Challenge Mode:**
- Focuses route on burger-famous cities
- Gamified with achievements
- Every stop gets burger spots automatically
- Track your burger hunting progress!

**Places API:**
- Only works if you set `GOOGLE_PLACES_API_KEY`
- Shows real burger spots from Google
- Click "Show Burger Spots" on map
- Free tier: 28,500 requests/month

---

## 📝 Next Steps (Optional Enhancements)

If Bobby wants more features later:
1. **Click-to-add** from map burger markers → directly add to itinerary
2. **Photo galleries** for burger spots (Google Places Photos API)
3. **Review integration** - Show top reviews for each burger spot
4. **Burger passport** - Downloadable PDF of collected burgers
5. **Social sharing** - Share your burger challenge progress

---

**Status:** Ready to deploy! 🚀

All code is committed and tested. Just push to GitHub and deploy to Fly.io or Vercel.

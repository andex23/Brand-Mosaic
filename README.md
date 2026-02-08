<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Brand Mosaic

> "Create with intention."

A minimalist AI-powered creative platform that combines **brand identity generation** and **product photography** in one quiet, opinionated space. Built with React, TypeScript, Vite, Supabase, and Google Gemini.

---

## What It Does

Brand Mosaic has two core tools that work together or independently:

### 1. Brand Mosaic (Brand Identity)
A guided questionnaire that builds a complete brand kit through thoughtful questions and AI analysis.

- Brand essence, positioning, and archetype analysis
- Color palette recommendations with hex values
- Typography suggestions (primary + secondary fonts)
- Tone of voice guidelines
- AI logo generation (Gemini image output)
- PDF export and shareable brand kit links

### 2. Photo Studio (Product Photography)
An AI-powered product photography generator that creates studio, lifestyle, and editorial scenes from product images.

- Upload product images (multiple angles supported, up to 5)
- Paste a product page URL (auto-extracts product image + metadata)
- Brand Summary step: describe your business, audience, product purpose, and visual tone so the AI generates contextually appropriate scenes
- 3 scene types: **Studio** (clean white/grey), **Lifestyle** (contextual setting), **Editorial** (dramatic/directional)
- Mood text input with real-time interpretation engine
- Download individual scenes or all at once

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 |
| Backend | Supabase (Auth, Database, Edge Functions) |
| AI | Google Gemini (`@google/genai`) for brand kits, logos, and scene generation |
| AI Fallback | Replicate (SDXL img2img) for scene generation when Gemini fails |
| Payments | Paystack (Stripe integration planned) |
| Styling | Custom CSS, Courier Prime monospace, notebook paper aesthetic |
| Hosting | Vercel (recommended) |

---

## Project Structure

```
Brand-Mosaic/
├── App.tsx                          # Main app — view routing, auth, state
├── index.tsx                        # React entry point
├── index.html                       # HTML shell
├── types.ts                         # All TypeScript interfaces
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript config
│
├── components/
│   ├── HomePage.tsx                 # Landing page — path selection + auth
│   ├── Dashboard.tsx                # Project list + Photo Studio entry
│   ├── BrandHeader.tsx              # Shared header component
│   ├── BrandForm.tsx                # Brand questionnaire form
│   ├── BrandFormPage.tsx            # Brand form orchestrator
│   ├── BrandKit.tsx                 # Generated brand kit display
│   ├── BrandSummary.tsx             # Brand summary section
│   ├── BrandQuestionRow.tsx         # Individual question row
│   ├── LogoDisplay.tsx              # Logo display/download
│   ├── LogoGenerator.tsx            # Logo generation UI
│   ├── PaymentModal.tsx             # Credit purchase modal
│   ├── ErrorBoundary.tsx            # React error boundary
│   ├── ErrorMessage.tsx             # Inline error component
│   └── ErrorToast.tsx               # Toast notification
│
│   └── photo-studio/
│       ├── PhotoStudioPage.tsx      # Wizard orchestrator (5 steps)
│       ├── ProductInput.tsx         # Product upload + URL fetch
│       ├── BusinessContext.tsx       # Brand summary step
│       ├── SceneSelector.tsx        # Scene type selection
│       ├── MoodInput.tsx            # Mood text + interpretation
│       ├── SceneResults.tsx         # Generated scene display
│       └── InterpretationEngine.ts  # Mood text → structured modifiers
│
├── lib/
│   ├── supabase.ts                  # Supabase client + helpers
│   ├── sceneGeneration.ts           # Scene generation service (Gemini + Replicate)
│   ├── logoGeneration.ts            # Logo generation service
│   ├── projects.ts                  # Project CRUD operations
│   ├── payments.ts                  # Paystack payment integration
│   └── errors.ts                    # Error code registry
│
├── hooks/
│   ├── useUsage.ts                  # Credit tracking hook
│   └── useError.ts                  # Error handling hook
│
├── styles/
│   └── brand.css                    # All styles (notebook paper aesthetic)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Tables: users, projects, generations
│   │   ├── 002_rls_policies.sql     # Row Level Security policies
│   │   └── 003_functions.sql        # Database functions
│   └── functions/
│       └── scrape-product/          # Edge Function for URL scraping (Deno)
│           ├── index.ts
│           └── deno.json
│
└── firebase.ts                      # Firebase config (legacy, not primary)
```

---

## Application Flow

### Landing Page
```
[Brand Mosaic Card]  |  [Photo Studio Card]
         ↓                      ↓
    Auth / Local Mode     Auth / Local Mode
         ↓                      ↓
      Dashboard          Photo Studio Wizard
```

### Photo Studio Wizard
```
PRODUCT → CONTEXT → SCENES → MOOD → GENERATE → RESULTS
   │         │         │        │         │          │
Upload/URL  Brand    Studio/   Mood    Gemini/     Download
            Summary  Life/Ed   Text    Replicate   scenes
```

### View Routing (App.tsx)
The app uses state-based view switching (no React Router):
- `currentView`: `'home' | 'dashboard' | 'form' | 'kit' | 'photo-studio'`
- Auth state changes automatically route to the intended destination
- `intendedDestination` ref preserves routing intent through auth flow

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- A Google Gemini API key (get one at [ai.google.dev](https://ai.google.dev))

### Local Development (No Cloud)

1. **Clone and install:**
   ```bash
   git clone https://github.com/andex23/Brand-Mosaic.git
   cd Brand-Mosaic
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open** `http://localhost:5173`

4. **Choose a tool** (Brand Mosaic or Photo Studio) → click **"Continue Without Cloud Sync"** → enter your Gemini API key → start creating.

> In local mode, all data stays in your browser. No account needed.

### Cloud Mode (Supabase)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run migrations** in order:
   ```bash
   # In Supabase SQL editor, execute:
   # 001_initial_schema.sql
   # 002_rls_policies.sql
   # 003_functions.sql
   ```

3. **Create `.env`** (never commit this):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_PAYSTACK_PUBLIC_KEY=your_paystack_key  # optional
   VITE_REPLICATE_API_KEY=your_replicate_key    # optional, for scene fallback
   ```

4. **Deploy the scrape-product Edge Function** (optional, for URL product fetching):
   ```bash
   supabase functions deploy scrape-product
   ```

5. **Start:**
   ```bash
   npm run dev
   ```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_PAYSTACK_PUBLIC_KEY` (optional)
   - `VITE_REPLICATE_API_KEY` (optional)
4. Build command: `npm run build`
5. Output directory: `dist`

---

## Key Design Decisions

### Notebook Paper Aesthetic
Everything uses **Courier Prime** monospace font on a cream paper background with ruled lines every 28px. This extends to:
- CSS variables: `--bg: #f7f4ee`, `--ink: #222`, `--line: #e6e2d8`
- All heights are multiples of 28px
- Dashed borders for interactive cards, solid on select/hover
- Buttons: 56px height, black border, hover inverts colors
- Custom pencil cursor across the entire app

### No Router
State-based view switching via `currentView` in App.tsx. Simpler than React Router for a single-page creative tool.

### Dual Mode
Every feature works in both **cloud mode** (Supabase auth, credits, project persistence) and **local mode** (Gemini API key from localStorage, no account needed).

### Scene Generation
- **Primary**: Gemini 2.0 Flash with image input + image output
- **Fallback**: Replicate SDXL img2img (prompt_strength: 0.65)
- Business context and mood interpretation are injected into the prompt
- Multi-scene consistency prefix when generating 2+ scenes
- Additional product angles are sent as extra image inputs to Gemini

### Product URL Fetch — Deep DOM Crawler
Smart multi-strategy approach with image scoring and candidate picker:

1. **Supabase Edge Function** (if deployed — fastest, no CORS issues)
2. **Deep DOM Crawler** via CORS proxy chain (allorigins, corsproxy.io, codetabs):
   - Fetches full HTML through CORS proxies
   - Parses JSON-LD `Product` structured data (highest priority, score 100)
   - Extracts OG/meta tags (`og:image`, `twitter:image`, `product:image`)
   - Scans ALL `<img>` elements with deep scoring:
     - URL patterns (product, catalog, gallery, zoom, CDN providers)
     - DOM context: class/ID names of image + 5 ancestor levels (product gallery, carousel, pdp, hero, main-image, etc.)
     - `data-src`, `data-zoom-image`, `srcset` attributes for lazy-loaded/high-res variants
     - `<picture><source>` elements for responsive images
     - `itemprop="image"` schema.org signals
   - **Junk image filter**: excludes logos, favicons, icons, tracking pixels, social media icons, badges, SVGs, rating stars, payment icons
   - **Real dimension probing**: loads top 12 candidates in parallel, measures actual pixel dimensions, boosts large images (600px+), penalizes tiny ones (<150px)
   - **Deduplication**: normalizes CDN URLs (strips size/quality params) to avoid showing the same image at different sizes
3. **Candidate Image Picker**: if multiple good images are found, shows a grid of up to 6 candidates and lets the user pick the right one. Auto-selects if one image is clearly the best (score 80+ with 20+ point lead).
4. **Microlink.io API** (fallback for sites that block all CORS proxies)
5. **Manual image URL input** (always available as last resort)

Image loading uses CORS proxy fallback: if direct `crossOrigin` loading fails, automatically retries through `corsproxy.io`.

### Mood Interpretation Engine
Pure TypeScript logic (`InterpretationEngine.ts`) that processes free-text mood input into structured modifiers:
- **Sanitization**: strips hype words, URLs, special chars
- **Classification**: keyword dictionaries map to temperature (warm/neutral/cool), energy (calm/moderate/vibrant), material bias, and light quality
- **Scene rule overrides**: Studio forces neutral/calm, Editorial defaults to directional light
- **Override notes**: explains to the user when scene rules conflict with their mood input

---

## Monetization

| Tier | What You Get |
|------|-------------|
| Free Trial | 1 brand kit generation (limited) |
| Pay-Per-Use | $5 for 2 full generations via Paystack |
| Local Mode | Unlimited — bring your own Gemini API key |

Photo Studio requires paid credits in cloud mode. Free in local mode.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | For cloud mode | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For cloud mode | Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | For cloud mode | Server-side Gemini key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Optional | Paystack payments |
| `VITE_REPLICATE_API_KEY` | Optional | Scene generation fallback |

In **local mode**, the user provides their own Gemini API key through the UI. No env vars needed.

---

## Database Schema (Supabase)

### Tables
- **profiles** — user metadata, subscription tier
- **projects** — saved brand projects (brand kits, form data)
- **generations** — usage tracking (brand_kit, logo, scene)
- **credits** — credit balance and purchase history

### Row Level Security
All tables have RLS enabled. Users can only read/write their own data.

---

## Error Handling

Centralized error system in `lib/errors.ts` with codes like:
- `api/key-not-found`, `api/gemini-error`
- `scene/generation-failed`, `scene/scrape-failed`, `scene/invalid-url`
- `scene/image-too-large`, `scene/no-scenes-selected`
- `payment/insufficient-credits`

All errors surface through `showError()` toast notifications.

---

## Testing Checklist

- [ ] Landing page: both tool cards render, navigate to auth
- [ ] Local mode: enter Gemini key, access dashboard
- [ ] Cloud mode: sign up, sign in, project persistence
- [ ] Brand Mosaic: complete questionnaire, generate kit, view/export
- [ ] Logo generation: generate from brand kit, download
- [ ] Photo Studio: upload product image, confirm
- [ ] Photo Studio: multi-angle upload (up to 5 images)
- [ ] Photo Studio: URL fetch (test with a real product page — should show candidate image picker)
- [ ] Photo Studio: candidate image picker (select image from grid, or fallback to manual URL)
- [ ] Photo Studio: Brand Summary step (fill in, skip, back navigation)
- [ ] Photo Studio: scene selection (1-3 scenes)
- [ ] Photo Studio: mood input with interpretation feedback
- [ ] Photo Studio: generate scenes, download individually/all
- [ ] Photo Studio: start over, back navigation at every step
- [ ] Mobile responsive layout
- [ ] Pencil cursor renders on all elements

### Paystack Test Cards
- Success: `4084084084084081`
- Decline: `4084080000000408`

---

## Known Limitations

- **URL product fetch**: CORS proxies may be blocked by some sites. The deep DOM crawler + candidate picker handles most cases, but highly protected sites (e.g., Amazon) may require the manual image URL fallback. JS-rendered SPAs won't have product images in the initial HTML response.
- **Scene generation quality**: Depends on Gemini's image generation capabilities. Replicate SDXL fallback produces different style results.
- **No React Router**: Browser back button doesn't navigate between views (state-based routing).
- **scrape-product Edge Function**: Not auto-deployed. Requires manual `supabase functions deploy`. Client-side fallback works without it.
- **Bundle size**: ~720KB (minified). Could be reduced with code splitting.

---

## Roadmap

- [ ] Deploy scrape-product Edge Function automatically
- [ ] Stripe payment integration
- [ ] Brand kit → Photo Studio handoff (auto-fill brand context from generated kit)
- [ ] Scene history / gallery per project
- [ ] Real-time collaborative editing
- [ ] Mobile app (React Native)
- [ ] Advanced scene controls (camera angle, time of day)
- [ ] Batch generation queue

---

## License

MIT License

---

Built with Courier Prime, notebook paper, and AI.

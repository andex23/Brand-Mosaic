# Brand Mosaic - Local Development Setup

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Brand-Mosaic
npm install
```

### 2. Set Up Supabase (Local Development)

#### Option A: Use Supabase Cloud (Recommended for Testing)

1. Create a free project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Skip to step 3 below

#### Option B: Run Supabase Locally

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start
```

### 3. Configure Environment

Create `.env.local`:

```env
# Supabase (get from dashboard or local setup)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Paystack (use test keys for development)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Local development URL
VITE_APP_URL=http://localhost:5173
```

### 4. Run Database Migrations

**For Supabase Cloud:**
1. Go to SQL Editor in Supabase Dashboard
2. Run each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions.sql`

**For Local Supabase:**
```bash
supabase db reset
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Development Workflow

### Testing Without Database

The app gracefully handles missing Supabase configuration:
- Local mode will work without cloud features
- Authentication will be disabled but app remains functional

### Testing Monetization Features

#### Free Trial Flow
1. Sign up with a new email
2. Create and generate your first brand kit (free)
3. Try to generate another - should prompt for payment

#### Payment Testing (Paystack Test Mode)
1. Use test public key: `pk_test_...`
2. Test card number: `4084084084084081`
3. CVV: `408`
4. Expiry: Any future date

#### Local Mode Testing
1. Click "Continue Without Cloud Sync"
2. Enter any Gemini API key starting with "AIza"
3. Generate unlimited brand kits (no limits in local mode)

### Database Schema Changes

1. Create a new migration file:
   ```bash
   supabase migration new your_migration_name
   ```

2. Add your SQL to the new file

3. Apply migrations:
   ```bash
   supabase db reset  # Local
   # OR manually run in Supabase Dashboard SQL Editor
   ```

### Edge Function Development

Test webhook locally:

```bash
# Start local functions
supabase functions serve paystack-webhook

# Test with curl
curl -X POST http://localhost:54321/functions/v1/paystack-webhook \
  -H "x-paystack-signature: test_signature" \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{"reference":"test_ref","metadata":{"custom_fields":[{"variable_name":"user_id","value":"test-user"},{"variable_name":"generations","value":"2"}]}}}'
```

## Project Structure

```
Brand-Mosaic/
├── components/          # React components
│   ├── BrandKit.tsx    # Main brand kit display
│   ├── Dashboard.tsx   # User dashboard
│   ├── HomePage.tsx    # Landing/auth page
│   ├── PaymentModal.tsx # Payment UI
│   └── ...
├── lib/                # Utilities and services
│   ├── supabase.ts     # Supabase client
│   ├── payments.ts     # Payment integration
│   ├── projects.ts     # Project CRUD
│   ├── errors.ts       # Error handling
│   └── logoGeneration.ts # Logo AI service
├── hooks/              # React hooks
│   ├── useUsage.ts     # Credit management
│   └── useError.ts     # Error state management
├── supabase/           # Supabase configuration
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions
├── App.tsx             # Main app component
└── types.ts            # TypeScript types
```

## Common Issues

### "Supabase not configured" Warning

This is normal if you haven't set up Supabase yet. The app will work in local mode.

### Payment Not Working Locally

Ensure:
1. You're using Paystack test keys
2. Webhook is not required for local testing (payment confirmation happens client-side)

### Logo Generation Fails

Currently using mock implementation. To use real AI:
1. Integrate Google Imagen API in `lib/logoGeneration.ts`
2. Add API credentials to environment

### Database Connection Errors

1. Check your Supabase URL and anon key
2. Verify RLS policies are set up correctly
3. Check browser console for specific errors

## Testing Strategy

### Unit Tests (Future Enhancement)
```bash
npm test
```

### Manual Testing Checklist

- [ ] Sign up flow
- [ ] Sign in flow
- [ ] Local mode with API key
- [ ] Create new brand project
- [ ] Save draft
- [ ] Generate brand kit (free trial)
- [ ] View credit balance
- [ ] Purchase credits (test mode)
- [ ] Generate paid brand kit
- [ ] Generate logo
- [ ] Download/export functionality
- [ ] Share brand kit link
- [ ] Error handling (network errors, invalid input)

## Code Style

The project uses:
- TypeScript for type safety
- Minimalist, typewriter-inspired UI
- Inline styles (no external CSS framework)
- Functional React components with hooks

### Naming Conventions

- Components: PascalCase (e.g., `BrandKit.tsx`)
- Functions: camelCase (e.g., `handleGenerate`)
- Constants: UPPER_SNAKE_CASE (e.g., `ERROR_MESSAGES`)
- Types/Interfaces: PascalCase (e.g., `BrandKitType`)

## Next Steps

1. Set up Supabase project
2. Configure environment variables
3. Run migrations
4. Test authentication
5. Test payment flow (test mode)
6. Deploy Edge function
7. Deploy frontend

See `DEPLOYMENT.md` for production deployment instructions.







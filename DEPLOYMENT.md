# Brand Mosaic - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
2. **Paystack Account** - Sign up at [paystack.com](https://paystack.com)
3. **Google Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Node.js** (v18+) and npm installed

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Note your:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for webhooks)

### 1.2 Run Database Migrations

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

   Or manually run the SQL files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions.sql`

### 1.3 Configure Authentication

1. In Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set site URL to your production domain

## Step 2: Paystack Setup

### 2.1 Get API Keys

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy:
   - Public Key (for frontend)
   - Secret Key (for webhook)

### 2.2 Configure Webhook

1. In Paystack Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://your-project-ref.supabase.co/functions/v1/paystack-webhook`
3. Select events: `charge.success`
4. Save webhook

## Step 3: Deploy Supabase Edge Function

1. Navigate to the supabase functions directory:
   ```bash
   cd supabase/functions
   ```

2. Deploy the webhook function:
   ```bash
   supabase functions deploy paystack-webhook
   ```

3. Set environment secrets:
   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=your_paystack_secret_key
   supabase secrets set SUPABASE_URL=your_supabase_url
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 4: Configure Environment Variables

### 4.1 Create `.env.local` file

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Gemini API (for server-side generation)
GEMINI_API_KEY=your_gemini_api_key

# App URL (for webhooks and callbacks)
VITE_APP_URL=https://your-domain.com
```

### 4.2 Production Environment

For production deployment (Vercel, Netlify, etc.), add these environment variables in your hosting platform's dashboard.

## Step 5: Build and Deploy Frontend

### 5.1 Install Dependencies

```bash
npm install
```

### 5.2 Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` to test.

### 5.3 Build for Production

```bash
npm run build
```

### 5.4 Deploy Options

#### Option A: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Add environment variables in Vercel dashboard

#### Option B: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Add environment variables in Netlify dashboard

#### Option C: Manual Hosting

Upload the contents of the `dist` folder to your web server.

## Step 6: Testing

### 6.1 Test Authentication

1. Sign up with a new email
2. Verify email confirmation (if enabled)
3. Sign in and check dashboard

### 6.2 Test Free Trial

1. Create a new brand
2. Complete the questionnaire
3. Generate brand kit (should use free trial)
4. Verify limited features for free tier

### 6.3 Test Payment Flow

1. Click "Purchase Credits"
2. Complete Paystack test payment (use test card: 4084084084084081)
3. Verify credits added to account
4. Generate another brand kit
5. Check that credit was deducted

### 6.4 Test Logo Generation

1. With paid credits, generate a brand kit
2. Click "Generate Logo"
3. Verify logo is generated and saved
4. Test download functionality

### 6.5 Test Local Mode

1. Log out or use incognito mode
2. Click "Continue Without Cloud Sync"
3. Enter a valid Gemini API key
4. Generate brand kit in local mode
5. Verify no credit deduction

## Step 7: Production Checklist

- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Supabase auth configured
- [ ] Paystack webhook configured and verified
- [ ] Edge function deployed and secrets set
- [ ] Environment variables set in production
- [ ] Frontend built and deployed
- [ ] SSL certificate configured
- [ ] Custom domain configured (optional)
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Analytics configured (optional)

## Troubleshooting

### Webhook Not Working

1. Check Supabase function logs:
   ```bash
   supabase functions logs paystack-webhook
   ```

2. Verify webhook URL in Paystack dashboard
3. Test webhook with Paystack webhook debugger

### Database Connection Issues

1. Check RLS policies are correctly set
2. Verify anon key has correct permissions
3. Check network access in Supabase dashboard

### Payment Not Processing

1. Verify Paystack keys are correct (test vs live)
2. Check webhook is receiving events
3. Review payment logs in Paystack dashboard
4. Check Edge function logs for errors

### Credits Not Added

1. Check if webhook processed successfully
2. Verify `add_user_generations` function works
3. Check payment status in database:
   ```sql
   SELECT * FROM payments WHERE user_id = 'user_id';
   ```

## Support

For issues or questions:
- Check Supabase logs
- Review Paystack transaction history
- Check browser console for errors
- Review server logs

## Security Notes

1. Never commit `.env.local` to version control
2. Keep service role key secure (only use in server-side code)
3. Rotate API keys regularly
4. Enable 2FA on all service accounts
5. Monitor webhook requests for unusual activity
6. Set up rate limiting on API endpoints







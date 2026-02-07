# Migration Checklist: From Development to Production

## Phase 1: Supabase Setup (30 minutes)

### 1.1 Create Supabase Project
- [ ] Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Create new project (note: takes ~2 minutes to spin up)
- [ ] Copy and save:
  - [ ] Project URL
  - [ ] Anon/Public Key  
  - [ ] Service Role Key (keep secret!)

### 1.2 Run Database Migrations
- [ ] Go to SQL Editor in Supabase Dashboard
- [ ] Create new query
- [ ] Copy contents of `supabase/migrations/001_initial_schema.sql`
- [ ] Run query ✓
- [ ] Repeat for `002_rls_policies.sql` ✓
- [ ] Repeat for `003_functions.sql` ✓
- [ ] Verify tables created (check Database → Tables)

### 1.3 Configure Authentication
- [ ] Go to Authentication → Providers
- [ ] Enable Email provider
- [ ] Set Site URL to your domain (or localhost for testing)
- [ ] Optional: Configure email templates
- [ ] Optional: Enable email confirmations (recommended for production)

## Phase 2: Paystack Setup (15 minutes)

### 2.1 Get API Keys
- [ ] Log in to [Paystack Dashboard](https://dashboard.paystack.com)
- [ ] Go to Settings → API Keys & Webhooks
- [ ] Copy Public Key (starts with `pk_test_` or `pk_live_`)
- [ ] Copy Secret Key (starts with `sk_test_` or `sk_live_`)
- [ ] Keep these safe!

### 2.2 Test Mode First
- [ ] Use test keys for initial setup
- [ ] Test card: 4084084084084081
- [ ] Verify test payments work
- [ ] Switch to live keys only when ready for production

## Phase 3: Deploy Edge Function (20 minutes)

### 3.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 3.2 Link Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3.3 Deploy Function
```bash
supabase functions deploy paystack-webhook
```

### 3.4 Set Secrets
```bash
supabase secrets set PAYSTACK_SECRET_KEY=your_secret_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3.5 Configure Paystack Webhook
- [ ] In Paystack Dashboard → Settings → Webhooks
- [ ] Add webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook`
- [ ] Select event: `charge.success`
- [ ] Save webhook
- [ ] Copy webhook secret (if shown)

## Phase 4: Environment Variables (10 minutes)

### 4.1 Create Local .env.local
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
GEMINI_API_KEY=your_gemini_api_key
VITE_APP_URL=http://localhost:5173
```

### 4.2 Test Locally
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:5173
- [ ] Test sign up
- [ ] Test generation (free trial)
- [ ] Test payment (test mode)
- [ ] Verify credits added

## Phase 5: Deploy Frontend (30 minutes)

### 5.1 Choose Hosting Platform

#### Option A: Vercel (Recommended)
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Run: `vercel login`
- [ ] Run: `vercel` (follow prompts)
- [ ] Add environment variables in Vercel dashboard:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_PAYSTACK_PUBLIC_KEY
  - [ ] GEMINI_API_KEY
  - [ ] VITE_APP_URL (your Vercel URL)
- [ ] Run: `vercel --prod`

#### Option B: Netlify
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Run: `netlify login`
- [ ] Run: `netlify deploy --prod`
- [ ] Add environment variables in Netlify dashboard

#### Option C: Manual
- [ ] Run: `npm run build`
- [ ] Upload `dist` folder to your server
- [ ] Configure environment variables on server

### 5.2 Update URLs
- [ ] Update Supabase Site URL to production domain
- [ ] Update Paystack webhook URL if domain changed
- [ ] Update VITE_APP_URL in environment variables

## Phase 6: Production Testing (20 minutes)

### 6.1 Authentication Flow
- [ ] Sign up with new email
- [ ] Verify email (if enabled)
- [ ] Sign in
- [ ] Check dashboard loads
- [ ] Sign out and sign back in

### 6.2 Free Trial Flow
- [ ] Create new brand project
- [ ] Fill out questionnaire
- [ ] Generate brand kit (should use free trial)
- [ ] Verify limited features shown
- [ ] Verify credit balance shows 0 remaining

### 6.3 Payment Flow (Test Mode)
- [ ] Click "Purchase Credits"
- [ ] Complete payment with test card: 4084084084084081
- [ ] Wait for webhook processing (~5 seconds)
- [ ] Verify credits added to dashboard
- [ ] Generate another brand kit
- [ ] Verify credit deducted

### 6.4 Logo Generation
- [ ] With paid credits, generate brand kit
- [ ] Click "Generate Logo"
- [ ] Verify logo appears
- [ ] Download logo
- [ ] Verify credit deducted

### 6.5 Local Mode
- [ ] Log out
- [ ] Click "Continue Without Cloud Sync"
- [ ] Enter valid Gemini API key (starts with AIza)
- [ ] Generate brand kit
- [ ] Verify no credit tracking
- [ ] Verify unlimited generations

### 6.6 Error Handling
- [ ] Test with invalid email
- [ ] Test with wrong password
- [ ] Test with insufficient credits
- [ ] Test payment decline (card: 4084080000000408)
- [ ] Verify error messages display properly

## Phase 7: Go Live (Production) (15 minutes)

### 7.1 Switch to Live Keys
- [ ] Update Paystack keys to live (`pk_live_` and `sk_live_`)
- [ ] Update environment variables on hosting
- [ ] Redeploy if necessary
- [ ] Update Supabase secrets with live keys

### 7.2 Final Checks
- [ ] SSL certificate active (https://)
- [ ] Custom domain configured (optional)
- [ ] Analytics set up (optional)
- [ ] Error monitoring (Sentry, etc.) (optional)
- [ ] Backup strategy in place
- [ ] Monitoring set up for webhook

### 7.3 Monitor First Transactions
- [ ] Watch Supabase logs
- [ ] Watch Paystack dashboard
- [ ] Verify webhook processing
- [ ] Check credits are added correctly
- [ ] Monitor for errors

## Phase 8: Post-Launch (Ongoing)

### Daily (First Week)
- [ ] Check Supabase logs for errors
- [ ] Review Paystack transactions
- [ ] Monitor webhook success rate
- [ ] Check user signup rate
- [ ] Review any error reports

### Weekly
- [ ] Review usage patterns
- [ ] Check database performance
- [ ] Review payment success rate
- [ ] Analyze conversion rate (free → paid)
- [ ] Plan improvements based on data

### Monthly
- [ ] Review costs (Supabase, API, hosting)
- [ ] Update documentation
- [ ] Plan new features
- [ ] Security audit
- [ ] Database optimization

## Troubleshooting

### "Cannot connect to database"
1. Verify Supabase URL is correct
2. Check anon key is set
3. Verify project is not paused

### "Payment not processing"
1. Check Paystack keys (test vs live)
2. Verify webhook URL is correct
3. Check Edge function logs
4. Test webhook with Paystack debugger

### "Credits not added after payment"
1. Check webhook received event (Paystack dashboard)
2. Review Edge function logs
3. Manually check payments table
4. Verify database function works

### "Logo generation fails"
Currently using mock implementation. This is expected.
To fix: Integrate real image generation API

### "Local mode not working"
1. Verify API key format (should start with AIza)
2. Check key is stored in localStorage
3. Verify API key is valid with Google

## Rollback Plan

If something goes wrong:

### Database Issues
1. Keep backup of migrations
2. Can restore to earlier version
3. Export data regularly

### Payment Issues
1. Can refund via Paystack dashboard
2. Manually add credits via SQL if needed
3. Keep customer support contact info

### Frontend Issues
1. Previous deployment still available
2. Can revert via hosting platform
3. Keep previous build artifacts

## Success Criteria

You're ready for launch when:
- [ ] All Phase 6 tests pass
- [ ] No errors in Supabase logs
- [ ] Webhook processes successfully
- [ ] Credits add/deduct correctly
- [ ] Error messages display properly
- [ ] Payment flow completes end-to-end
- [ ] Documentation is complete
- [ ] Team trained on admin operations
- [ ] Support process in place

## Estimated Time: 2-3 hours total

Good luck with your launch! 🚀







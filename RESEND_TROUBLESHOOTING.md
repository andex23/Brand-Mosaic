# Resend SMTP Troubleshooting Guide

If you're getting "error sending confirmation email" even after configuring Resend, check these:

## ✅ Step-by-Step Verification

### 1. Verify Resend Domain Setup

**In Resend Dashboard:**
1. Go to **Domains** → Check if your domain is verified
2. The sender email MUST be from a verified domain
   - ✅ `noreply@yourdomain.com` (if domain verified)
   - ❌ `noreply@gmail.com` (won't work)

### 2. Check Supabase SMTP Settings

**In Supabase Dashboard → Project Settings → Authentication → SMTP Settings:**

```
Host: smtp.resend.com
Port: 465 (for SSL) OR 587 (for TLS)
Username: resend
Password: re_xxxxxxxxxxxxx (your Resend API key)
Sender email: noreply@yourdomain.com (MUST be from verified domain)
Sender name: Brand Mosaic (optional)
```

**Common Mistakes:**
- ❌ Using port `25` (blocked by most providers)
- ❌ Wrong username (must be `resend`, not your email)
- ❌ Using Resend API key as password incorrectly
- ❌ Sender email not from verified domain

### 3. Verify Resend API Key Format

Your API key should:
- Start with `re_`
- Be from **API Keys** section in Resend dashboard
- Have **Sending** permissions enabled

### 4. Test SMTP Connection

**Quick Test:**
1. In Supabase Dashboard → Authentication → Email Templates
2. Click "Send test email"
3. Check if it sends successfully

### 5. Check Resend Logs

1. Go to Resend Dashboard → **Logs**
2. Look for failed sends
3. Check error messages (bounces, invalid sender, etc.)

## 🔧 Quick Fixes

### Option A: Disable Email Confirmation (Testing)

1. Supabase Dashboard → Authentication → Providers → Email
2. Toggle OFF **"Confirm email"**
3. Save
4. Users can sign up without email verification

### Option B: Use Resend API Directly (Advanced)

Instead of SMTP, use Resend's API via Supabase Edge Function (more reliable).

### Option C: Verify Domain DNS Records

In Resend → Domains → Check DNS records:
- SPF record
- DKIM records
- DMARC (optional)

All must show ✅ verified status.

## 🐛 Common Error Messages

| Error | Solution |
|-------|----------|
| "Invalid sender" | Sender email must be from verified domain |
| "Authentication failed" | Check username is `resend` and API key is correct |
| "Connection timeout" | Use port 465 (SSL) or 587 (TLS), not 25 |
| "Domain not verified" | Complete DNS setup in Resend dashboard |

## 📧 Still Not Working?

1. **Check Supabase Logs:**
   - Dashboard → Logs → Filter by "email" or "auth"
   - Look for detailed error messages

2. **Test with Different Email:**
   - Try sending to a different email provider (Gmail, Outlook, etc.)
   - Some providers block SMTP from certain IPs

3. **Contact Support:**
   - Resend Support: support@resend.com
   - Supabase Support: support@supabase.com

## ✅ Verification Checklist

- [ ] Domain verified in Resend dashboard
- [ ] Sender email uses verified domain
- [ ] SMTP host: `smtp.resend.com`
- [ ] Port: `465` (SSL) or `587` (TLS)
- [ ] Username: `resend`
- [ ] Password: Resend API key (starts with `re_`)
- [ ] Test email sends successfully from Supabase
- [ ] Check Resend logs for delivery status







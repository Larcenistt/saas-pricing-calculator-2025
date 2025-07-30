# Deployment Checklist ✓

## Pre-Deployment
- [x] Project built successfully (`npm run build`)
- [x] Dist folder created with all assets
- [x] Environment variables ready
- [x] Stripe live keys configured
- [x] vercel.json added for routing

## Deployment Steps

### 1. Go to Vercel
- Visit https://vercel.com
- Sign up/Login (free account)

### 2. Deploy Your App
**Easiest Method - Drag & Drop:**
1. Open your file explorer
2. Navigate to: `C:\Users\growl\.claude\saas-pricing-calculator-2025\dist`
3. Go to https://vercel.com/new
4. Drag the entire `dist` folder to the upload area
5. Drop it!

### 3. Configure Project
- Project name: `saas-pricing-calculator` (or your choice)
- Framework: Other (already built)
- Root directory: Leave as is

### 4. Add Environment Variable
Click "Environment Variables" and add:
```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN
```

### 5. Deploy
- Click "Deploy"
- Wait ~45 seconds
- Get your URL!

## Post-Deployment

### Update Stripe URLs
1. Go to https://dashboard.stripe.com
2. Find your product/price
3. Update checkout settings:
   - Success URL: `https://YOUR-APP.vercel.app/success`
   - Cancel URL: `https://YOUR-APP.vercel.app`

### Test Everything
- [ ] Visit your live URL
- [ ] Click through landing page
- [ ] Test with TEST card first: 4242 4242 4242 4242
- [ ] Verify redirect to success
- [ ] Test calculator functionality
- [ ] Test PDF exports
- [ ] Test with REAL card (small amount)

## Your Live URLs
After deployment, you'll have:
- Landing: `https://YOUR-APP.vercel.app`
- Success: `https://YOUR-APP.vercel.app/success`
- Direct: `https://YOUR-APP.vercel.app/calculator`

## Important Notes
- You're in LIVE mode - real payments!
- First payment might take 7-14 days to reach bank (Stripe policy)
- Keep your support email monitored
- Save your Vercel project URL

Ready to go live? 🚀
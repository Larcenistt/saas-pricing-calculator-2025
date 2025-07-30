# Deploy to Vercel - Step by Step

## Option 1: Vercel CLI (Recommended)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel
```

Follow the prompts:
- Login/signup
- Confirm project settings
- Deploy!

## Option 2: Drag & Drop (Easiest)

### 1. Go to Vercel
Visit https://vercel.com

### 2. Sign Up/Login
- Use GitHub/GitLab/Email
- Free account is fine

### 3. Drag & Drop Deploy
1. In your file explorer, open: `saas-pricing-calculator-2025/dist`
2. Go to https://vercel.com/new
3. Drag the entire `dist` folder into the browser
4. Drop it on the "Upload" area

### 4. Configure Environment Variables
After upload, click "Environment Variables" and add:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN
```

### 5. Deploy
Click "Deploy" and wait ~1 minute

## Option 3: GitHub Integration

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import Git Repository
3. Select your repo
4. Add environment variable
5. Deploy

## After Deployment

### Your URLs:
- Production: https://your-project.vercel.app
- Success: https://your-project.vercel.app/success
- Direct: https://your-project.vercel.app/calculator

### Update Stripe:
1. Go to Stripe Dashboard
2. Update success URL to: https://your-project.vercel.app/success
3. Update cancel URL to: https://your-project.vercel.app

### Test Live Payment:
1. Visit your production URL
2. Click buy button
3. Use a real credit card (you're in LIVE mode!)
4. Complete purchase
5. Verify redirect to success page

## Troubleshooting

### Page Not Found on /success?
Add `vercel.json` to project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Stripe Not Working?
- Check environment variable is set in Vercel
- Ensure you're using the live key
- Check Stripe Dashboard for errors

### Need to Update?
1. Make changes locally
2. Run `npm run build`
3. Deploy again (Vercel will update automatically)

## Custom Domain

To add your own domain:
1. In Vercel dashboard, go to Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL is automatic!

Ready to deploy? The `dist` folder is ready!
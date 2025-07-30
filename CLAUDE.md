# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Product**: SaaS Pricing Calculator 2025 Edition  
**Price**: $99 one-time purchase  
**Status**: LIVE and accepting payments  
**URL**: https://saas-pricing-calculator-2025.vercel.app  
**Test Page**: https://saas-pricing-calculator-2025.vercel.app/test.html  

## Current Status (Last Updated: 2025-07-30)

### ✅ Completed
- Frontend application built with React + Vite
- Stripe Buy Button integration (NOT Payment Links or Checkout Sessions)
- Premium dark theme design (removed alien theme per user feedback)
- Calculator with pricing tier recommendations
- PDF export functionality (both simple and professional)
- Deployed to Vercel and live
- Exit popup removed (user requested removal)
- Countdown timer removed (was causing flashing)
- Professional design without dark patterns

### 🔄 In Progress
- Testing and configuring Stripe success redirect
- Need to verify automatic redirect after payment works
- May require manual configuration in Stripe Dashboard

### ⚠️ Pending
- Replace Google Analytics placeholder (G-XXXXXXXXXX) with real ID
- Complete payment flow testing with real transaction
- Begin marketing outreach

## Essential Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:5173

# Build & Deploy
npm run build           # Build for production (creates dist/)
vercel --prod          # Deploy to production

# Testing
npm run lint           # Run ESLint

# Git
git add -A && git commit -m "message"  # Commit changes
git push               # Note: No remote configured yet
```

## Architecture & Key Decisions

### Tech Stack
- **Frontend**: React 19.1 + Vite 7.0
- **Styling**: Tailwind CSS v4 (using @tailwindcss/postcss)
- **Payment**: Stripe Buy Button (embedded, not redirects)
- **PDF Export**: jsPDF + jspdf-autotable
- **Hosting**: Vercel (frontend only, no backend)

### File Structure
```
src/
├── App.jsx                    # Main landing page (no exit popup)
├── components/
│   ├── BuyButtonWrapper.jsx   # Stripe Buy Button with loading state
│   ├── Calculator.jsx         # Main calculator logic
│   ├── Success.jsx           # Post-payment success page
│   ├── Privacy.jsx           # Privacy policy
│   └── Terms.jsx             # Terms of service
├── utils/
│   ├── exportPDF.js          # Simple PDF export
│   └── exportPDFEnhanced.js  # Professional PDF with tables
└── premium-dark.css          # Current theme (replaced alien theme)
```

### Important Configuration

**Stripe Buy Button**:
- Button ID: `buy_btn_1RqOC7I6kujeAM5FZbqTtxFL`
- Publishable Key: `pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN`
- Success URL: `https://saas-pricing-calculator-2025.vercel.app/success`

**Business Email**: support@predictionnexus.com (on Namecheap)

## User Feedback History

1. **"the discount in the beginning is misleading"** 
   - Removed fake 50% OFF and strikethrough pricing
   
2. **"clean that website up the front font looks bad"**
   - Redesigned with premium dark theme
   
3. **"the front page is flashing fix and look more professional"**
   - Removed countdown timer
   - Added loading states to prevent flashing
   
4. **"remove the pop up in the beginning of the page"**
   - Removed exit intent popup

## Next Steps & Priorities

### Immediate (Today)
1. Test Stripe success redirect configuration
2. Configure redirect in Stripe Dashboard if needed
3. Complete test purchase to verify flow
4. Update Google Analytics ID

### Tomorrow
1. Begin marketing outreach (templates ready)
2. Monitor support email
3. Track conversion metrics
4. Gather user feedback

### This Week
1. A/B test pricing ($79 vs $99 vs $129)
2. Create video demo
3. Submit to Product Hunt
4. Reach out to 20 SaaS founders daily

## Development Guidelines

1. **CLAUDE RULES.md Compliance**:
   - Always plan with TodoWrite before making changes
   - Keep changes minimal and focused
   - Never be lazy - find root causes
   - Document all changes

2. **Simplicity First**:
   - No complex features without user request
   - Frontend-only (no backend needed)
   - Use existing solutions (Stripe Buy Button)

3. **User Experience**:
   - No dark patterns
   - Fast page loads (< 2s)
   - Professional appearance
   - Clear value proposition

## Testing Checklist

Before any deployment:
1. Run `npm run build` successfully
2. Test Buy Button loads without flashing
3. Verify calculator calculations
4. Test PDF export
5. Check all page routes work
6. Verify mobile responsiveness

## Common Issues & Solutions

**Buy Button Not Loading**:
- Check Stripe script in index.html
- Verify button ID is correct
- Clear browser cache

**Page Flashing**:
- Already fixed by removing countdown timer
- Loading states prevent button flash

**Redirect After Payment**:
- If not working, configure in Stripe Dashboard
- Manual workaround: Click "Access Calculator"

## Marketing Assets

All marketing materials are in the `marketing/` folder:
- Email templates (5 variations)
- Social media posts
- FAQ document
- Messaging guide
- Launch checklist

## Support Information

- **Live Site**: https://saas-pricing-calculator-2025.vercel.app
- **Support Email**: support@predictionnexus.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Analytics**: Google Analytics (pending setup)
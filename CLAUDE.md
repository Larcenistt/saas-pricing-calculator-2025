# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Product**: SaaS Pricing Calculator 2025 Edition  
**Price**: $99 one-time purchase  
**Status**: LIVE and accepting payments  
**URL**: https://saas-pricing-calculator.vercel.app/  
**Domain**: saas-pricing-calculator.vercel.app (ACTIVE)  
**Email**: support@predictionnexus.com (ACTIVE)

## Current Status (Last Updated: 2025-07-31 @ 5:30 PM)

### ✅ Completed July 31, 2025
1. **Domain & Email Setup**
   - Configured DNS records in Namecheap
   - Set up predictionnexus.com with Vercel
   - Created support@predictionnexus.com with Private Email Pro
   - Updated all code references from vercel.app to predictionnexus.com
   - Deployed updates to production

2. **External Services Configuration**
   - Updated Stripe dashboard with new success URL
   - Configured Google Analytics for new domain
   - Verified tracking is working correctly

3. **Marketing Launch**
   - Created Reddit account with business email
   - Posted value-first content in r/SaaS
   - Submitted to SaaS Hub directory (pending approval)
   - Started LinkedIn profile creation (in progress)
   - Prepared cold outreach templates

### ✅ Completed July 30
1. **UI Interface Fixes**
   - Fixed navigation spacing (space-x-8, px-6 py-3)
   - Added emoji icons to navigation (⚡💰🧮📚)
   - Created Resources page with guides, tutorials, FAQ
   - Removed all "boring" elements per user feedback

2. **Google Analytics Integration** 
   - Implemented comprehensive tracking (ID: G-JMQMDLTNK4)
   - Tracks: page views, calculator use, PDF exports, purchases
   - Created analytics.js utility for centralized tracking
   - Added conversion tracking on Success page
   - Deployed to production

3. **Project Cleanup**
   - Removed 59 unnecessary files (duplicate components, unused themes)
   - Kept all essential functionality
   - Organized folder structure for clarity

### 🚀 Next Steps - Priority Order

#### 1. **Complete LinkedIn Profile** (CRITICAL - 15 min)
**Current Status**: In middle of profile creation
- Finish profile setup (was at job preferences step)
- Add profile photo and about section
- Start connecting with SaaS founders

#### 2. **Send Cold Outreach** (CRITICAL - 2 hours)
**Goal**: 20 messages today for 2-5 sales
- Use LinkedIn to find SaaS founders
- Send personalized connection requests
- Use templates in marketing/cold-email-tracker.md
- Track all outreach in spreadsheet

#### 3. **Monitor Reddit Post** (HIGH - 30 min)
- Check r/SaaS post for comments
- Respond helpfully to any questions
- Do NOT directly promote unless asked

#### 4. **Directory Submissions** (MEDIUM - 1 hour)
**Completed**: SaaS Hub
**Pending**: 
- There's An AI For That (account created, need to submit)
- Alternative To
- Product Hunt (prepare for Tuesday launch)

#### 5. **Create Demo Video** (HIGH - 2 hours)
- Script ready in marketing/demo-script.md
- Use Loom or screen recording
- Show real calculation example
- Upload to YouTube
- Update link in HeroSection-Modern.jsx

#### 6. **Email Campaign** (MEDIUM - Ongoing)
- Monitor support@predictionnexus.com
- Set up email signature
- Prepare follow-up sequences

## Essential Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:5173

# Build & Deploy
npm run build           # Build for production
vercel --prod          # Deploy to production

# Testing
npm run lint           # Check for code issues
```

## Key Files & Locations

```
src/
├── App.jsx                    # Main app entry
├── components/
│   ├── BuyButtonWrapper.jsx   # Stripe Buy Button ($99)
│   ├── Calculator.jsx         # Core calculator with analytics
│   ├── Success.jsx           # Post-payment page (tracks purchases)
│   └── *-Modern.jsx          # All UI components (Modern theme)
├── utils/
│   ├── analytics.js          # GA tracking functions
│   └── exportPDF*.js         # PDF generation
├── pages/                    # All routes
└── modern-dark.css          # Current theme
```

## Important Configuration

**Stripe**:
- Button ID: `buy_btn_1RqOC7I6kujeAM5FZbqTtxFL`
- Success URL: `https://saas-pricing-calculator.vercel.app/success`
- Test mode: Use 4242 4242 4242 4242
- Dashboard updated: ✅

**Google Analytics**:
- ID: `G-JMQMDLTNK4` (LIVE - tracking all events)
- Conversion tracking implemented
- E-commerce tracking ready

**Support**: support@predictionnexus.com

## Quick Fixes Reference

**If Buy Button doesn't load**: Check Stripe script in index.html
**If Analytics not tracking**: Clear cache, check Real-Time view
**If deployment fails**: Run `npm run build` first
**If navigation breaks**: Check Navigation-Modern.jsx imports

## Marketing Assets Location

All ready-to-use templates in `marketing/` folder:
- Cold email templates (5 variations)
- Social media posts
- Directory submission list
- Competitor analysis
- Messaging guide

## Revenue Goal

Target: 10 sales/week = $990/week = $4,290/month

Current conversion tracking will show you exactly what's working!

---

**Remember**: The app is LIVE and making money. Focus on marketing and conversions!
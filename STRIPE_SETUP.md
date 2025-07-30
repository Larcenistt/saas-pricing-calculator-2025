# Stripe Setup Instructions

## Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Click "Start now" 
3. Enter your email and create password
4. Select "Individual" as business type for fastest setup

## Step 2: Get Your API Keys (Test Mode)
1. In Stripe Dashboard, look for "Developers" in the menu
2. Click "API keys"
3. Copy your "Publishable key" (starts with pk_test_)
4. Add it to your .env file:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```

## Step 3: Create Your Product
1. In Stripe Dashboard, go to "Products"
2. Click "Add product"
3. Fill in:
   - Name: SaaS Pricing Calculator 2025
   - Description: One-time purchase pricing optimization tool
   - Price: $99.00
   - Billing: One time (NOT recurring!)
4. After creating, copy the Price ID (starts with price_)
5. Update src/utils/stripe.js with your Price ID

## Step 4: Test Cards
Use these test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Any future expiry date and any 3-digit CVC

## Quick Test Mode
For immediate testing without Stripe account:
- Publishable key: pk_test_51HZ5X9LK3J7X9LK3J7X9LK3J7X9LK3J7
- Price ID: price_1HZ5X9LK3J7X9LK3J7X9LK3J7X9LK3J7
(These are fake - replace with real ones!)
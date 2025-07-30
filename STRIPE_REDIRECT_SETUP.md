# 🔄 Setting Up Automatic Redirect After Payment

## Current Flow vs Desired Flow

### Current Flow ❌
1. Customer clicks "Get Instant Access"
2. Goes to Stripe payment page
3. Completes payment
4. Stays on Stripe success page
5. Has to manually return to site
6. Clicks "Access Calculator"

### Desired Flow ✅
1. Customer clicks "Get Instant Access"
2. Goes to Stripe payment page
3. Completes payment
4. **Automatically redirects to your success page**
5. Calculator is immediately available

## Setup Instructions

### Step 1: Configure Stripe Payment Link

1. **Log into Stripe Dashboard**
   - Go to: https://dashboard.stripe.com

2. **Navigate to Payment Links**
   - Click "Payment Links" in the sidebar
   - Or go to: https://dashboard.stripe.com/payment-links

3. **Find Your Payment Link**
   - Look for the link that ends with: `1aCgYU01`
   - It should show "$99.00" as the price

4. **Edit the Payment Link**
   - Click on the payment link
   - Click "Edit" button (or ⚙️ icon)

5. **Configure Success URL**
   - Scroll to "After payment" section
   - Toggle ON "Don't show confirmation page"
   - In "Success URL" field, enter:
   ```
   https://saas-pricing-calculator-2025.vercel.app/success?session_id={CHECKOUT_SESSION_ID}
   ```

6. **Save Changes**
   - Click "Save" at the bottom

### Step 2: Test the New Flow

1. Visit your site
2. Click "Get Instant Access"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. **You should automatically land on the success page with calculator**

### Step 3: Additional Improvements (Optional)

#### A. Add Loading State
The success page now captures the session ID from the URL. You could:
- Verify the payment with Stripe API
- Show personalized welcome message
- Send welcome email automatically

#### B. Protect Calculator Access
Currently anyone can access `/calculator` directly. To fix:
1. Check for valid purchase in localStorage
2. Redirect non-purchasers to landing page
3. Add server-side verification (requires backend)

#### C. Better Email Flow
1. Set up Stripe to send custom receipts
2. Include calculator access link in receipt
3. Add customer to email list for updates

## Alternative: Stripe Checkout (More Control)

If Payment Links don't support redirect in your region, consider:

1. **Switch to Stripe Checkout Sessions**
   - Requires simple backend (can use Vercel Functions)
   - Full control over success/cancel URLs
   - Can capture customer email/name

2. **Use a Service**
   - Gumroad
   - Lemon Squeezy
   - Paddle
   - These handle everything including taxes

## Quick Fixes Without Stripe Changes

If you can't edit the Payment Link settings:

1. **Add Clear Instructions**
   - On the landing page, mention to return after payment
   - Send follow-up email with access link

2. **Use Browser Storage**
   - Set a flag before redirect
   - Check flag on return to show success message

3. **Create a Simple Welcome Page**
   - `/welcome` page with access instructions
   - Share this link in your confirmation emails

## Need Help?

- Stripe Support: https://support.stripe.com
- Payment Links Docs: https://stripe.com/docs/payment-links
- Email: support@predictionnexus.com
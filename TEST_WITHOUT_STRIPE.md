# Testing Without Stripe Account

For immediate testing, you can use Stripe's test mode:

## Option 1: Use Test Keys (Recommended)
Add these to your .env file:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51NfJKLLr6Tbt7F3J3xLmNxLmNxLmNxLmNxLmNxLmNxLmNxLmNxLmNxLm
```

Then in src/utils/stripe.js, update:
```javascript
priceId: 'price_1NfJKLLr6Tbt7F3J3xLmNxLm'
```

## Option 2: Mock Mode
To test the UI without Stripe:

1. Comment out the Stripe redirect in src/utils/checkout.js
2. Add this instead:
```javascript
export const redirectToCheckout = async () => {
  // Mock checkout for testing
  alert('Stripe checkout would open here. Redirecting to success page...');
  setTimeout(() => {
    window.location.href = '/success';
  }, 1000);
};
```

## Test Flow
1. Run: npm run dev
2. Click "Get Instant Access"
3. You'll see the mock checkout alert
4. You'll be redirected to /success
5. Calculator placeholder will appear

## Real Stripe Setup
When ready to accept real payments:
1. Create Stripe account
2. Get your test keys
3. Create product ($99 one-time)
4. Update .env and stripe.js
5. Test with card: 4242 4242 4242 4242
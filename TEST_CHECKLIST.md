# Testing Checklist

## Payment Flow Test

### 1. Test Purchase Flow
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Click "Get Instant Access - $99"
- [ ] You'll be redirected to Stripe Checkout
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Any future date, any CVC
- [ ] Complete purchase
- [ ] Verify redirect to /success

### 2. Test Success Page
- [ ] Confirm success banner appears
- [ ] See confetti animation (3 seconds)
- [ ] Quick start guide visible
- [ ] Calculator loads immediately
- [ ] Order ID generated

### 3. Test Calculator
- [ ] Enter sample data:
  - Current Price: 29
  - Competitor Price: 39
  - Customers: 100
  - Churn Rate: 5
- [ ] Click "Calculate Optimal Pricing"
- [ ] Verify results appear
- [ ] Test both PDF export buttons

### 4. Test Direct Access
- [ ] Visit http://localhost:5173/calculator
- [ ] Calculator should load without payment
- [ ] Use this for demos/testing

### 5. Test Return Visit
- [ ] After purchase, close browser
- [ ] Revisit http://localhost:5173
- [ ] Should remember purchase (localStorage)

## Live Mode Checklist

Before going live:
- [ ] Stripe account fully verified
- [ ] Bank account connected
- [ ] Test with real card (small amount)
- [ ] Email notifications working
- [ ] Support email monitored

## URLs for Testing

- Landing: http://localhost:5173
- Success: http://localhost:5173/success
- Direct: http://localhost:5173/calculator
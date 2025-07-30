# 🔧 Debug Guide - Common Issues & Solutions

## 1. Payment Button Not Working

### Symptoms:
- Clicking "Get Instant Access" does nothing
- Page refreshes but stays on same page
- Console shows errors

### Solutions:
```javascript
// Check browser console (F12) for errors
// Common error: "redirectToCheckout is not a function"

// Fix: Ensure checkout.js is correct
// The redirect should be:
window.location.href = 'https://buy.stripe.com/6oUcN523G11AaJ41aCgYU01';
```

### Test in Console:
```javascript
// Paste this in browser console to test redirect:
window.location.href = 'https://buy.stripe.com/6oUcN523G11AaJ41aCgYU01';
```

## 2. Stripe Payment Page Issues

### If Payment Link Shows Error:
- **"This payment link is no longer active"**
  - Payment link may be deactivated in Stripe
  - Check Stripe dashboard → Payment Links
  - Ensure link is active

- **Price Shows Wrong Amount**
  - Verify in Stripe dashboard
  - Should show $99.00

### Cannot Complete Test Payment:
```
Test Card Details:
- Number: 4242 4242 4242 4242
- Expiry: 12/34 (any future date)
- CVC: 123 (any 3 digits)
- ZIP: 12345 (any valid ZIP)
```

## 3. No Redirect After Payment

### Current Behavior:
- Payment completes
- Stays on Stripe success page
- No automatic redirect

### Fix in Stripe Dashboard:
1. Log into https://dashboard.stripe.com
2. Go to Payment Links
3. Find your link (ends with `1aCgYU01`)
4. Click Edit
5. Under "After payment":
   - Toggle ON "Don't show confirmation page"
   - Set Success URL to:
   ```
   https://saas-pricing-calculator-2025.vercel.app/success?session_id={CHECKOUT_SESSION_ID}
   ```
6. Save changes

### Manual Test Without Stripe Config:
After payment, manually navigate to:
```
https://saas-pricing-calculator-2025.vercel.app/success
```

## 4. Success Page Not Loading Calculator

### Check LocalStorage:
```javascript
// In browser console on success page:
localStorage.getItem('purchased'); // Should return 'true'
localStorage.getItem('purchaseDate'); // Should return date
```

### Force Set Purchase Status:
```javascript
// Paste in console to simulate purchase:
localStorage.setItem('purchased', 'true');
localStorage.setItem('purchaseDate', new Date().toISOString());
location.reload();
```

## 5. Calculator Not Working

### Input Fields Not Responding:
```javascript
// Check if React loaded properly
// In console:
document.getElementById('root'); // Should exist
```

### Calculate Button Does Nothing:
- Check for console errors
- Ensure all 4 fields have values:
  - Current Price
  - Competitor Price 1
  - Number of Customers (optional)
  - Monthly Churn Rate (optional)

### PDF Export Fails:
```javascript
// Test in console:
console.log(window.jspdf); // Should exist
```

## 6. Styling Issues

### Page Looks Broken/No Dark Theme:
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear cache:
   - Chrome: Settings → Privacy → Clear browsing data
   - Check "Cached images and files"

### Fonts Look Wrong:
- Check internet connection (Google Fonts)
- Fallback fonts should still work

## 7. Quick Console Tests

### Test 1: Check React App Loaded
```javascript
// Should return true if app loaded
!!document.querySelector('#root').children.length
```

### Test 2: Simulate Purchase Flow
```javascript
// Mark as purchased
localStorage.setItem('purchased', 'true');
// Go to calculator
window.location.href = '/calculator';
```

### Test 3: Check for Errors
```javascript
// Look for red error messages in console
// Common issues:
// - "Failed to load resource" (file missing)
// - "Uncaught TypeError" (code error)
// - "CORS error" (external resource blocked)
```

## 8. Mobile Testing

### Test on Phone:
1. Open site on mobile browser
2. Check if responsive
3. Test payment flow
4. Verify calculator works with touch

### Common Mobile Issues:
- Buttons too small: Fixed with proper padding
- Text too small: Fixed with responsive text sizes
- Calculator cut off: Fixed with responsive grid

## 9. Emergency Fixes

### Nothing Works - Clean Start:
```bash
# 1. Clear everything
localStorage.clear();

# 2. Hard refresh
Ctrl + Shift + R

# 3. Try incognito/private mode
```

### Payment Works but No Access:
1. Email support@predictionnexus.com with:
   - Payment receipt
   - Email used
   - Screenshot of issue

### Create Manual Access Link:
```
https://saas-pricing-calculator-2025.vercel.app/calculator
```
Share this with customers who paid but can't access.

## 10. Monitoring Tools

### Check Site Status:
- https://downforeveryoneorjustme.com/saas-pricing-calculator-2025.vercel.app

### Check SSL/Security:
- https://www.ssllabs.com/ssltest/

### Speed Test:
- https://pagespeed.web.dev/

## Need More Help?

1. **Check browser console** (F12) for specific errors
2. **Take screenshots** of issues
3. **Note exact steps** that cause the problem
4. **Test in different browser** (Chrome, Firefox, Safari)

### Contact for Complex Issues:
- Vercel Support: https://vercel.com/support
- Stripe Support: https://support.stripe.com
- Email: support@predictionnexus.com
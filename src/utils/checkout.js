// Simple redirect to Stripe Payment Link
export const redirectToCheckout = async () => {
  // Your Stripe Payment Link
  const paymentLink = 'https://buy.stripe.com/6oUcN523G11AaJ41aCgYU01';
  
  // Redirect to Stripe Payment Link
  window.location.href = paymentLink;
};
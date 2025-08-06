import { useState, useEffect } from 'react';
import { trackBuyButtonClick } from '../utils/analytics';
import { getPrice, getFormattedPrice, getStripeButtonId } from '../utils/abTesting';

export default function BuyButtonWrapper() {
  const [isButtonLoaded, setIsButtonLoaded] = useState(false);
  const priceInfo = getFormattedPrice();
  const buttonId = getStripeButtonId();
  const price = getPrice();

  useEffect(() => {
    // Check if Stripe script is loaded
    const checkStripeLoaded = setInterval(() => {
      if (window.StripeCheckout || document.querySelector('stripe-buy-button')) {
        setIsButtonLoaded(true);
        clearInterval(checkStripeLoaded);
      }
    }, 100);

    // Timeout after 3 seconds
    setTimeout(() => {
      setIsButtonLoaded(true);
      clearInterval(checkStripeLoaded);
    }, 3000);

    return () => clearInterval(checkStripeLoaded);
  }, []);

  useEffect(() => {
    // Add click tracking to Stripe button when it loads
    if (isButtonLoaded) {
      const stripeButton = document.querySelector('stripe-buy-button');
      if (stripeButton) {
        stripeButton.addEventListener('click', trackBuyButtonClick);
        return () => stripeButton.removeEventListener('click', trackBuyButtonClick);
      }
    }
  }, [isButtonLoaded]);

  return (
    <div className="w-full relative min-h-[56px]">
      {/* Loading skeleton */}
      {!isButtonLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-white font-semibold">Loading secure checkout...</span>
          </div>
        </div>
      )}
      
      {/* Price display for A/B test */}
      {priceInfo.badge && (
        <div className="text-center mb-2">
          <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            {priceInfo.badge} - {priceInfo.discount}
          </span>
        </div>
      )}
      
      {/* Stripe Buy Button */}
      <div className={`transition-opacity duration-500 ${isButtonLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <stripe-buy-button
          buy-button-id={buttonId}
          publishable-key="pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN"
          success-url="https://saas-pricing-calculator.vercel.app/success"
        />
      </div>
      
      {/* Fallback button if Stripe fails */}
      {isButtonLoaded && (
        <noscript>
          <a 
            href="https://buy.stripe.com/6oUcN523G11AaJ41aCgYU01" 
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors"
          >
            Get Instant Access - {priceInfo.price}
          </a>
        </noscript>
      )}
    </div>
  );
}
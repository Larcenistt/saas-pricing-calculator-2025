import { useState, useEffect } from 'react';

export default function BuyButtonWrapper() {
  const [isButtonLoaded, setIsButtonLoaded] = useState(false);

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
      
      {/* Stripe Buy Button */}
      <div className={`transition-opacity duration-500 ${isButtonLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <stripe-buy-button
          buy-button-id="buy_btn_1RqOC7I6kujeAM5FZbqTtxFL"
          publishable-key="pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN"
          success-url="https://saas-pricing-calculator-2025.vercel.app/success"
        />
      </div>
      
      {/* Fallback button if Stripe fails */}
      {isButtonLoaded && (
        <noscript>
          <a 
            href="https://buy.stripe.com/6oUcN523G11AaJ41aCgYU01" 
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors"
          >
            Get Instant Access - $99
          </a>
        </noscript>
      )}
    </div>
  );
}
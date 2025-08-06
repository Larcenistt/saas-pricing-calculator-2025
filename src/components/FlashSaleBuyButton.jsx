import { useState, useEffect } from 'react';
import { trackBuyButtonClick } from '../utils/analytics';

export default function FlashSaleBuyButton() {
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
    <div className="w-full relative">
      {/* Flash Sale Badge */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          SAVE $20 TODAY!
        </span>
      </div>
      
      {/* Price Display with Strikethrough */}
      <div className="text-center mb-3">
        <span className="text-gray-500 line-through text-2xl mr-3">$99</span>
        <span className="text-4xl font-bold text-green-600">$79</span>
        <span className="text-sm text-red-600 ml-2 font-semibold">(20% OFF)</span>
      </div>

      <div className="min-h-[56px]">
        {/* Loading skeleton */}
        {!isButtonLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-white font-semibold">Loading flash sale checkout...</span>
            </div>
          </div>
        )}
        
        {/* Stripe Buy Button - You'll need to create a new $79 product in Stripe */}
        <div className={`transition-opacity duration-500 ${isButtonLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <stripe-buy-button
            buy-button-id="buy_btn_1RqOC7I6kujeAM5FZbqTtxFL"
            publishable-key="pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN"
            success-url="https://predictionnexus.com/success"
          />
        </div>
        
        {/* Trust Badges */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            <span>30-Day Guarantee</span>
          </div>
        </div>
        
        {/* Urgency Message */}
        <div className="mt-3 text-center text-sm text-red-600 font-medium animate-pulse">
          ⚡ Flash sale price expires when timer hits zero!
        </div>
      </div>
    </div>
  );
}
import { useEffect, useRef } from 'react';

export default function StripeBuyButton({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Add success URL configuration
    const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    
    if (containerRef.current && !containerRef.current.querySelector('stripe-buy-button')) {
      containerRef.current.innerHTML = `
        <stripe-buy-button
          buy-button-id="buy_btn_1RqOC7I6kujeAM5FZbqTtxFL"
          publishable-key="pk_live_51RqLWCI6kujeAM5FQSJbNLxHrxgCmrLqTe9187pxEGVbxxRXIeTuDMd7mv6cwAV68ufyvcBgHHRFC8dx0XT6Mxxn003tmk9NAN"
          success-url="${successUrl}"
        >
        </stripe-buy-button>
      `;
    }
  }, []);

  // Custom styling wrapper
  return (
    <div className={`stripe-button-wrapper ${className}`}>
      <div ref={containerRef}></div>
      <style jsx>{`
        .stripe-button-wrapper {
          width: 100%;
        }
        .stripe-button-wrapper stripe-buy-button {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
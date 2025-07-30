import { redirectToCheckout } from '../utils/checkout';

export default function CheckoutButton({ text = "Get Instant Access - $99", className = "" }) {
  const handleClick = async () => {
    try {
      await redirectToCheckout();
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors ${className}`}
    >
      {text}
    </button>
  );
}
import { useEffect } from 'react';
import Success from './Success';
import CheckoutButton from './CheckoutButton';

export default function PurchaseCheck({ children }) {
  const isPurchased = localStorage.getItem('purchased') === 'true';
  
  // If they've purchased, show the success page with calculator
  if (isPurchased) {
    return <Success />;
  }
  
  // Otherwise show the regular content
  return children;
}
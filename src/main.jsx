import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initReferralTracking } from './utils/referralTracking'

// Initialize referral tracking after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReferralTracking);
} else {
  initReferralTracking();
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Failed to find root element');
}

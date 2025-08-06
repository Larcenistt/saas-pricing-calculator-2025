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
console.log('main.jsx: Root element:', root);
console.log('main.jsx: Document ready state:', document.readyState);

if (root) {
  console.log('main.jsx: Creating React root and rendering App...');
  try {
    const reactRoot = createRoot(root);
    reactRoot.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('main.jsx: App rendered successfully');
  } catch (error) {
    console.error('main.jsx: Error rendering App:', error);
  }
} else {
  console.error('main.jsx: Failed to find root element');
}

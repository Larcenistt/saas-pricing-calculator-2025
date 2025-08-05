import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'
import Navigation from './components/Navigation-Futuristic'
import PurchaseNotifications from './components/PurchaseNotifications'
import ExitIntentPopup from './components/ExitIntentPopup'
import EmailCapturePopup from './components/EmailCapturePopup'
import LiveChat from './components/LiveChat'
import NetworkStatus from './components/NetworkStatus'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage-Modern'))
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const PricingPage = lazy(() => import('./pages/PricingPage-Modern'))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'))
const SuccessPage = lazy(() => import('./pages/SuccessPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const ReferralPage = lazy(() => import('./pages/ReferralPage'))
import './App.css'
import './modern-dark.css'
import './futuristic-pro.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Ensure fonts are loaded before showing content
    document.fonts.ready.then(() => {
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-secondary">
          {/* Futuristic Background Elements */}
          <div className="futuristic-bg" />
          <div className="grid-overlay" />
          <div className="scan-line" />
          <div className="particle-container">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="particle" 
                style={{ 
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 20}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }} 
              />
            ))}
          </div>
          
          <Navigation />
          <PurchaseNotifications />
          <ExitIntentPopup />
          <EmailCapturePopup />
          <LiveChat />
          <NetworkStatus />
          <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-md)',
            },
          }}
        />
        
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
    </ErrorBoundary>
  )
}

export default App
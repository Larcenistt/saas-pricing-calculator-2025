import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'
import Navigation from './components/Navigation-Professional'
import PurchaseNotifications from './components/PurchaseNotifications'
import ExitIntentOffer from './components/ExitIntentOffer'
import EmailCapturePopup from './components/EmailCapturePopup'
import SimpleLiveChat from './components/SimpleLiveChat'
import NetworkStatus from './components/NetworkStatus'
import LivePurchaseNotifications from './components/LivePurchaseNotifications'
import ProtectedRoute from './components/auth/ProtectedRoute'

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

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
import './App.css'
import './modern-dark.css'
import './smooth-animations.css'
import './styles/responsive.css'
import './styles/ultra-futuristic.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Ensure fonts are loaded before showing content
    console.log('App: Starting font loading check...')
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('App: Font loading timeout reached, showing content anyway')
      setIsLoading(false)
    }, 2000)
    
    document.fonts.ready.then(() => {
      console.log('App: Fonts loaded successfully')
      clearTimeout(timeout)
      setIsLoading(false)
    }).catch(err => {
      console.error('App: Font loading error:', err)
      clearTimeout(timeout)
      setIsLoading(false)
    })
    
    return () => clearTimeout(timeout)
  }, [])

  if (isLoading) {
    return <LoadingScreen />;
  }

  console.log('App: Rendering main app content')
  
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-dark-void">
          {/* Ultra Futuristic Background Elements */}
          <div className="hex-bg" />
          <div className="matrix-rain" />
          <div className="data-stream" />
          
          {/* Animated Grid Background */}
          <div className="futuristic-bg" />
          <div className="grid-overlay" />
          
          {/* Scanning Line Effect - handled by CSS */}
          <div className="scan-line" />
          
          {/* Floating Particles */}
          <div className="particle-container">
            {[...Array(30)].map((_, i) => (
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
          <ExitIntentOffer />
          <EmailCapturePopup />
          <SimpleLiveChat />
          <NetworkStatus />
          <LivePurchaseNotifications />
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
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
    </ErrorBoundary>
  )
}

export default App
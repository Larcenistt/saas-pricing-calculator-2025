import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, lazy, Suspense, memo } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'
import Navigation from './components/Navigation-Professional'
import ProtectedRoute from './components/auth/ProtectedRoute'
import UrgencyBanner from './components/UrgencyBanner'
import SocialProofNotifications, { ActiveUsersIndicator } from './components/SocialProofNotifications'

// Performance optimization imports
import { usePerformanceMonitor, useResourceCleanup } from './hooks/usePerformanceOptimizations'
import { memoryManager, wsManager } from './utils/websocketOptimization'
import { cacheManager } from './utils/cachingStrategies'
import { assetCache, resourcePrioritizer } from './utils/assetOptimization'

// Optimized lazy loading with preloading strategies
const HomePage = lazy(() => 
  import('./pages/HomePage-Modern').then(module => {
    // Preload likely next pages
    resourcePrioritizer.queueResource('/pages/PricingPage-Modern.js', 'normal', 'script');
    resourcePrioritizer.queueResource('/pages/CalculatorPage.js', 'high', 'script');
    return module;
  })
);

const PricingPage = lazy(() => 
  import('./pages/PricingPage-Modern').then(module => {
    // Preload payment components
    resourcePrioritizer.queueResource('/components/payments/', 'high', 'script');
    return module;
  })
);

const CalculatorPage = lazy(() => 
  import('./pages/CalculatorPage').then(module => {
    // Preload chart and PDF libraries
    resourcePrioritizer.queueResource('/components/charts/', 'high', 'script');
    resourcePrioritizer.queueResource('/components/pdf/', 'normal', 'script');
    return module;
  })
);

// Lower priority pages
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const SuccessPage = lazy(() => import('./pages/SuccessPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const ReferralPage = lazy(() => import('./pages/ReferralPage'))

// Auth pages - conditional loading
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// Optimized component imports for non-critical features
const PurchaseNotifications = lazy(() => import('./components/PurchaseNotifications'))
const ExitIntentOffer = lazy(() => import('./components/ExitIntentOfferPremium'))
const EmailCapturePopup = lazy(() => import('./components/EmailCapturePopup'))
const SimpleLiveChat = lazy(() => import('./components/SimpleLiveChat'))
const NetworkStatus = lazy(() => import('./components/NetworkStatus'))
const LivePurchaseNotifications = lazy(() => import('./components/LivePurchaseNotifications'))
const FreeTrialBanner = lazy(() => import('./components/FreeTrialBanner'))
const ReferralProgramPremium = lazy(() => import('./components/ReferralProgramPremium'))
const ROICalculator = lazy(() => import('./components/ROICalculator'))
const OnboardingTour = lazy(() => import('./components/OnboardingTour'))

// Optimized CSS imports with critical path prioritization
import './App.css'
import './styles/performance-optimized.css'
import './smooth-animations.css'
import './modern-dark.css'

// Conditionally load heavy stylesheets
if (window.innerWidth > 768) {
  import('./styles/ultra-futuristic.css');
  import('./styles/wealthflow-premium.css');
}
import('./styles/responsive.css');

const App = memo(() => {
  const [isLoading, setIsLoading] = useState(true)
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    supportsAnimations: true,
    isHighPerformance: true,
    connection: 'unknown'
  })

  // Performance monitoring
  const { markPerformance, measurePerformance } = usePerformanceMonitor('App')
  
  // Resource cleanup
  useResourceCleanup([
    () => wsManager.disconnectAll(),
    () => memoryManager.cleanup(),
    () => cacheManager.clear('temporary')
  ])

  useEffect(() => {
    markPerformance('init-start')
    
    // Detect device capabilities
    const detectCapabilities = () => {
      const capabilities = {
        supportsAnimations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isHighPerformance: navigator.hardwareConcurrency > 2,
        connection: navigator.connection?.effectiveType || 'unknown',
        gpu: 'gpu' in navigator ? 'available' : 'unavailable'
      }
      
      // Disable heavy animations on low-end devices
      if (capabilities.connection === 'slow-2g' || capabilities.connection === '2g') {
        capabilities.supportsAnimations = false
        capabilities.isHighPerformance = false
      }
      
      setDeviceCapabilities(capabilities)
      return capabilities
    }

    // Initialize performance systems
    const initializeApp = async () => {
      try {
        const capabilities = detectCapabilities()
        
        // Initialize cache manager
        await cacheManager.init()
        
        // Initialize asset cache
        await assetCache.initServiceWorker()
        
        // Conditionally initialize WebSocket for collaboration
        if (capabilities.isHighPerformance) {
          wsManager.options.maxConnections = 5
        } else {
          wsManager.options.maxConnections = 2
        }
        
        // Preload critical fonts
        const criticalFonts = [
          '/fonts/inter-variable.woff2',
          '/fonts/jetbrains-mono-variable.woff2'
        ]
        
        await Promise.all([
          // Font loading with timeout
          Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 2000))
          ]),
          
          // Critical asset preloading
          assetCache.cacheAssets(criticalFonts, 7 * 24 * 60 * 60 * 1000) // 1 week
        ])
        
        markPerformance('init-end')
        measurePerformance('init-start', 'init-end')
        
        setIsLoading(false)
        
      } catch (error) {
        console.error('App initialization failed:', error)
        setIsLoading(false)
      }
    }

    initializeApp()

    // Handle visibility changes for performance optimization
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - pause non-critical operations
        wsManager.disconnectAll()
        memoryManager.forceGC()
      } else {
        // Page visible - resume operations
        cacheManager.preloadCriticalData?.()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [markPerformance, measurePerformance])

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Progressive enhancement based on device capabilities
  const shouldShowAnimations = deviceCapabilities.supportsAnimations && deviceCapabilities.isHighPerformance
  const particleCount = deviceCapabilities.isHighPerformance ? 30 : 10
  
  return (
    <ErrorBoundary>
      <Router>
        <div className={`min-h-screen bg-dark-void ${deviceCapabilities.isHighPerformance ? '' : 'performance-mode'}`}>
          {/* Conditional background elements based on device capability */}
          {shouldShowAnimations && (
            <>
              <div className="hex-bg" />
              <div className="matrix-rain" />
              <div className="data-stream" />
              <div className="futuristic-bg" />
              <div className="grid-overlay" />
              <div className="scan-line" />
              
              {/* Optimized particle system */}
              <div className="particle-container">
                {[...Array(particleCount)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle gpu-accelerated" 
                    style={{ 
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 20}s`,
                      animationDuration: `${15 + Math.random() * 10}s`,
                      willChange: 'transform'
                    }} 
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Urgency banner for conversion boost */}
          <UrgencyBanner />
          
          {/* Core navigation - always loaded */}
          <Navigation />
          
          {/* Social proof notifications for conversion boost */}
          <SocialProofNotifications />
          <ActiveUsersIndicator />
          
          {/* Lazy-loaded non-critical components */}
          {deviceCapabilities.isHighPerformance && (
            <Suspense fallback={null}>
              <PurchaseNotifications />
              <ExitIntentOffer />
              <EmailCapturePopup />
              <SimpleLiveChat />
              <NetworkStatus />
              <LivePurchaseNotifications />
              <FreeTrialBanner />
              <ReferralProgramPremium />
              <ROICalculator />
              <OnboardingTour />
            </Suspense>
          )}
          
          {/* Optimized toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(17, 17, 17, 0.9)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)'
              },
            }}
          />
        
          {/* Optimized route loading with different fallbacks */}
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="spinner-optimized" />
            </div>
          }>
            <Routes>
              {/* High-priority routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              
              {/* Medium-priority routes */}
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              
              {/* Lower-priority routes */}
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              
              {/* Auth routes - conditional loading */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes with enhanced loading */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={
                      <div className="p-8">
                        <div className="animate-pulse space-y-4">
                          <div className="h-8 bg-glass-surface rounded w-1/4"></div>
                          <div className="h-64 bg-glass-surface rounded"></div>
                        </div>
                      </div>
                    }>
                      <DashboardPage />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  )
})

App.displayName = 'App'

export default App
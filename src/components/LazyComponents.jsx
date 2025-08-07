import { lazy, Suspense, memo } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import PremiumLoader from './ui/PremiumLoader';
import SkeletonLoader from './ui/SkeletonLoader';

// High-performance lazy loading with preloading strategies
// =======================================================

// Chart components - Heavy libraries (Recharts ~375KB)
const ChartComponents = lazy(() => {
  return import('./charts/ChartComponents').catch(err => {
    console.error('Failed to load chart components:', err);
    return { default: () => <div className="text-red-400">Charts unavailable</div> };
  });
});

// PDF generation - Heavy libraries (jsPDF + html2canvas ~590KB) 
const PDFExporter = lazy(() => {
  return import('./pdf/PDFExporter').catch(err => {
    console.error('Failed to load PDF exporter:', err);
    return { default: () => <div className="text-red-400">PDF export unavailable</div> };
  });
});

// Advanced calculator features - Mathematical libraries
const AdvancedCalculator = lazy(() => {
  return import('./calculator/AdvancedCalculator').catch(err => {
    console.error('Failed to load advanced calculator:', err);
    return { default: () => <div className="text-red-400">Advanced features unavailable</div> };
  });
});

// Collaboration features - WebSocket and real-time components
const CollaborationSuite = lazy(() => {
  return import('./collaboration/CollaborationSuite').catch(err => {
    console.error('Failed to load collaboration features:', err);
    return { default: () => <div className="text-red-400">Collaboration unavailable</div> };
  });
});

// AI-powered insights - OpenAI integration and processing
const AIInsights = lazy(() => {
  return import('./ai/AIInsights').catch(err => {
    console.error('Failed to load AI insights:', err);
    return { default: () => <div className="text-red-400">AI insights unavailable</div> };
  });
});

// Payment processing - Stripe components
const PaymentComponents = lazy(() => {
  return import('./payments/PaymentComponents').catch(err => {
    console.error('Failed to load payment components:', err);
    return { default: () => <div className="text-red-400">Payment features unavailable</div> };
  });
});

// Complex animations and visual effects
const PremiumAnimations = lazy(() => {
  return import('./animations/PremiumAnimations').catch(err => {
    console.error('Failed to load premium animations:', err);
    return { default: ({ children }) => <div>{children}</div> };
  });
});

// Data visualization and reporting
const ReportingDashboard = lazy(() => {
  return import('./reporting/ReportingDashboard').catch(err => {
    console.error('Failed to load reporting dashboard:', err);
    return { default: () => <div className="text-red-400">Reporting unavailable</div> };
  });
});

// Preloading utilities
// ====================
const preloadComponent = (importFunc) => {
  const componentImport = importFunc();
  return componentImport;
};

// Preload strategies based on user interaction patterns
export const preloadStrategies = {
  // Preload on hover for likely interactions
  onHover: (component) => {
    return (props) => (
      <div 
        onMouseEnter={() => preloadComponent(component)}
        onTouchStart={() => preloadComponent(component)}
        {...props}
      />
    );
  },

  // Preload based on intersection observer
  onVisible: (component, rootMargin = '50px') => {
    return (props) => {
      const [ref, inView] = useIntersectionObserver({
        rootMargin,
        triggerOnce: true
      });

      if (inView) {
        preloadComponent(component);
      }

      return <div ref={ref} {...props} />;
    };
  },

  // Preload on idle
  onIdle: (component) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadComponent(component));
    } else {
      setTimeout(() => preloadComponent(component), 100);
    }
  }
};

// High-performance loading components
// ===================================
const ChartSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="h-64 bg-glass-surface rounded-xl mb-4"></div>
    <div className="h-4 bg-glass-surface rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-glass-surface rounded w-1/2"></div>
  </div>
));

const CalculatorSkeleton = memo(() => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-12 bg-glass-surface rounded-xl"></div>
      ))}
    </div>
    <div className="h-16 bg-glass-surface rounded-xl"></div>
  </div>
));

const DashboardSkeleton = memo(() => (
  <div className="grid grid-cols-3 gap-6 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-32 bg-glass-surface rounded-xl"></div>
    ))}
  </div>
));

// Optimized Suspense wrappers
// ============================
const createLazyWrapper = (LazyComponent, fallback, errorFallback) => {
  const LazyWrapper = memo((props) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  ));
  
  LazyWrapper.displayName = `LazyWrapper(${LazyComponent.displayName || 'Component'})`;
  LazyWrapper.preload = () => preloadComponent(() => LazyComponent);
  
  return LazyWrapper;
};

// Exported lazy components with optimized loading
// ===============================================

export const LazyCharts = createLazyWrapper(
  ChartComponents,
  <ChartSkeleton />,
  <div className="p-4 text-center text-red-400">
    Charts could not be loaded. Please refresh the page.
  </div>
);

export const LazyPDFExporter = createLazyWrapper(
  PDFExporter,
  <PremiumLoader message="Loading PDF generator..." />,
  <div className="p-4 text-center text-red-400">
    PDF export is temporarily unavailable.
  </div>
);

export const LazyAdvancedCalculator = createLazyWrapper(
  AdvancedCalculator,
  <CalculatorSkeleton />,
  <div className="p-4 text-center text-red-400">
    Advanced calculator features are unavailable.
  </div>
);

export const LazyCollaboration = createLazyWrapper(
  CollaborationSuite,
  <PremiumLoader message="Connecting collaboration features..." />,
  <div className="p-4 text-center text-red-400">
    Real-time collaboration is temporarily unavailable.
  </div>
);

export const LazyAIInsights = createLazyWrapper(
  AIInsights,
  <PremiumLoader message="Loading AI insights..." />,
  <div className="p-4 text-center text-red-400">
    AI insights are temporarily unavailable.
  </div>
);

export const LazyPayments = createLazyWrapper(
  PaymentComponents,
  <PremiumLoader message="Loading payment options..." />,
  <div className="p-4 text-center text-red-400">
    Payment processing is temporarily unavailable.
  </div>
);

export const LazyAnimations = createLazyWrapper(
  PremiumAnimations,
  <div className="opacity-50">{/* Content will be wrapped */}</div>,
  ({ children }) => <div>{children}</div> // Graceful degradation
);

export const LazyReporting = createLazyWrapper(
  ReportingDashboard,
  <DashboardSkeleton />,
  <div className="p-4 text-center text-red-400">
    Reporting dashboard is temporarily unavailable.
  </div>
);

// Bundle optimization utilities
// =============================

// Critical component detector
export const isCritical = (componentName) => {
  const criticalComponents = [
    'Calculator',
    'Navigation',
    'GlassCard',
    'Button',
    'LoadingScreen'
  ];
  
  return criticalComponents.includes(componentName);
};

// Performance monitoring for lazy components
export const withPerformanceTracking = (LazyComponent, componentName) => {
  return memo((props) => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // Track performance metrics
      if ('gtag' in window) {
        gtag('event', 'lazy_component_load', {
          event_category: 'Performance',
          event_label: componentName,
          value: Math.round(loadTime)
        });
      }
      
      console.log(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    };
    
    return (
      <Suspense 
        fallback={<PremiumLoader message={`Loading ${componentName}...`} />}
      >
        <LazyComponent 
          {...props} 
          onLoad={handleLoad}
        />
      </Suspense>
    );
  });
};

// Progressive loading manager
export class ProgressiveLoader {
  constructor() {
    this.loadQueue = [];
    this.loading = false;
    this.loaded = new Set();
  }
  
  // Add component to load queue
  queue(component, priority = 'normal') {
    if (this.loaded.has(component)) return;
    
    this.loadQueue.push({ component, priority });
    this.loadQueue.sort((a, b) => {
      const priorities = { high: 3, normal: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
    
    this.processQueue();
  }
  
  // Process load queue with rate limiting
  async processQueue() {
    if (this.loading || this.loadQueue.length === 0) return;
    
    this.loading = true;
    
    while (this.loadQueue.length > 0) {
      const { component } = this.loadQueue.shift();
      
      try {
        await preloadComponent(component);
        this.loaded.add(component);
        
        // Rate limit to prevent overwhelming the main thread
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error('Failed to preload component:', error);
      }
    }
    
    this.loading = false;
  }
  
  // Check if component is loaded
  isLoaded(component) {
    return this.loaded.has(component);
  }
}

// Global progressive loader instance
export const progressiveLoader = new ProgressiveLoader();

// Auto-preload based on route
export const autoPreloadByRoute = (route) => {
  const routeComponents = {
    '/calculator': [LazyCharts, LazyAdvancedCalculator],
    '/pricing': [LazyPayments],
    '/dashboard': [LazyReporting, LazyCharts],
    '/features': [LazyAnimations],
    '/collaboration': [LazyCollaboration]
  };
  
  const components = routeComponents[route] || [];
  components.forEach(component => {
    progressiveLoader.queue(component, 'normal');
  });
};

// Performance-aware component loading
export const loadComponentWhenOptimal = async (component) => {
  // Check if device has sufficient resources
  if ('connection' in navigator) {
    const connection = navigator.connection;
    
    // Avoid loading heavy components on slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      console.log('Skipping component load due to slow connection');
      return null;
    }
  }
  
  // Check if main thread is available
  if ('requestIdleCallback' in window) {
    return new Promise((resolve) => {
      requestIdleCallback(async () => {
        try {
          const loaded = await preloadComponent(component);
          resolve(loaded);
        } catch (error) {
          console.error('Component loading failed:', error);
          resolve(null);
        }
      });
    });
  }
  
  // Fallback for browsers without requestIdleCallback
  return preloadComponent(component);
};
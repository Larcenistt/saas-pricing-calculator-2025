module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173',
        'http://localhost:5173/calculator',
        'http://localhost:5173/pricing',
        'http://localhost:5173/dashboard',
      ],
      startServerCommand: 'npm run dev',
      startServerTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // Emulate premium device for accurate performance testing
        emulatedFormFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance thresholds for premium user experience
        'categories:performance': ['error', { minScore: 0.9 }], // 90+ performance score
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95+ accessibility
        'categories:best-practices': ['error', { minScore: 0.9 }], // 90+ best practices
        'categories:seo': ['warn', { minScore: 0.8 }], // 80+ SEO
        
        // Core Web Vitals - Premium thresholds
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 1500 }], // 1.5s
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'metrics:first-input-delay': ['error', { maxNumericValue: 100 }], // 100ms
        
        // Additional performance metrics
        'metrics:speed-index': ['warn', { maxNumericValue: 3000 }], // 3s
        'metrics:interactive': ['warn', { maxNumericValue: 4000 }], // 4s
        'metrics:total-blocking-time': ['warn', { maxNumericValue: 200 }], // 200ms
        
        // Resource optimization
        'audits:uses-optimized-images': 'error',
        'audits:modern-image-formats': 'warn',
        'audits:unused-css-rules': 'warn',
        'audits:unused-javascript': 'warn',
        'audits:render-blocking-resources': 'warn',
        'audits:unminified-css': 'error',
        'audits:unminified-javascript': 'error',
        
        // Premium user experience audits
        'audits:color-contrast': 'error',
        'audits:tap-targets': 'error',
        'audits:viewport': 'error',
        'audits:font-display': 'warn',
        'audits:uses-responsive-images': 'warn',
        
        // Security and best practices
        'audits:uses-https': 'error',
        'audits:redirects-http': 'error',
        'audits:vulnerabilities': 'error',
        'audits:is-on-https': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        storagePath: './lighthouse-reports',
      },
    },
  },
  
  // Custom audit configurations
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      // Performance audits
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'interactive',
      'cumulative-layout-shift',
      'total-blocking-time',
      
      // Resource audits
      'uses-optimized-images',
      'modern-image-formats',
      'unused-css-rules',
      'unused-javascript',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      
      // User experience audits
      'color-contrast',
      'tap-targets',
      'viewport',
      'font-display',
      'uses-responsive-images',
      
      // Security audits
      'uses-https',
      'redirects-http',
      'vulnerabilities',
      
      // Premium feature audits
      'user-timings',
      'critical-request-chains',
      'main-thread-tasks',
      'metrics',
    ],
    
    // Skip audits that don't apply to SPA
    skipAudits: [
      'canonical',
      'robots-txt',
      'structured-data',
    ],
  },
  
  // Custom gatherer for SaaS-specific metrics
  artifacts: [
    {
      id: 'SaaSMetrics',
      gatherer: {
        beforePass() {
          // Set up custom performance markers
          return `
            window.saasMetrics = {
              calculationStart: null,
              calculationEnd: null,
              aiInsightsStart: null,
              aiInsightsEnd: null,
              exportStart: null,
              exportEnd: null,
              collaborationLatency: [],
            };
            
            // Override console to capture timing
            const originalLog = console.log;
            console.log = function(...args) {
              if (args[0] && args[0].includes('TIMING:')) {
                const metric = args[0].split('TIMING: ')[1];
                window.saasMetrics[metric] = performance.now();
              }
              return originalLog.apply(console, args);
            };
          `;
        },
        
        afterPass() {
          return `window.saasMetrics`;
        },
      },
    },
  ],
  
  // Custom audits for premium features
  audits: [
    {
      id: 'calculator-performance',
      title: 'Calculator Performance',
      description: 'Measures time to complete pricing calculations',
      requiredArtifacts: ['SaaSMetrics'],
      scoreDisplayMode: 'numeric',
      audit: (artifacts) => {
        const metrics = artifacts.SaaSMetrics;
        const calculationTime = metrics.calculationEnd - metrics.calculationStart;
        
        // Premium threshold: calculations should complete under 2s
        const score = calculationTime < 2000 ? 1 : calculationTime < 5000 ? 0.5 : 0;
        
        return {
          score,
          numericValue: calculationTime,
          numericUnit: 'millisecond',
          displayValue: `${Math.round(calculationTime)}ms`,
          details: {
            type: 'table',
            headings: [
              { key: 'metric', itemType: 'text', text: 'Metric' },
              { key: 'value', itemType: 'numeric', text: 'Value (ms)' },
            ],
            items: [
              { metric: 'Calculation Time', value: calculationTime },
              { metric: 'AI Insights Time', value: metrics.aiInsightsEnd - metrics.aiInsightsStart },
              { metric: 'Export Time', value: metrics.exportEnd - metrics.exportStart },
            ],
          },
        };
      },
    },
    
    {
      id: 'premium-animations',
      title: 'Animation Performance',
      description: 'Ensures smooth 60fps animations for premium experience',
      requiredArtifacts: ['traces'],
      audit: (artifacts) => {
        const trace = artifacts.traces.defaultPass;
        const animationFrames = trace.traceEvents.filter(e => 
          e.name === 'Animation' || e.name === 'RequestAnimationFrame'
        );
        
        // Analyze frame timing consistency
        const frameTimes = animationFrames.map(frame => frame.dur || 0);
        const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const targetFrameTime = 16.67; // 60fps = ~16.67ms per frame
        
        const score = averageFrameTime <= targetFrameTime ? 1 : 
                     averageFrameTime <= 33.33 ? 0.5 : 0; // 30fps threshold
        
        return {
          score,
          numericValue: averageFrameTime,
          numericUnit: 'millisecond',
          displayValue: `${Math.round(averageFrameTime)}ms avg`,
        };
      },
    },
    
    {
      id: 'collaboration-readiness',
      title: 'Real-time Collaboration Readiness',
      description: 'Checks WebSocket performance and real-time features',
      requiredArtifacts: ['NetworkRecords'],
      audit: (artifacts) => {
        const networkRecords = artifacts.NetworkRecords;
        const websocketConnections = networkRecords.filter(record => 
          record.protocol === 'websocket' || record.url.includes('socket.io')
        );
        
        const hasWebSocketSupport = websocketConnections.length > 0;
        const connectionTime = hasWebSocketSupport ? 
          websocketConnections[0].networkRequestTime : Infinity;
        
        // Premium threshold: WebSocket should connect under 500ms
        const score = hasWebSocketSupport && connectionTime < 500 ? 1 : 0.5;
        
        return {
          score,
          numericValue: connectionTime,
          numericUnit: 'millisecond',
          displayValue: hasWebSocketSupport ? 
            `Connected in ${Math.round(connectionTime)}ms` : 'Not detected',
          details: {
            type: 'table',
            headings: [
              { key: 'feature', itemType: 'text', text: 'Feature' },
              { key: 'status', itemType: 'text', text: 'Status' },
            ],
            items: [
              { feature: 'WebSocket Support', status: hasWebSocketSupport ? 'Available' : 'Missing' },
              { feature: 'Connection Time', status: `${Math.round(connectionTime)}ms` },
            ],
          },
        };
      },
    },
  ],
  
  // Custom categories for premium SaaS features
  categories: {
    'saas-performance': {
      title: 'SaaS Performance',
      description: 'Performance metrics specific to SaaS pricing calculator',
      auditRefs: [
        { id: 'calculator-performance', weight: 3 },
        { id: 'premium-animations', weight: 2 },
        { id: 'collaboration-readiness', weight: 1 },
        { id: 'first-contentful-paint', weight: 2 },
        { id: 'largest-contentful-paint', weight: 2 },
      ],
    },
  },
};
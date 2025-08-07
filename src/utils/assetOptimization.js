// Advanced Asset Optimization Utilities
// =====================================

/**
 * Progressive image loading with modern format support
 */
export class ProgressiveImageLoader {
  constructor() {
    this.cache = new Map();
    this.observers = new Map();
    this.loadQueue = [];
    this.isProcessing = false;
  }

  /**
   * Load image with progressive enhancement
   * @param {string} src - Image source URL
   * @param {Object} options - Loading options
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImage(src, options = {}) {
    const {
      quality = 'auto',
      format = 'auto',
      sizes = '',
      priority = 'normal',
      placeholder = true,
      fallback = true
    } = options;

    // Check cache first
    const cacheKey = `${src}-${quality}-${format}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Generate optimized URLs
    const optimizedUrls = this.generateOptimizedUrls(src, { quality, format, sizes });
    
    // Load with progressive enhancement
    const imagePromise = this.loadWithFallbacks(optimizedUrls, { placeholder, fallback });
    
    // Cache the promise
    this.cache.set(cacheKey, imagePromise);
    
    return imagePromise;
  }

  /**
   * Generate optimized image URLs
   * @param {string} src - Original source
   * @param {Object} options - Optimization options
   * @returns {Array} Array of optimized URLs
   */
  generateOptimizedUrls(src, options) {
    const { quality, format, sizes } = options;
    const urls = [];

    // Modern formats (WebP, AVIF)
    if (format === 'auto' || format === 'webp') {
      if (this.supportsFormat('webp')) {
        urls.push(this.buildOptimizedUrl(src, 'webp', quality, sizes));
      }
    }

    if (format === 'auto' || format === 'avif') {
      if (this.supportsFormat('avif')) {
        urls.push(this.buildOptimizedUrl(src, 'avif', quality, sizes));
      }
    }

    // Fallback to original or JPEG
    urls.push(src);

    return urls;
  }

  /**
   * Build optimized URL (example for CDN integration)
   * @param {string} src - Source URL
   * @param {string} format - Target format
   * @param {string} quality - Quality setting
   * @param {string} sizes - Size specifications
   * @returns {string} Optimized URL
   */
  buildOptimizedUrl(src, format, quality, sizes) {
    // Example CDN URL structure (adjust for your CDN)
    const params = new URLSearchParams();
    
    if (format !== 'auto') params.set('format', format);
    if (quality !== 'auto') params.set('quality', quality);
    if (sizes) params.set('w', sizes);
    
    // Auto-optimization flags
    params.set('auto', 'compress,format');
    
    return `${src}?${params.toString()}`;
  }

  /**
   * Load image with fallback strategy
   * @param {Array} urls - Array of URLs to try
   * @param {Object} options - Loading options
   * @returns {Promise<HTMLImageElement>}
   */
  async loadWithFallbacks(urls, options) {
    const { placeholder, fallback } = options;
    
    for (let i = 0; i < urls.length; i++) {
      try {
        const img = await this.loadSingleImage(urls[i]);
        
        // Preload next format for future use
        if (i === 0 && urls.length > 1) {
          this.preloadImage(urls[1]);
        }
        
        return img;
      } catch (error) {
        console.warn(`Failed to load image format ${i + 1}:`, urls[i], error);
        
        // If this is the last URL and we have a fallback
        if (i === urls.length - 1 && fallback) {
          return this.createPlaceholderImage();
        }
      }
    }
    
    throw new Error('All image formats failed to load');
  }

  /**
   * Load a single image
   * @param {string} src - Image source
   * @returns {Promise<HTMLImageElement>}
   */
  loadSingleImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = reject;
      
      // Add loading optimizations
      img.loading = 'lazy';
      img.decoding = 'async';
      
      img.src = src;
    });
  }

  /**
   * Preload image for future use
   * @param {string} src - Image source
   */
  preloadImage(src) {
    if (this.cache.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    document.head.appendChild(link);
  }

  /**
   * Create placeholder image
   * @returns {HTMLImageElement}
   */
  createPlaceholderImage() {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif">
          Image unavailable
        </text>
      </svg>
    `);
    return img;
  }

  /**
   * Check browser format support
   * @param {string} format - Format to check
   * @returns {boolean}
   */
  supportsFormat(format) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      switch (format) {
        case 'webp':
          return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
        case 'avif':
          return canvas.toDataURL('image/avif').indexOf('image/avif') === 5;
        case 'jpeg2000':
          return canvas.toDataURL('image/jp2').indexOf('image/jp2') === 5;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Clear cache to prevent memory leaks
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Responsive image component utility
 */
export const createResponsiveImageSets = (baseSrc, options = {}) => {
  const {
    breakpoints = [480, 768, 1024, 1200, 1920],
    quality = 85,
    format = 'auto'
  } = options;

  const srcSet = breakpoints
    .map(width => {
      const optimizedUrl = buildOptimizedUrl(baseSrc, format, quality, width);
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');

  const sizes = breakpoints
    .map((width, index) => {
      if (index === breakpoints.length - 1) {
        return `${width}px`;
      }
      return `(max-width: ${width}px) ${width}px`;
    })
    .reverse()
    .join(', ');

  return { srcSet, sizes };
};

/**
 * Font optimization utilities
 */
export class FontOptimizer {
  constructor() {
    this.loadedFonts = new Set();
    this.fontDisplayStrategies = {
      critical: 'swap',
      important: 'fallback',
      optional: 'optional'
    };
  }

  /**
   * Preload critical fonts
   * @param {Array} fonts - Array of font configurations
   */
  preloadFonts(fonts) {
    fonts.forEach(font => {
      if (this.loadedFonts.has(font.family)) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font.src;
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
      this.loadedFonts.add(font.family);
    });
  }

  /**
   * Generate optimized font CSS
   * @param {Object} fontConfig - Font configuration
   * @returns {string} CSS string
   */
  generateFontCSS(fontConfig) {
    const {
      family,
      src,
      weight = '400',
      style = 'normal',
      display = 'swap',
      unicodeRange
    } = fontConfig;

    return `
      @font-face {
        font-family: '${family}';
        src: url('${src}.woff2') format('woff2'),
             url('${src}.woff') format('woff');
        font-weight: ${weight};
        font-style: ${style};
        font-display: ${display};
        ${unicodeRange ? `unicode-range: ${unicodeRange};` : ''}
      }
    `;
  }

  /**
   * Optimize font loading with font-display strategies
   * @param {string} priority - Priority level
   * @returns {string} Font display value
   */
  getFontDisplay(priority) {
    return this.fontDisplayStrategies[priority] || 'swap';
  }
}

/**
 * Asset caching and service worker utilities
 */
export class AssetCache {
  constructor() {
    this.cacheName = 'wealthflow-assets-v1';
    this.cacheableTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',
      'font/woff2',
      'font/woff',
      'application/font-woff2',
      'text/css',
      'application/javascript'
    ];
  }

  /**
   * Initialize service worker for asset caching
   */
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('Service worker update found');
        });
        
        return registration;
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  /**
   * Cache assets with expiration
   * @param {Array} assets - Array of asset URLs
   * @param {number} maxAge - Max age in milliseconds
   */
  async cacheAssets(assets, maxAge = 24 * 60 * 60 * 1000) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        
        // Add expiration metadata
        const assetsWithExpiry = assets.map(url => ({
          url,
          expires: Date.now() + maxAge
        }));
        
        await cache.addAll(assets);
        
        // Store expiration data
        localStorage.setItem(
          `${this.cacheName}-expiry`,
          JSON.stringify(assetsWithExpiry)
        );
        
        console.log(`Cached ${assets.length} assets`);
      } catch (error) {
        console.error('Asset caching failed:', error);
      }
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache() {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const expiryData = JSON.parse(
          localStorage.getItem(`${this.cacheName}-expiry`) || '[]'
        );
        
        const now = Date.now();
        const expiredUrls = expiryData
          .filter(item => item.expires < now)
          .map(item => item.url);
        
        // Delete expired entries
        await Promise.all(
          expiredUrls.map(url => cache.delete(url))
        );
        
        // Update expiry data
        const validEntries = expiryData.filter(item => item.expires >= now);
        localStorage.setItem(
          `${this.cacheName}-expiry`,
          JSON.stringify(validEntries)
        );
        
        console.log(`Cleaned ${expiredUrls.length} expired cache entries`);
      } catch (error) {
        console.error('Cache cleaning failed:', error);
      }
    }
  }
}

/**
 * Resource loading prioritization
 */
export class ResourcePrioritizer {
  constructor() {
    this.priorities = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
      idle: 4
    };
    
    this.loadQueue = [];
    this.isLoading = false;
  }

  /**
   * Add resource to load queue
   * @param {string} url - Resource URL
   * @param {string} priority - Priority level
   * @param {string} type - Resource type
   */
  queueResource(url, priority = 'normal', type = 'image') {
    this.loadQueue.push({
      url,
      priority: this.priorities[priority] || this.priorities.normal,
      type,
      timestamp: Date.now()
    });
    
    // Sort by priority
    this.loadQueue.sort((a, b) => a.priority - b.priority);
    
    this.processQueue();
  }

  /**
   * Process resource loading queue
   */
  async processQueue() {
    if (this.isLoading || this.loadQueue.length === 0) return;
    
    this.isLoading = true;
    
    while (this.loadQueue.length > 0) {
      const resource = this.loadQueue.shift();
      
      try {
        await this.loadResource(resource);
        
        // Rate limiting to prevent overwhelming the browser
        if (resource.priority > this.priorities.high) {
          await this.delay(50);
        }
      } catch (error) {
        console.error('Resource loading failed:', resource.url, error);
      }
    }
    
    this.isLoading = false;
  }

  /**
   * Load individual resource
   * @param {Object} resource - Resource configuration
   */
  async loadResource(resource) {
    const { url, type } = resource;
    
    switch (type) {
      case 'image':
        return this.loadImage(url);
      case 'font':
        return this.loadFont(url);
      case 'script':
        return this.loadScript(url);
      case 'style':
        return this.loadStylesheet(url);
      default:
        return fetch(url);
    }
  }

  /**
   * Load image resource
   * @param {string} url - Image URL
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Load font resource
   * @param {string} url - Font URL
   */
  async loadFont(url) {
    if ('fonts' in document) {
      try {
        await document.fonts.load(`16px ${url}`);
        return true;
      } catch {
        // Fallback to CSS loading
        return this.loadStylesheet(url);
      }
    }
    return this.loadStylesheet(url);
  }

  /**
   * Load script resource
   * @param {string} url - Script URL
   */
  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = resolve;
      script.onerror = reject;
      script.src = url;
      script.async = true;
      document.head.appendChild(script);
    });
  }

  /**
   * Load stylesheet resource
   * @param {string} url - Stylesheet URL
   */
  loadStylesheet(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.onload = resolve;
      link.onerror = reject;
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Utility delay function
   * @param {number} ms - Delay in milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global instances
export const imageLoader = new ProgressiveImageLoader();
export const fontOptimizer = new FontOptimizer();
export const assetCache = new AssetCache();
export const resourcePrioritizer = new ResourcePrioritizer();

// Initialize on load
if (typeof window !== 'undefined') {
  // Clean expired cache on startup
  assetCache.cleanExpiredCache();
  
  // Initialize service worker
  assetCache.initServiceWorker();
  
  // Preload critical fonts
  const criticalFonts = [
    { family: 'Inter', src: '/fonts/inter-variable' },
    { family: 'JetBrains Mono', src: '/fonts/jetbrains-mono' }
  ];
  fontOptimizer.preloadFonts(criticalFonts);
}
// WealthFlow Service Worker - Advanced Caching and Performance
// ===========================================================

const CACHE_NAME = 'wealthflow-v1';
const CACHE_VERSION = '1.0.0';
const MAX_CACHE_SIZE = 50; // Maximum number of entries per cache

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first', 
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resource categorization and caching strategies
const RESOURCE_PATTERNS = [
  // Static assets - Cache first with long TTL
  {
    pattern: /\.(js|css|woff2?|png|jpg|jpeg|gif|webp|avif|svg|ico)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: `${CACHE_NAME}-static`,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  
  // API responses - Network first with fallback
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: `${CACHE_NAME}-api`,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  
  // HTML pages - Stale while revalidate
  {
    pattern: /\.html$|\/$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: `${CACHE_NAME}-pages`,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 20
  },
  
  // Fonts - Cache first with very long TTL
  {
    pattern: /\.(woff2?|ttf|otf|eot)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: `${CACHE_NAME}-fonts`,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 30
  },
  
  // Images - Cache first with optimization
  {
    pattern: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: `${CACHE_NAME}-images`,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200
  }
];

// Default fallback strategy
const DEFAULT_STRATEGY = {
  strategy: CACHE_STRATEGIES.NETWORK_FIRST,
  cacheName: `${CACHE_NAME}-default`,
  maxAge: 60 * 60 * 1000, // 1 hour
  maxEntries: MAX_CACHE_SIZE
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker version ${CACHE_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      precacheResources(),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker version ${CACHE_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Claim all clients
      self.clients.claim(),
      // Initialize performance monitoring
      initializePerformanceMonitoring()
    ])
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return;
  
  // Get appropriate strategy for this request
  const strategy = getStrategyForRequest(request);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

/**
 * Message Handler for cache management
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls, payload.cacheName));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearSpecificCache(payload.cacheName));
      break;
      
    case 'GET_CACHE_STATS':
      event.waitUntil(
        getCacheStats().then(stats => {
          event.ports[0]?.postMessage({ type: 'CACHE_STATS', payload: stats });
        })
      );
      break;
      
    case 'PREFETCH_RESOURCES':
      event.waitUntil(prefetchResources(payload.urls));
      break;
      
    default:
      console.warn(`[SW] Unknown message type: ${type}`);
  }
});

/**
 * Pre-cache critical resources
 */
async function precacheResources() {
  try {
    const cache = await caches.open(`${CACHE_NAME}-precache`);
    const criticalResources = [
      '/',
      '/manifest.json',
      // Add other critical resources as needed
    ];
    
    console.log('[SW] Pre-caching critical resources');
    await cache.addAll(criticalResources);
  } catch (error) {
    console.error('[SW] Pre-cache failed:', error);
  }
}

/**
 * Clean up old cache versions
 */
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('wealthflow-') && !name.includes(CACHE_VERSION)
    );
    
    console.log(`[SW] Cleaning up ${oldCaches.length} old caches`);
    await Promise.all(oldCaches.map(name => caches.delete(name)));
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

/**
 * Initialize performance monitoring
 */
async function initializePerformanceMonitoring() {
  // Set up periodic cache cleanup
  setInterval(async () => {
    await performCacheCleanup();
  }, 60 * 60 * 1000); // Every hour
  
  console.log('[SW] Performance monitoring initialized');
}

/**
 * Get caching strategy for a request
 */
function getStrategyForRequest(request) {
  const url = new URL(request.url);
  
  // Find matching pattern
  for (const pattern of RESOURCE_PATTERNS) {
    if (pattern.pattern.test(url.pathname) || pattern.pattern.test(request.url)) {
      return pattern;
    }
  }
  
  return DEFAULT_STRATEGY;
}

/**
 * Handle request based on strategy
 */
async function handleRequest(request, strategy) {
  switch (strategy.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, strategy);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, strategy);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, strategy);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, strategy);
      
    default:
      return networkFirst(request, strategy);
  }
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request, strategy) {
  try {
    const cache = await caches.open(strategy.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if response is still fresh
      const responseTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0);
      const isExpired = Date.now() - responseTime.getTime() > strategy.maxAge;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone(), strategy);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn(`[SW] Cache first failed for ${request.url}:`, error);
    
    // Fallback to cache even if expired
    const cache = await caches.open(strategy.cacheName);
    const fallbackResponse = await cache.match(request);
    
    if (fallbackResponse) {
      return fallbackResponse;
    }
    
    throw error;
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request, strategy) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(strategy.cacheName);
      await cacheResponse(cache, request, networkResponse.clone(), strategy);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn(`[SW] Network first failed for ${request.url}:`, error);
    
    // Fallback to cache
    const cache = await caches.open(strategy.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  
  // Get cached response immediately
  const cachedResponsePromise = cache.match(request);
  
  // Start network request in background
  const networkResponsePromise = fetch(request).then(async (response) => {
    if (response.ok) {
      await cacheResponse(cache, request, response.clone(), strategy);
    }
    return response;
  }).catch(error => {
    console.warn(`[SW] Background revalidation failed for ${request.url}:`, error);
    return null;
  });
  
  const cachedResponse = await cachedResponsePromise;
  
  if (cachedResponse) {
    // Return cached response immediately, network response will update cache in background
    return cachedResponse;
  }
  
  // No cached response, wait for network
  const networkResponse = await networkResponsePromise;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  throw new Error('Both cache and network failed');
}

/**
 * Network Only Strategy
 */
async function networkOnly(request) {
  return fetch(request);
}

/**
 * Cache Only Strategy
 */
async function cacheOnly(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  throw new Error('No cached response available');
}

/**
 * Cache response with metadata
 */
async function cacheResponse(cache, request, response, strategy) {
  try {
    // Add caching metadata
    const responseToCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'sw-cached-time': new Date().toISOString(),
        'sw-cache-strategy': strategy.strategy,
        'sw-max-age': strategy.maxAge.toString()
      }
    });
    
    await cache.put(request, responseToCache);
    
    // Enforce cache size limits
    await enforceCacheLimit(cache, strategy.maxEntries);
    
  } catch (error) {
    console.warn(`[SW] Failed to cache response for ${request.url}:`, error);
  }
}

/**
 * Enforce cache size limits using LRU
 */
async function enforceCacheLimit(cache, maxEntries) {
  try {
    const requests = await cache.keys();
    
    if (requests.length <= maxEntries) return;
    
    // Sort by cache time (oldest first)
    const requestsWithTime = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const cacheTime = new Date(response?.headers.get('sw-cached-time') || 0);
        return { request, cacheTime };
      })
    );
    
    requestsWithTime.sort((a, b) => a.cacheTime - b.cacheTime);
    
    // Remove oldest entries
    const toRemove = requestsWithTime.slice(0, requests.length - maxEntries);
    await Promise.all(
      toRemove.map(({ request }) => cache.delete(request))
    );
    
  } catch (error) {
    console.warn('[SW] Cache limit enforcement failed:', error);
  }
}

/**
 * Perform periodic cache cleanup
 */
async function performCacheCleanup() {
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      if (!cacheName.startsWith('wealthflow-')) continue;
      
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        const cacheTime = new Date(response?.headers.get('sw-cached-time') || 0);
        const maxAge = parseInt(response?.headers.get('sw-max-age') || '0');
        
        if (Date.now() - cacheTime.getTime() > maxAge) {
          await cache.delete(request);
        }
      }
    }
    
    console.log('[SW] Cache cleanup completed');
    
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls, cacheName) {
  try {
    const cache = await caches.open(cacheName || `${CACHE_NAME}-manual`);
    await Promise.all(
      urls.map(url => 
        fetch(url).then(response => {
          if (response.ok) {
            return cache.put(url, response);
          }
        }).catch(error => {
          console.warn(`[SW] Failed to cache ${url}:`, error);
        })
      )
    );
    
    console.log(`[SW] Cached ${urls.length} URLs`);
    
  } catch (error) {
    console.error('[SW] URL caching failed:', error);
  }
}

/**
 * Clear specific cache
 */
async function clearSpecificCache(cacheName) {
  try {
    const deleted = await caches.delete(cacheName);
    console.log(`[SW] Cache ${cacheName} ${deleted ? 'cleared' : 'not found'}`);
  } catch (error) {
    console.error(`[SW] Failed to clear cache ${cacheName}:`, error);
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
      if (!cacheName.startsWith('wealthflow-')) continue;
      
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      let totalSize = 0;
      let expiredCount = 0;
      
      for (const request of requests) {
        const response = await cache.match(request);
        const cacheTime = new Date(response?.headers.get('sw-cached-time') || 0);
        const maxAge = parseInt(response?.headers.get('sw-max-age') || '0');
        
        if (Date.now() - cacheTime.getTime() > maxAge) {
          expiredCount++;
        }
        
        // Estimate response size
        const text = await response.clone().text();
        totalSize += text.length;
      }
      
      stats[cacheName] = {
        entries: requests.length,
        estimatedSize: totalSize,
        expiredEntries: expiredCount,
        hitRate: 0 // Would need to track hits/misses for real implementation
      };
    }
    
    return stats;
    
  } catch (error) {
    console.error('[SW] Failed to get cache stats:', error);
    return {};
  }
}

/**
 * Prefetch resources for better performance
 */
async function prefetchResources(urls) {
  try {
    const cache = await caches.open(`${CACHE_NAME}-prefetch`);
    
    // Prefetch with low priority to avoid interfering with critical requests
    const prefetchPromises = urls.map(url => 
      fetch(url, { priority: 'low' })
        .then(response => {
          if (response.ok) {
            return cache.put(url, response);
          }
        })
        .catch(error => {
          console.warn(`[SW] Prefetch failed for ${url}:`, error);
        })
    );
    
    await Promise.all(prefetchPromises);
    console.log(`[SW] Prefetched ${urls.length} resources`);
    
  } catch (error) {
    console.error('[SW] Resource prefetching failed:', error);
  }
}

// Error handling for uncaught errors
self.addEventListener('error', (event) => {
  console.error('[SW] Uncaught error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
  event.preventDefault();
});

console.log(`[SW] WealthFlow Service Worker ${CACHE_VERSION} initialized`);
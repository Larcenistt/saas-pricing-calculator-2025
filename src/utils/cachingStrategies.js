// Advanced Caching Strategies for SaaS Pricing Calculator
// ========================================================

/**
 * Multi-layer caching system with intelligent invalidation
 */
export class CacheManager {
  constructor() {
    this.layers = {
      memory: new Map(),
      sessionStorage: new SessionStorageCache(),
      localStorage: new LocalStorageCache(),
      indexedDB: new IndexedDBCache(),
      serviceWorker: new ServiceWorkerCache()
    };
    
    this.policies = {
      calculations: { ttl: 30 * 60 * 1000, layer: 'localStorage' }, // 30 minutes
      apiResponses: { ttl: 5 * 60 * 1000, layer: 'memory' }, // 5 minutes
      userPreferences: { ttl: 7 * 24 * 60 * 60 * 1000, layer: 'localStorage' }, // 1 week
      staticAssets: { ttl: 24 * 60 * 60 * 1000, layer: 'serviceWorker' }, // 1 day
      collaborationData: { ttl: 10 * 60 * 1000, layer: 'sessionStorage' }, // 10 minutes
      chartData: { ttl: 15 * 60 * 1000, layer: 'indexedDB' }, // 15 minutes
      aiInsights: { ttl: 60 * 60 * 1000, layer: 'localStorage' } // 1 hour
    };
    
    this.init();
  }

  async init() {
    // Initialize IndexedDB
    await this.layers.indexedDB.init();
    
    // Set up cache cleanup intervals
    this.setupCleanupIntervals();
    
    // Handle page visibility changes
    this.handleVisibilityChanges();
  }

  /**
   * Get data from appropriate cache layer
   * @param {string} key - Cache key
   * @param {string} category - Data category for policy lookup
   * @returns {Promise<any>} Cached data or null
   */
  async get(key, category = 'default') {
    const policy = this.policies[category] || { layer: 'memory', ttl: 5 * 60 * 1000 };
    const layer = this.layers[policy.layer];
    
    try {
      const cached = await layer.get(key);
      
      if (!cached) return null;
      
      // Check if expired
      if (Date.now() - cached.timestamp > policy.ttl) {
        await layer.delete(key);
        return null;
      }
      
      // Update access time for LRU
      cached.lastAccess = Date.now();
      await layer.set(key, cached);
      
      return cached.data;
    } catch (error) {
      console.error(`Cache get failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in appropriate cache layer
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} category - Data category for policy lookup
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, category = 'default') {
    const policy = this.policies[category] || { layer: 'memory', ttl: 5 * 60 * 1000 };
    const layer = this.layers[policy.layer];
    
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      category,
      size: this.estimateSize(data)
    };
    
    try {
      await layer.set(key, cacheEntry);
      return true;
    } catch (error) {
      console.error(`Cache set failed for key ${key}:`, error);
      
      // Try fallback layer
      if (policy.layer !== 'memory') {
        try {
          await this.layers.memory.set(key, cacheEntry);
          return true;
        } catch (fallbackError) {
          console.error(`Cache fallback failed for key ${key}:`, fallbackError);
        }
      }
      
      return false;
    }
  }

  /**
   * Delete data from cache
   * @param {string} key - Cache key
   * @param {string} category - Data category
   * @returns {Promise<boolean>} Success status
   */
  async delete(key, category = 'default') {
    const policy = this.policies[category] || { layer: 'memory' };
    const layer = this.layers[policy.layer];
    
    try {
      return await layer.delete(key);
    } catch (error) {
      console.error(`Cache delete failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   * @param {string} category - Optional category filter
   * @returns {Promise<number>} Number of deleted entries
   */
  async invalidate(pattern, category = null) {
    let deletedCount = 0;
    
    for (const [layerName, layer] of Object.entries(this.layers)) {
      try {
        const keys = await layer.keys();
        
        for (const key of keys) {
          let shouldDelete = false;
          
          if (typeof pattern === 'string') {
            shouldDelete = key.includes(pattern);
          } else if (pattern instanceof RegExp) {
            shouldDelete = pattern.test(key);
          }
          
          if (shouldDelete) {
            // Check category if specified
            if (category) {
              const cached = await layer.get(key);
              if (cached && cached.category !== category) {
                continue;
              }
            }
            
            await layer.delete(key);
            deletedCount++;
          }
        }
      } catch (error) {
        console.error(`Cache invalidation failed for layer ${layerName}:`, error);
      }
    }
    
    return deletedCount;
  }

  /**
   * Clear entire cache or specific category
   * @param {string} category - Optional category to clear
   * @returns {Promise<void>}
   */
  async clear(category = null) {
    for (const [layerName, layer] of Object.entries(this.layers)) {
      try {
        if (category) {
          // Clear only specific category
          const keys = await layer.keys();
          for (const key of keys) {
            const cached = await layer.get(key);
            if (cached && cached.category === category) {
              await layer.delete(key);
            }
          }
        } else {
          // Clear entire layer
          await layer.clear();
        }
      } catch (error) {
        console.error(`Cache clear failed for layer ${layerName}:`, error);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    const stats = {};
    
    for (const [layerName, layer] of Object.entries(this.layers)) {
      try {
        const layerStats = await layer.getStats();
        stats[layerName] = layerStats;
      } catch (error) {
        console.error(`Failed to get stats for layer ${layerName}:`, error);
        stats[layerName] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * Estimate data size in bytes
   * @param {any} data - Data to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateSize(data) {
    if (data === null || data === undefined) return 0;
    if (typeof data === 'boolean') return 4;
    if (typeof data === 'number') return 8;
    if (typeof data === 'string') return data.length * 2;
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 0;
  }

  /**
   * Setup periodic cleanup intervals
   */
  setupCleanupIntervals() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
    
    // LRU cleanup every 10 minutes
    setInterval(() => {
      this.cleanupLRU();
    }, 10 * 60 * 1000);
    
    // Full garbage collection every hour
    setInterval(() => {
      this.garbageCollect();
    }, 60 * 60 * 1000);
  }

  /**
   * Handle browser visibility changes for cache optimization
   */
  handleVisibilityChanges() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page became hidden - good time for cleanup
        this.garbageCollect();
      } else {
        // Page became visible - preload critical data
        this.preloadCriticalData();
      }
    });
  }

  /**
   * Cleanup expired entries
   */
  async cleanupExpired() {
    for (const [layerName, layer] of Object.entries(this.layers)) {
      try {
        await layer.cleanupExpired();
      } catch (error) {
        console.error(`Cleanup failed for layer ${layerName}:`, error);
      }
    }
  }

  /**
   * LRU cleanup to manage memory usage
   */
  async cleanupLRU() {
    for (const [layerName, layer] of Object.entries(this.layers)) {
      try {
        await layer.cleanupLRU();
      } catch (error) {
        console.error(`LRU cleanup failed for layer ${layerName}:`, error);
      }
    }
  }

  /**
   * Full garbage collection
   */
  async garbageCollect() {
    await this.cleanupExpired();
    await this.cleanupLRU();
    
    // Force garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData() {
    // Implementation depends on your app's critical data
    // This is a placeholder for app-specific logic
    console.log('Preloading critical data...');
  }
}

/**
 * Memory cache implementation
 */
class MemoryCache {
  constructor(maxSize = 50 * 1024 * 1024) { // 50MB default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  async get(key) {
    return this.cache.get(key) || null;
  }

  async set(key, value) {
    const size = this.estimateSize(value);
    
    // Check if we need to make space
    if (this.currentSize + size > this.maxSize) {
      await this.evictLRU(size);
    }
    
    // Remove old entry size if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentSize -= oldEntry.size;
    }
    
    this.cache.set(key, value);
    this.currentSize += size;
    
    return true;
  }

  async delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  async clear() {
    this.cache.clear();
    this.currentSize = 0;
  }

  async keys() {
    return Array.from(this.cache.keys());
  }

  async cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      // This would need policy lookup - simplified for example
      if (entry.timestamp && (now - entry.timestamp) > 30 * 60 * 1000) {
        await this.delete(key);
      }
    }
  }

  async cleanupLRU() {
    if (this.currentSize > this.maxSize * 0.8) {
      await this.evictLRU(this.currentSize - this.maxSize * 0.6);
    }
  }

  async evictLRU(targetSize) {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));
    
    let freedSize = 0;
    
    for (const [key, entry] of entries) {
      if (freedSize >= targetSize) break;
      
      freedSize += entry.size || 0;
      this.cache.delete(key);
      this.currentSize -= entry.size || 0;
    }
  }

  async getStats() {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      entries: this.cache.size,
      utilization: (this.currentSize / this.maxSize) * 100
    };
  }

  estimateSize(data) {
    return JSON.stringify(data).length * 2;
  }
}

/**
 * Session storage cache implementation
 */
class SessionStorageCache {
  constructor() {
    this.available = this.isAvailable();
  }

  isAvailable() {
    try {
      const test = '__sessionStorageTest__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async get(key) {
    if (!this.available) return null;
    
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async set(key, value) {
    if (!this.available) return false;
    
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key) {
    if (!this.available) return false;
    
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear() {
    if (!this.available) return;
    sessionStorage.clear();
  }

  async keys() {
    if (!this.available) return [];
    return Object.keys(sessionStorage);
  }

  async cleanupExpired() {
    const keys = await this.keys();
    const now = Date.now();
    
    for (const key of keys) {
      const entry = await this.get(key);
      if (entry && entry.timestamp && (now - entry.timestamp) > 10 * 60 * 1000) {
        await this.delete(key);
      }
    }
  }

  async cleanupLRU() {
    // SessionStorage cleanup based on storage quota
    const keys = await this.keys();
    if (keys.length > 100) {
      const entries = [];
      
      for (const key of keys) {
        const entry = await this.get(key);
        entries.push([key, entry]);
      }
      
      // Sort by last access
      entries.sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));
      
      // Remove oldest 20%
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        await this.delete(entries[i][0]);
      }
    }
  }

  async getStats() {
    const keys = await this.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      totalSize += key.length + (sessionStorage.getItem(key)?.length || 0);
    }
    
    return {
      entries: keys.length,
      estimatedSize: totalSize * 2, // UTF-16 encoding
      available: this.available
    };
  }
}

/**
 * Local storage cache implementation
 */
class LocalStorageCache extends SessionStorageCache {
  isAvailable() {
    try {
      const test = '__localStorageTest__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async get(key) {
    if (!this.available) return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async set(key, value) {
    if (!this.available) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        await this.cleanupLRU();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  async delete(key) {
    if (!this.available) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear() {
    if (!this.available) return;
    localStorage.clear();
  }

  async keys() {
    if (!this.available) return [];
    return Object.keys(localStorage);
  }
}

/**
 * IndexedDB cache implementation
 */
class IndexedDBCache {
  constructor() {
    this.dbName = 'WealthFlowCache';
    this.version = 1;
    this.db = null;
  }

  async init() {
    if (!('indexedDB' in window)) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  async get(key) {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set(key, value) {
    if (!this.db) return false;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({ key, value, ...value });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key) {
    if (!this.db) return false;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async keys() {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAllKeys();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupExpired() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');
    const now = Date.now();
    
    return new Promise((resolve) => {
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const entry = cursor.value;
          // Check expiration based on category policy
          const age = now - entry.timestamp;
          if (age > 15 * 60 * 1000) { // 15 minutes default
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  async cleanupLRU() {
    // Implementation for LRU cleanup in IndexedDB
    // This would involve sorting by lastAccess and removing oldest entries
  }

  async getStats() {
    if (!this.db) return { available: false };
    
    const keys = await this.keys();
    return {
      entries: keys.length,
      available: true,
      dbName: this.dbName,
      version: this.version
    };
  }
}

/**
 * Service Worker cache implementation
 */
class ServiceWorkerCache {
  constructor() {
    this.cacheName = 'wealthflow-v1';
  }

  async get(key) {
    if (!('caches' in window)) return null;
    
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(key);
      
      if (!response) return null;
      
      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  }

  async set(key, value) {
    if (!('caches' in window)) return false;
    
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await cache.put(key, response);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key) {
    if (!('caches' in window)) return false;
    
    try {
      const cache = await caches.open(this.cacheName);
      return await cache.delete(key);
    } catch {
      return false;
    }
  }

  async clear() {
    if (!('caches' in window)) return;
    
    return caches.delete(this.cacheName);
  }

  async keys() {
    if (!('caches' in window)) return [];
    
    try {
      const cache = await caches.open(this.cacheName);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    } catch {
      return [];
    }
  }

  async cleanupExpired() {
    // Service worker handles this via its own lifecycle
  }

  async cleanupLRU() {
    // Service worker cache management
  }

  async getStats() {
    const keys = await this.keys();
    return {
      entries: keys.length,
      available: 'caches' in window,
      cacheName: this.cacheName
    };
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Utility functions for common caching patterns
export const cacheCalculation = (inputs, results) => {
  const key = `calc_${JSON.stringify(inputs)}`;
  return cacheManager.set(key, { inputs, results }, 'calculations');
};

export const getCachedCalculation = (inputs) => {
  const key = `calc_${JSON.stringify(inputs)}`;
  return cacheManager.get(key, 'calculations');
};

export const cacheApiResponse = (url, data) => {
  return cacheManager.set(`api_${url}`, data, 'apiResponses');
};

export const getCachedApiResponse = (url) => {
  return cacheManager.get(`api_${url}`, 'apiResponses');
};

// Initialize on load
if (typeof window !== 'undefined') {
  // Initialize cache manager
  cacheManager.init();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    cacheManager.garbageCollect();
  });
}
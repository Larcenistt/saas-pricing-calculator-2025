import CryptoJS from 'crypto-js';

/**
 * Secure storage utility for sensitive data
 * Uses sessionStorage for tokens and encryption for sensitive data
 */
class SecureStorage {
  constructor() {
    // Generate a unique encryption key per session
    this.encryptionKey = this.getOrCreateSessionKey();
    this.storage = window.sessionStorage; // Use sessionStorage instead of localStorage
  }

  /**
   * Get or create a session-specific encryption key
   */
  getOrCreateSessionKey() {
    let key = window.sessionStorage.getItem('__session_key');
    if (!key) {
      key = this.generateKey();
      window.sessionStorage.setItem('__session_key', key);
    }
    return key;
  }

  /**
   * Generate a random encryption key
   */
  generateKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data before storage
   */
  encrypt(data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt data after retrieval
   */
  decrypt(encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON
      try {
        return JSON.parse(decryptedStr);
      } catch {
        return decryptedStr;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Store encrypted data
   */
  setItem(key, value) {
    const encrypted = this.encrypt(value);
    this.storage.setItem(key, encrypted);
  }

  /**
   * Retrieve and decrypt data
   */
  getItem(key) {
    const encrypted = this.storage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  /**
   * Remove item from storage
   */
  removeItem(key) {
    this.storage.removeItem(key);
  }

  /**
   * Clear all stored data
   */
  clear() {
    // Keep the session key
    const sessionKey = this.storage.getItem('__session_key');
    this.storage.clear();
    if (sessionKey) {
      this.storage.setItem('__session_key', sessionKey);
    }
  }

  /**
   * Check if item exists
   */
  hasItem(key) {
    return this.storage.getItem(key) !== null;
  }
}

// Token management with secure storage
class TokenManager {
  constructor() {
    this.secureStorage = new SecureStorage();
    this.ACCESS_TOKEN_KEY = '__access_token';
    this.REFRESH_TOKEN_KEY = '__refresh_token';
    this.TOKEN_EXPIRY_KEY = '__token_expiry';
    this.USER_KEY = '__user_data';
  }

  /**
   * Store tokens securely
   */
  setTokens({ accessToken, refreshToken, expiresIn = 900 }) {
    // Store access token in memory only (most secure)
    this.accessTokenMemory = accessToken;
    
    // Calculate expiry time
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    // Store in secure session storage as backup
    this.secureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    this.secureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    this.secureStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime);
    
    // Set auto-refresh before expiry
    this.scheduleTokenRefresh(expiresIn);
  }

  /**
   * Get access token from memory or storage
   */
  getAccessToken() {
    // Check if token is expired
    const expiry = this.secureStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() > expiry) {
      this.clearTokens();
      return null;
    }
    
    // Prefer memory storage
    return this.accessTokenMemory || this.secureStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return this.secureStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    this.accessTokenMemory = null;
    this.secureStorage.removeItem(this.ACCESS_TOKEN_KEY);
    this.secureStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.secureStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    this.clearRefreshTimer();
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh(expiresIn) {
    this.clearRefreshTimer();
    
    // Refresh 1 minute before expiry
    const refreshTime = (expiresIn - 60) * 1000;
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken();
      }, refreshTime);
    }
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.data.tokens);
      
      return data.data.tokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      window.location.href = '/login';
      return null;
    }
  }

  /**
   * Store user data
   */
  setUser(userData) {
    this.secureStorage.setItem(this.USER_KEY, userData);
  }

  /**
   * Get user data
   */
  getUser() {
    return this.secureStorage.getItem(this.USER_KEY);
  }

  /**
   * Clear user data
   */
  clearUser() {
    this.secureStorage.removeItem(this.USER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Logout and clear all data
   */
  logout() {
    this.clearTokens();
    this.clearUser();
    this.secureStorage.clear();
  }
}

// XSS Protection utility
class XSSProtection {
  /**
   * Sanitize HTML string
   */
  static sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  /**
   * Escape special characters
   */
  static escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, m => map[m]);
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '#';
      }
      return parsed.toString();
    } catch {
      return '#';
    }
  }

  /**
   * Remove dangerous attributes from HTML
   */
  static sanitizeAttributes(html) {
    const dangerous = [
      'onclick',
      'onload',
      'onerror',
      'onmouseover',
      'onfocus',
      'onblur',
      'onsubmit',
      'javascript:',
      'data:text/html',
    ];
    
    let sanitized = html;
    dangerous.forEach(attr => {
      const regex = new RegExp(`${attr}[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '>');
    });
    
    return sanitized;
  }
}

// CSRF Token management
class CSRFManager {
  constructor() {
    this.tokenKey = '__csrf_token';
  }

  /**
   * Get CSRF token from meta tag or API
   */
  async getToken() {
    // Check meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // Fetch from API if not in meta
    try {
      const response = await fetch('/api/v1/auth/csrf-token', {
        credentials: 'include',
      });
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      return null;
    }
  }

  /**
   * Add CSRF token to request headers
   */
  async addToHeaders(headers = {}) {
    const token = await this.getToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  }
}

// Export instances
export const tokenManager = new TokenManager();
export const xssProtection = XSSProtection;
export const csrfManager = new CSRFManager();
export const secureStorage = new SecureStorage();

// Auto-logout on window close (optional)
window.addEventListener('beforeunload', () => {
  // Clear sensitive data on tab close
  if (!tokenManager.getRefreshToken()) {
    tokenManager.clearTokens();
  }
});

// Monitor for XSS attempts
const originalWrite = document.write;
document.write = function() {
  console.error('document.write blocked for security reasons');
  // Log potential XSS attempt
  if (window.gtag) {
    window.gtag('event', 'security_alert', {
      event_category: 'Security',
      event_label: 'document.write attempt blocked',
    });
  }
};

// Prevent prototype pollution
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);

export default {
  tokenManager,
  xssProtection,
  csrfManager,
  secureStorage,
};
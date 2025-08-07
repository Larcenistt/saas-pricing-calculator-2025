// WebSocket Connection Optimization and Management
// ================================================

/**
 * High-performance WebSocket manager with connection pooling,
 * message batching, and automatic reconnection
 */
export class OptimizedWebSocketManager {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'ws://localhost:3000',
      maxConnections: options.maxConnections || 5,
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      heartbeatInterval: options.heartbeatInterval || 30000,
      batchInterval: options.batchInterval || 100, // ms
      maxBatchSize: options.maxBatchSize || 10,
      bufferTimeout: options.bufferTimeout || 5000,
      debug: options.debug || false
    };
    
    this.connections = new Map();
    this.messageQueue = [];
    this.pendingMessages = new Map();
    this.listeners = new Map();
    this.batchTimer = null;
    this.heartbeatTimer = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.connectionPool = [];
    this.stats = {
      totalConnections: 0,
      messagessent: 0,
      messagesReceived: 0,
      reconnections: 0,
      errors: 0
    };
  }

  /**
   * Initialize WebSocket connection
   * @param {string} roomId - Room identifier
   * @returns {Promise<WebSocket>}
   */
  async connect(roomId = 'default') {
    if (this.connections.has(roomId)) {
      return this.connections.get(roomId);
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.connections.has(roomId)) {
            resolve(this.connections.get(roomId));
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;
    
    try {
      const ws = await this.createConnection(roomId);
      this.connections.set(roomId, ws);
      this.setupConnectionHandlers(ws, roomId);
      this.startHeartbeat(ws);
      
      this.stats.totalConnections++;
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      this.log(`Connected to room: ${roomId}`);
      return ws;
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error, roomId);
      throw error;
    }
  }

  /**
   * Create WebSocket connection with retry logic
   * @param {string} roomId - Room identifier
   * @returns {Promise<WebSocket>}
   */
  createConnection(roomId) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.options.url}?room=${encodeURIComponent(roomId)}`;
      const ws = new WebSocket(wsUrl);
      
      // Connection timeout
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.readyState = WebSocket.OPEN;
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        this.stats.errors++;
        reject(error);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        reject(new Error('Connection closed during setup'));
      };
    });
  }

  /**
   * Setup connection event handlers
   * @param {WebSocket} ws - WebSocket instance
   * @param {string} roomId - Room identifier
   */
  setupConnectionHandlers(ws, roomId) {
    ws.onmessage = (event) => {
      this.handleMessage(event.data, roomId);
    };

    ws.onerror = (error) => {
      this.log(`WebSocket error for room ${roomId}:`, error);
      this.stats.errors++;
    };

    ws.onclose = (event) => {
      this.log(`WebSocket closed for room ${roomId}:`, event.code, event.reason);
      this.connections.delete(roomId);
      this.handleConnectionClose(roomId, event);
    };
  }

  /**
   * Handle incoming messages with deduplication
   * @param {string} data - Message data
   * @param {string} roomId - Room identifier
   */
  handleMessage(data, roomId) {
    try {
      const message = JSON.parse(data);
      this.stats.messagesReceived++;
      
      // Deduplication
      const messageId = message.id || `${message.type}_${Date.now()}`;
      if (this.pendingMessages.has(messageId)) {
        return; // Duplicate message
      }
      
      this.pendingMessages.set(messageId, Date.now());
      
      // Clean old pending messages
      this.cleanupPendingMessages();
      
      // Emit to listeners
      this.emitMessage(message, roomId);
      
    } catch (error) {
      this.log('Failed to parse message:', error);
      this.stats.errors++;
    }
  }

  /**
   * Clean up old pending messages to prevent memory leaks
   */
  cleanupPendingMessages() {
    const now = Date.now();
    const maxAge = 30000; // 30 seconds
    
    for (const [id, timestamp] of this.pendingMessages.entries()) {
      if (now - timestamp > maxAge) {
        this.pendingMessages.delete(id);
      }
    }
  }

  /**
   * Handle connection close with automatic reconnection
   * @param {string} roomId - Room identifier
   * @param {CloseEvent} event - Close event
   */
  handleConnectionClose(roomId, event) {
    // Don't reconnect if it was a clean close
    if (event.code === 1000) {
      return;
    }

    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect(roomId);
    } else {
      this.log(`Max reconnection attempts reached for room: ${roomId}`);
      this.emitEvent('maxReconnectAttemptsReached', { roomId });
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   * @param {string} roomId - Room identifier
   */
  scheduleReconnect(roomId) {
    this.reconnectAttempts++;
    this.stats.reconnections++;
    
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    this.log(`Scheduling reconnection for room ${roomId} in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(roomId).catch(error => {
        this.log(`Reconnection failed for room ${roomId}:`, error);
      });
    }, delay);
  }

  /**
   * Handle connection errors
   * @param {Error} error - Connection error
   * @param {string} roomId - Room identifier
   */
  handleConnectionError(error, roomId) {
    this.log(`Connection error for room ${roomId}:`, error);
    this.emitEvent('connectionError', { error, roomId });
  }

  /**
   * Send message with batching and queuing
   * @param {Object} message - Message to send
   * @param {string} roomId - Room identifier
   * @param {boolean} immediate - Send immediately without batching
   * @returns {Promise<boolean>}
   */
  async send(message, roomId = 'default', immediate = false) {
    // Add message metadata
    const enrichedMessage = {
      ...message,
      id: message.id || this.generateMessageId(),
      timestamp: Date.now(),
      roomId
    };

    if (immediate) {
      return this.sendImmediate(enrichedMessage, roomId);
    }

    // Add to batch queue
    this.messageQueue.push(enrichedMessage);
    this.scheduleBatch();
    
    return true;
  }

  /**
   * Send message immediately
   * @param {Object} message - Message to send
   * @param {string} roomId - Room identifier
   * @returns {Promise<boolean>}
   */
  async sendImmediate(message, roomId) {
    const ws = this.connections.get(roomId);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Queue message for when connection is ready
      this.messageQueue.push(message);
      
      // Try to establish connection
      try {
        await this.connect(roomId);
        return this.sendImmediate(message, roomId);
      } catch (error) {
        this.log(`Failed to send message to room ${roomId}:`, error);
        return false;
      }
    }

    try {
      ws.send(JSON.stringify(message));
      this.stats.messagesReceived++;
      return true;
    } catch (error) {
      this.log(`Failed to send message:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Schedule batch sending
   */
  scheduleBatch() {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
      this.batchTimer = null;
    }, this.options.batchInterval);
  }

  /**
   * Process message batch
   */
  async processBatch() {
    if (this.messageQueue.length === 0) return;

    // Group messages by room
    const messagesByRoom = new Map();
    
    const batch = this.messageQueue.splice(0, this.options.maxBatchSize);
    
    for (const message of batch) {
      const roomId = message.roomId || 'default';
      if (!messagesByRoom.has(roomId)) {
        messagesByRoom.set(roomId, []);
      }
      messagesByRoom.get(roomId).push(message);
    }

    // Send batches to each room
    for (const [roomId, messages] of messagesByRoom.entries()) {
      await this.sendBatch(messages, roomId);
    }

    // Process remaining messages if queue is still full
    if (this.messageQueue.length > 0) {
      this.scheduleBatch();
    }
  }

  /**
   * Send batch of messages to a room
   * @param {Array} messages - Messages to send
   * @param {string} roomId - Room identifier
   */
  async sendBatch(messages, roomId) {
    if (messages.length === 1) {
      return this.sendImmediate(messages[0], roomId);
    }

    const batchMessage = {
      type: 'batch',
      id: this.generateMessageId(),
      timestamp: Date.now(),
      messages
    };

    return this.sendImmediate(batchMessage, roomId);
  }

  /**
   * Start heartbeat for connection
   * @param {WebSocket} ws - WebSocket instance
   */
  startHeartbeat(ws) {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitEvent(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data);
        } catch (error) {
          this.log(`Event listener error for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Emit message to listeners
   * @param {Object} message - Message data
   * @param {string} roomId - Room identifier
   */
  emitMessage(message, roomId) {
    this.emitEvent('message', { message, roomId });
    this.emitEvent(`message:${message.type}`, { message, roomId });
    this.emitEvent(`room:${roomId}`, { message, roomId });
  }

  /**
   * Disconnect from room
   * @param {string} roomId - Room identifier
   */
  disconnect(roomId) {
    const ws = this.connections.get(roomId);
    if (ws) {
      ws.close(1000, 'Client disconnect');
      this.connections.delete(roomId);
    }
  }

  /**
   * Disconnect from all rooms and cleanup
   */
  disconnectAll() {
    for (const [roomId, ws] of this.connections.entries()) {
      ws.close(1000, 'Client disconnect');
    }
    
    this.connections.clear();
    this.messageQueue = [];
    this.pendingMessages.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.connections.size,
      queuedMessages: this.messageQueue.length,
      pendingMessages: this.pendingMessages.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Generate unique message ID
   * @returns {string}
   */
  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debug logging
   * @param {...*} args - Log arguments
   */
  log(...args) {
    if (this.options.debug) {
      console.log('[WebSocketManager]', ...args);
    }
  }
}

/**
 * Memory leak prevention utilities
 */
export class MemoryLeakPrevention {
  constructor() {
    this.observers = new Set();
    this.intervals = new Set();
    this.timeouts = new Set();
    this.eventListeners = new Map();
    this.components = new Map();
    this.cleanupTasks = new Set();
  }

  /**
   * Track intersection observer
   * @param {IntersectionObserver} observer - Observer to track
   */
  trackObserver(observer) {
    this.observers.add(observer);
  }

  /**
   * Track interval
   * @param {number} intervalId - Interval ID
   */
  trackInterval(intervalId) {
    this.intervals.add(intervalId);
  }

  /**
   * Track timeout
   * @param {number} timeoutId - Timeout ID
   */
  trackTimeout(timeoutId) {
    this.timeouts.add(timeoutId);
  }

  /**
   * Track event listener
   * @param {Element} element - Element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  trackEventListener(element, event, handler) {
    const key = `${element}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    this.eventListeners.get(key).add(handler);
  }

  /**
   * Track component for cleanup
   * @param {string} componentId - Component identifier
   * @param {Function} cleanupFn - Cleanup function
   */
  trackComponent(componentId, cleanupFn) {
    this.components.set(componentId, cleanupFn);
  }

  /**
   * Add cleanup task
   * @param {Function} task - Cleanup task
   */
  addCleanupTask(task) {
    this.cleanupTasks.add(task);
  }

  /**
   * Clean up all tracked resources
   */
  cleanup() {
    // Disconnect observers
    for (const observer of this.observers) {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    }
    this.observers.clear();

    // Clear intervals
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();

    // Clear timeouts
    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();

    // Remove event listeners
    for (const [key, handlers] of this.eventListeners.entries()) {
      const [element, event] = key.split('-');
      for (const handler of handlers) {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          console.warn('Failed to remove event listener:', error);
        }
      }
    }
    this.eventListeners.clear();

    // Cleanup components
    for (const [componentId, cleanupFn] of this.components.entries()) {
      try {
        cleanupFn();
      } catch (error) {
        console.warn(`Failed to cleanup component ${componentId}:`, error);
      }
    }
    this.components.clear();

    // Execute cleanup tasks
    for (const task of this.cleanupTasks) {
      try {
        task();
      } catch (error) {
        console.warn('Failed to execute cleanup task:', error);
      }
    }
    this.cleanupTasks.clear();
  }

  /**
   * Create safe interval that's automatically tracked
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Interval ID
   */
  createInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.trackInterval(intervalId);
    return intervalId;
  }

  /**
   * Create safe timeout that's automatically tracked
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  createTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      callback();
      this.timeouts.delete(timeoutId);
    }, delay);
    this.trackTimeout(timeoutId);
    return timeoutId;
  }

  /**
   * Create safe event listener that's automatically tracked
   * @param {Element} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    this.trackEventListener(element, event, handler);
  }

  /**
   * Create safe intersection observer that's automatically tracked
   * @param {Function} callback - Observer callback
   * @param {Object} options - Observer options
   * @returns {IntersectionObserver}
   */
  createIntersectionObserver(callback, options = {}) {
    const observer = new IntersectionObserver(callback, options);
    this.trackObserver(observer);
    return observer;
  }

  /**
   * Get memory usage information
   * @returns {Object|null} Memory info
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        utilization: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }
}

// Global instances
export const wsManager = new OptimizedWebSocketManager({
  debug: process.env.NODE_ENV === 'development'
});

export const memoryManager = new MemoryLeakPrevention();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    wsManager.disconnectAll();
    memoryManager.cleanup();
  });

  // Periodic memory monitoring
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const memInfo = memoryManager.getMemoryInfo();
      const wsStats = wsManager.getStats();
      
      if (memInfo && memInfo.utilization > 80) {
        console.warn('High memory usage detected:', memInfo);
        memoryManager.forceGC();
      }
      
      console.log('WebSocket Stats:', wsStats);
    }, 60000); // Check every minute
  }
}
import { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  memo,
  startTransition,
  useDeferredValue,
  useTransition
} from 'react';

// High-performance React hooks and utilities
// ==========================================

/**
 * Debounced state hook for expensive operations
 * @param {*} initialValue - Initial state value
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {[value, debouncedValue, setValue]}
 */
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return [value, debouncedValue, setValue];
};

/**
 * Throttled callback hook for high-frequency events
 * @param {Function} callback - Callback function to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled callback
 */
export const useThrottledCallback = (callback, delay = 16) => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]);
};

/**
 * Memoized calculation hook with dependency tracking
 * @param {Function} computeFn - Expensive computation function
 * @param {Array} dependencies - Dependencies array
 * @returns {*} Computed value
 */
export const useMemoizedCalculation = (computeFn, dependencies = []) => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState(() => computeFn());
  const deferredDeps = useDeferredValue(dependencies);
  
  useEffect(() => {
    startTransition(() => {
      setResult(computeFn());
    });
  }, deferredDeps);
  
  return { result, isPending };
};

/**
 * Virtual list hook for rendering large datasets
 * @param {Object} options - Virtual list configuration
 * @returns {Object} Virtual list utilities
 */
export const useVirtualList = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.startIndex + index
      }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  const handleScroll = useThrottledCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, 16);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll
  };
};

/**
 * Performance monitoring hook
 * @param {string} componentName - Name of component to monitor
 * @returns {Object} Performance utilities
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    if (renderTime > 16) { // More than one frame
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (renders: ${renderCount.current})`);
    }
    
    startTime.current = performance.now();
  });
  
  const markPerformance = useCallback((label) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-${label}`);
    }
  }, [componentName]);
  
  const measurePerformance = useCallback((startMark, endMark) => {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(
          `${componentName}-duration`,
          `${componentName}-${startMark}`,
          `${componentName}-${endMark}`
        );
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }, [componentName]);
  
  return { markPerformance, measurePerformance, renderCount: renderCount.current };
};

/**
 * Intersection observer hook for lazy loading
 * @param {Object} options - Intersection observer options
 * @returns {Array} [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = ({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  triggerOnce = false
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
        
        if (triggerOnce && entry.isIntersecting) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );
    
    observer.observe(element);
    observerRef.current = observer;
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, root, rootMargin, triggerOnce]);
  
  return [elementRef, isIntersecting, entry];
};

/**
 * Optimized event handler hook
 * @param {Function} handler - Event handler function
 * @param {Array} dependencies - Dependencies for the handler
 * @returns {Function} Optimized handler
 */
export const useOptimizedEventHandler = (handler, dependencies = []) => {
  return useCallback(handler, dependencies);
};

/**
 * Memory-efficient state management hook
 * @param {*} initialState - Initial state
 * @returns {Array} [state, setState, resetState]
 */
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);
  
  const optimizedSetState = useCallback((newState) => {
    setState(prevState => {
      // Avoid unnecessary re-renders by checking if state actually changed
      if (typeof newState === 'function') {
        const computed = newState(prevState);
        return Object.is(computed, prevState) ? prevState : computed;
      }
      return Object.is(newState, prevState) ? prevState : newState;
    });
  }, []);
  
  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);
  
  return [state, optimizedSetState, resetState];
};

/**
 * Batch updates hook for multiple state changes
 * @returns {Function} Batch function
 */
export const useBatchUpdates = () => {
  return useCallback((updates) => {
    startTransition(() => {
      updates.forEach(update => update());
    });
  }, []);
};

/**
 * Component-specific performance optimizations
 */
export const createOptimizedComponent = (Component, options = {}) => {
  const {
    memo: shouldMemo = true,
    displayName,
    propsAreEqual
  } = options;
  
  let OptimizedComponent = Component;
  
  if (shouldMemo) {
    OptimizedComponent = memo(Component, propsAreEqual);
  }
  
  if (displayName) {
    OptimizedComponent.displayName = displayName;
  }
  
  return OptimizedComponent;
};

/**
 * Performance-aware data fetching hook
 * @param {Function} fetchFn - Data fetching function
 * @param {Array} dependencies - Dependencies array
 * @param {Object} options - Fetching options
 * @returns {Object} Fetch state and utilities
 */
export const useOptimizedFetch = (fetchFn, dependencies = [], options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000 // 10 minutes
  } = options;
  
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const cacheRef = useRef(new Map());
  const lastFetchTime = useRef(0);
  
  const cacheKey = useMemo(() => 
    JSON.stringify(dependencies), 
    dependencies
  );
  
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    const now = Date.now();
    const cached = cacheRef.current.get(cacheKey);
    
    // Return cached data if still fresh
    if (cached && (now - cached.timestamp) < staleTime) {
      setData(cached.data);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    lastFetchTime.current = now;
    
    try {
      const result = await fetchFn();
      
      startTransition(() => {
        setData(result);
        
        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: now
        });
        
        // Clean old cache entries
        setTimeout(() => {
          for (const [key, value] of cacheRef.current.entries()) {
            if ((Date.now() - value.timestamp) > cacheTime) {
              cacheRef.current.delete(key);
            }
          }
        }, 0);
      });
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, cacheKey, enabled, staleTime, cacheTime]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    
    const handleFocus = () => {
      const now = Date.now();
      if ((now - lastFetchTime.current) > staleTime) {
        fetchData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, fetchData, staleTime]);
  
  return {
    data,
    error,
    isLoading: isLoading || isPending,
    refetch: fetchData
  };
};

/**
 * Resource cleanup hook
 * @param {Array} cleanupFunctions - Array of cleanup functions
 */
export const useResourceCleanup = (cleanupFunctions = []) => {
  useEffect(() => {
    return () => {
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          try {
            cleanup();
          } catch (error) {
            console.error('Cleanup function failed:', error);
          }
        }
      });
    };
  }, [cleanupFunctions]);
};

/**
 * Performance-optimized form hook
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Form options
 * @returns {Object} Form state and handlers
 */
export const useOptimizedForm = (initialValues, options = {}) => {
  const { validate, onSubmit } = options;
  
  const [values, setValues] = useOptimizedState(initialValues);
  const [errors, setErrors] = useOptimizedState({});
  const [touched, setTouched] = useOptimizedState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors, setValues, setErrors]);
  
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    if (validate) {
      const fieldError = validate(field, values[field]);
      if (fieldError) {
        setErrors(prev => ({ ...prev, [field]: fieldError }));
      }
    }
  }, [validate, values, setTouched, setErrors]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    
    // Validate all fields
    if (validate) {
      const formErrors = {};
      Object.keys(values).forEach(field => {
        const error = validate(field, values[field]);
        if (error) formErrors[field] = error;
      });
      
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, setErrors]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  };
};
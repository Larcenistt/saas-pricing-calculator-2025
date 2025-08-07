import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh optimizations
      fastRefresh: true,
      // Exclude heavy components from Fast Refresh for better performance
      include: /\.(jsx|js|ts|tsx)$/,
    })
  ],
  
  // Performance optimizations
  esbuild: {
    // Tree shaking optimizations
    treeShaking: true,
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Minify identifiers for smaller bundle
    minifyIdentifiers: true,
    // Enable legal comments removal
    legalComments: 'none',
  },

  // CSS optimizations
  css: {
    // Enable CSS code splitting
    codeSplit: true,
    // CSS minification
    postcss: {
      plugins: [
        // Will be configured via postcss.config.js
      ]
    }
  },

  // Build optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2018',
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize chunk size
    chunkSizeWarningLimit: 200,
    
    // Advanced minification
    minify: 'esbuild',
    
    // Source maps for debugging (disable in production for smaller builds)
    sourcemap: process.env.NODE_ENV === 'development',
    
    rollupOptions: {
      // Optimize external dependencies
      external: [],
      
      output: {
        // Advanced code splitting strategy
        manualChunks: {
          // Core React libraries
          'react-vendor': [
            'react', 
            'react-dom', 
            'react-router-dom'
          ],
          
          // UI and Animation libraries  
          'ui-vendor': [
            'framer-motion',
            'react-hot-toast',
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          
          // Chart and visualization libraries (lazy loaded)
          'charts': [
            'recharts'
          ],
          
          // PDF generation libraries (lazy loaded)
          'pdf-generation': [
            'jspdf',
            'jspdf-autotable',
            'html2canvas'
          ],
          
          // Utility libraries
          'utils': [
            'axios',
            'clsx',
            'canvas-confetti'
          ],
          
          // State management
          'state': [
            'zustand',
            '@tanstack/react-query'
          ],
          
          // Payment processing
          'payments': [
            '@stripe/stripe-js'
          ],
          
          // Real-time features
          'realtime': [
            'socket.io-client'
          ],
          
          // Intersection observer
          'observers': [
            'react-intersection-observer'
          ]
        },
        
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '') 
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        
        // Optimize asset naming
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'assets/[name]-[hash].js',
        
        // Enable advanced compression
        generatedCode: {
          // Use const instead of var
          constBindings: true,
          // Use object shorthand
          objectShorthand: true,
        }
      },
      
      // Treeshaking optimizations
      treeshake: {
        // Enable pure function annotations
        annotations: true,
        // Aggressive module side effects detection
        moduleSideEffects: (id) => {
          // Mark CSS and asset imports as having side effects
          return id.includes('.css') || id.includes('.png') || id.includes('.svg') || id.includes('.jpg');
        },
        // Enable property reads tracking
        propertyReadSideEffects: false,
        // Enable unused function parameters removal
        unusedFunctionParameters: true
      }
    }
  },
  
  // Development server optimizations
  server: {
    // Enable HTTP/2
    http2: false, // Set to true if using HTTPS in dev
    
    // Optimize HMR
    hmr: {
      // Use WebSocket for faster HMR
      protocol: 'ws',
      // Optimize HMR timing
      timeout: 5000
    },
    
    // Enable gzip compression
    middlewareMode: false,
    
    // Optimize file watching
    watch: {
      // Ignore node_modules for better performance
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },
  
  // Dependency optimization
  optimizeDeps: {
    // Include dependencies that should be pre-bundled
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'react-hot-toast',
      'clsx',
      'zustand'
    ],
    
    // Exclude heavy dependencies from pre-bundling (will be code-split)
    exclude: [
      'recharts',
      'jspdf',
      'html2canvas',
      '@stripe/stripe-js'
    ],
    
    // ESBuild options for dependency optimization
    esbuildOptions: {
      // Use modern JS target
      target: 'es2018',
      
      // Enable tree shaking for dependencies
      treeShaking: true
    }
  },
  
  // Preview server optimizations (for production preview)
  preview: {
    // Enable compression
    host: true,
    strictPort: true,
    
    // Security headers
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-XSS-Protection': '1; mode=block'
    }
  }
})

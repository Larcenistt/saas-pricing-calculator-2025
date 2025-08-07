export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {
      // Target modern browsers for smaller CSS
      overrideBrowserslist: [
        '>= 0.5%',
        'last 2 major versions',
        'not dead',
        'Chrome >= 60',
        'Firefox >= 60',
        'Safari >= 12',
        'Edge >= 79'
      ],
      // Remove unnecessary prefixes
      remove: true,
      // Add only necessary prefixes
      add: true,
      // Enable flexbox prefixes
      flexbox: 'no-2009'
    },
    
    // CSS optimization plugins for production
    ...(process.env.NODE_ENV === 'production' ? {
      // Optimize CSS
      'postcss-preset-env': {
        // Use modern CSS features
        stage: 2,
        // Enable CSS nesting
        features: {
          'nesting-rules': true,
          'custom-media-queries': true,
          'media-query-ranges': true
        },
        // Browser targeting
        browsers: [
          '>= 0.5%',
          'last 2 major versions',
          'not dead'
        ]
      },
      
      // Remove unused CSS
      '@fullhuman/postcss-purgecss': {
        // Content to scan for used classes
        content: [
          './index.html',
          './src/**/*.{js,jsx,ts,tsx,vue}',
        ],
        
        // Safelist critical CSS classes
        safelist: [
          // Animation classes
          /^animate-/,
          /^transition-/,
          /^duration-/,
          /^ease-/,
          
          // Dynamic classes
          /^bg-/,
          /^text-/,
          /^border-/,
          /^shadow-/,
          /^glow/,
          
          // Framer Motion classes
          /^motion-/,
          
          // State classes
          /hover:/,
          /focus:/,
          /active:/,
          /disabled:/,
          
          // Responsive classes
          /sm:/,
          /md:/,
          /lg:/,
          /xl:/,
          /2xl:/,
          
          // Dark mode
          /dark:/,
          
          // Glass morphism classes
          /^glass-/,
          /^backdrop-/,
          
          // Chart and visualization classes
          /recharts/,
          
          // Toast notifications
          /react-hot-toast/,
          
          // Modal and popup classes
          /modal/,
          /popup/,
          /overlay/
        ],
        
        // Default extractor for Tailwind
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        
        // Extract Tailwind classes more effectively
        extractors: [
          {
            extractor: content => {
              // Extract all possible Tailwind class combinations
              const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
              const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
              return broadMatches.concat(innerMatches);
            },
            extensions: ['html', 'js', 'jsx', 'ts', 'tsx']
          }
        ]
      },
      
      // Minify CSS
      'cssnano': {
        preset: ['advanced', {
          // Optimize animations
          reduceIdents: false, // Keep animation names
          zindex: false, // Don't mess with z-index values
          discardComments: { removeAll: true },
          
          // Advanced optimizations
          autoprefixer: false, // Already handled above
          cssDeclarationSorter: true,
          discardDuplicates: true,
          discardEmpty: true,
          discardOverridden: true,
          discardUnused: true,
          mergeIdents: true,
          mergeLonghand: true,
          mergeRules: true,
          minifyFontValues: true,
          minifyGradients: true,
          minifyParams: true,
          minifySelectors: true,
          normalizeCharset: true,
          normalizeDisplayValues: true,
          normalizePositions: true,
          normalizeRepeatStyle: true,
          normalizeString: true,
          normalizeTimingFunctions: true,
          normalizeUnicode: true,
          normalizeUrl: true,
          normalizeWhitespace: true,
          orderedValues: true,
          reduceInitial: true,
          reduceTransforms: true,
          svgo: true,
          uniqueSelectors: true
        }]
      }
    } : {})
  },
}
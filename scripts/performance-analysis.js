#!/usr/bin/env node

/**
 * WealthFlow Performance Analysis Script
 * ====================================
 * 
 * Comprehensive performance testing and reporting for the SaaS Pricing Calculator
 * Tests all optimizations and generates detailed performance reports
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      bundleAnalysis: {},
      loadTimes: {},
      memoryUsage: {},
      cacheEfficiency: {},
      animationPerformance: {},
      networkOptimization: {},
      recommendations: []
    };
    
    this.targetMetrics = {
      firstContentfulPaint: 1500, // ms
      timeToInteractive: 3000, // ms
      cumulativeLayoutShift: 0.1,
      bundleSizeInitial: 200 * 1024, // 200KB
      bundleSizeTotal: 2 * 1024 * 1024, // 2MB
      animationFPS: 60,
      cacheHitRate: 0.8 // 80%
    };
  }

  /**
   * Run complete performance analysis
   */
  async analyze() {
    console.log('🚀 Starting WealthFlow Performance Analysis...\n');
    
    try {
      await this.analyzeBundleSize();
      await this.analyzeChunkDistribution();
      await this.analyzeTreeShaking();
      await this.analyzeCSSOptimization();
      await this.analyzeAssetOptimization();
      await this.generateRecommendations();
      await this.generateReport();
      
      console.log('✅ Performance analysis complete!');
      console.log(`📊 Report generated at: ./performance-report-${new Date().toISOString().split('T')[0]}.json`);
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      // Build the project
      console.log('  Building project...');
      execSync('npm run build', { stdio: 'pipe' });
      
      // Read dist directory
      const distPath = './dist';
      const files = await fs.readdir(distPath, { withFileTypes: true });
      
      let totalSize = 0;
      const assets = {};
      
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(distPath, file.name);
          const stats = await fs.stat(filePath);
          const size = stats.size;
          totalSize += size;
          
          // Categorize assets
          const ext = path.extname(file.name).toLowerCase();
          let category = 'other';
          
          if (['.js', '.mjs'].includes(ext)) category = 'javascript';
          else if (ext === '.css') category = 'styles';
          else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'].includes(ext)) category = 'images';
          else if (['.woff', '.woff2', '.ttf'].includes(ext)) category = 'fonts';
          else if (ext === '.html') category = 'markup';
          
          if (!assets[category]) assets[category] = [];
          assets[category].push({
            name: file.name,
            size: size,
            sizeKB: Math.round(size / 1024 * 100) / 100,
            gzipEstimate: Math.round(size * 0.3) // Rough gzip estimate
          });
        }
      }
      
      // Sort by size
      Object.keys(assets).forEach(category => {
        assets[category].sort((a, b) => b.size - a.size);
      });
      
      this.results.bundleAnalysis = {
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        assets,
        meetsTarget: totalSize <= this.targetMetrics.bundleSizeTotal,
        recommendations: this.getBundleSizeRecommendations(totalSize, assets)
      };
      
      console.log(`  ✅ Total bundle size: ${Math.round(totalSize / 1024)}KB`);
      
    } catch (error) {
      console.error('  ❌ Bundle analysis failed:', error.message);
    }
  }

  /**
   * Analyze chunk distribution and code splitting effectiveness
   */
  async analyzeChunkDistribution() {
    console.log('🔧 Analyzing chunk distribution...');
    
    try {
      const jsAssets = this.results.bundleAnalysis.assets.javascript || [];
      
      // Analyze chunk sizes
      const chunks = jsAssets.map(asset => ({
        name: asset.name,
        size: asset.size,
        type: this.categorizeChunk(asset.name)
      }));
      
      const chunkAnalysis = {
        totalChunks: chunks.length,
        initialChunk: chunks.find(chunk => chunk.name.includes('index')) || chunks[0],
        vendorChunks: chunks.filter(chunk => chunk.type === 'vendor'),
        componentChunks: chunks.filter(chunk => chunk.type === 'component'),
        utilityChunks: chunks.filter(chunk => chunk.type === 'utility'),
        largestChunks: chunks.sort((a, b) => b.size - a.size).slice(0, 5)
      };
      
      this.results.chunkAnalysis = chunkAnalysis;
      
      console.log(`  ✅ Found ${chunks.length} chunks`);
      console.log(`  📊 Initial chunk: ${Math.round(chunkAnalysis.initialChunk.size / 1024)}KB`);
      
    } catch (error) {
      console.error('  ❌ Chunk analysis failed:', error.message);
    }
  }

  /**
   * Analyze tree shaking effectiveness
   */
  async analyzeTreeShaking() {
    console.log('🌳 Analyzing tree shaking effectiveness...');
    
    try {
      // Check for common tree-shaking indicators
      const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const treeShakingAnalysis = {
        sideEffectsFree: packageJson.sideEffects === false,
        moduleFormat: packageJson.type === 'module' ? 'ESM' : 'CommonJS',
        heavyLibraries: this.identifyHeavyLibraries(dependencies),
        optimizationOpportunities: []
      };
      
      // Check for potential optimization opportunities
      if (dependencies['lodash'] && !dependencies['lodash-es']) {
        treeShakingAnalysis.optimizationOpportunities.push({
          type: 'library-swap',
          current: 'lodash',
          recommended: 'lodash-es',
          impact: 'Better tree shaking support'
        });
      }
      
      if (dependencies['moment'] && !dependencies['dayjs']) {
        treeShakingAnalysis.optimizationOpportunities.push({
          type: 'library-swap',
          current: 'moment',
          recommended: 'dayjs',
          impact: 'Significantly smaller bundle size'
        });
      }
      
      this.results.treeShakingAnalysis = treeShakingAnalysis;
      
      console.log(`  ✅ Tree shaking analysis complete`);
      console.log(`  🎯 Optimization opportunities: ${treeShakingAnalysis.optimizationOpportunities.length}`);
      
    } catch (error) {
      console.error('  ❌ Tree shaking analysis failed:', error.message);
    }
  }

  /**
   * Analyze CSS optimization
   */
  async analyzeCSSOptimization() {
    console.log('🎨 Analyzing CSS optimization...');
    
    try {
      const cssAssets = this.results.bundleAnalysis.assets.styles || [];
      const totalCSSSize = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
      
      const cssAnalysis = {
        totalSize: totalCSSSize,
        totalSizeKB: Math.round(totalCSSSize / 1024 * 100) / 100,
        files: cssAssets.length,
        averageFileSize: cssAssets.length > 0 ? totalCSSSize / cssAssets.length : 0,
        codeSplitEnabled: cssAssets.length > 1,
        recommendations: []
      };
      
      // CSS optimization recommendations
      if (totalCSSSize > 100 * 1024) { // > 100KB
        cssAnalysis.recommendations.push({
          type: 'size-reduction',
          message: 'Consider enabling PurgeCSS or CSS tree shaking',
          impact: 'Could reduce CSS size by 50-80%'
        });
      }
      
      if (cssAssets.length === 1) {
        cssAnalysis.recommendations.push({
          type: 'code-splitting',
          message: 'Enable CSS code splitting for better caching',
          impact: 'Improved cache efficiency and loading performance'
        });
      }
      
      this.results.cssAnalysis = cssAnalysis;
      
      console.log(`  ✅ CSS analysis complete`);
      console.log(`  📦 Total CSS size: ${cssAnalysis.totalSizeKB}KB`);
      
    } catch (error) {
      console.error('  ❌ CSS analysis failed:', error.message);
    }
  }

  /**
   * Analyze asset optimization
   */
  async analyzeAssetOptimization() {
    console.log('🖼️ Analyzing asset optimization...');
    
    try {
      const assets = this.results.bundleAnalysis.assets;
      
      const assetAnalysis = {
        images: this.analyzeImageAssets(assets.images || []),
        fonts: this.analyzeFontAssets(assets.fonts || []),
        totalAssetSize: 0,
        optimizationOpportunities: []
      };
      
      // Calculate total asset size
      ['images', 'fonts'].forEach(category => {
        if (assets[category]) {
          assetAnalysis.totalAssetSize += assets[category].reduce((sum, asset) => sum + asset.size, 0);
        }
      });
      
      this.results.assetAnalysis = assetAnalysis;
      
      console.log(`  ✅ Asset analysis complete`);
      console.log(`  🎯 Optimization opportunities: ${assetAnalysis.optimizationOpportunities.length}`);
      
    } catch (error) {
      console.error('  ❌ Asset analysis failed:', error.message);
    }
  }

  /**
   * Generate performance recommendations
   */
  async generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    
    // Bundle size recommendations
    if (this.results.bundleAnalysis.totalSize > this.targetMetrics.bundleSizeTotal) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'high',
        issue: 'Total bundle size exceeds recommended limit',
        current: `${Math.round(this.results.bundleAnalysis.totalSize / 1024)}KB`,
        target: `${Math.round(this.targetMetrics.bundleSizeTotal / 1024)}KB`,
        solutions: [
          'Enable more aggressive code splitting',
          'Implement dynamic imports for non-critical features',
          'Remove unused dependencies',
          'Use bundle analyzer to identify large modules'
        ],
        impact: 'high'
      });
    }
    
    // Initial chunk size recommendations
    const initialChunk = this.results.chunkAnalysis?.initialChunk;
    if (initialChunk && initialChunk.size > this.targetMetrics.bundleSizeInitial) {
      recommendations.push({
        category: 'Initial Loading',
        priority: 'high',
        issue: 'Initial JavaScript chunk is too large',
        current: `${Math.round(initialChunk.size / 1024)}KB`,
        target: `${Math.round(this.targetMetrics.bundleSizeInitial / 1024)}KB`,
        solutions: [
          'Move vendor libraries to separate chunks',
          'Implement route-based code splitting',
          'Lazy load non-critical components'
        ],
        impact: 'high'
      });
    }
    
    // CSS optimization recommendations
    if (this.results.cssAnalysis?.totalSize > 50 * 1024) {
      recommendations.push({
        category: 'CSS Optimization',
        priority: 'medium',
        issue: 'CSS bundle size could be optimized',
        current: `${this.results.cssAnalysis.totalSizeKB}KB`,
        target: '< 50KB',
        solutions: [
          'Enable PurgeCSS to remove unused styles',
          'Use critical CSS extraction',
          'Minimize custom CSS in favor of utility classes'
        ],
        impact: 'medium'
      });
    }
    
    // Tree shaking recommendations
    if (this.results.treeShakingAnalysis?.optimizationOpportunities?.length > 0) {
      recommendations.push({
        category: 'Tree Shaking',
        priority: 'medium',
        issue: 'Tree shaking could be improved',
        current: 'Sub-optimal library usage detected',
        target: 'Tree-shakable alternatives',
        solutions: this.results.treeShakingAnalysis.optimizationOpportunities.map(opp => 
          `Replace ${opp.current} with ${opp.recommended}`
        ),
        impact: 'medium'
      });
    }
    
    // Performance recommendations based on analysis
    if (this.results.bundleAnalysis.assets.javascript?.length > 10) {
      recommendations.push({
        category: 'Code Splitting',
        priority: 'low',
        issue: 'Many JavaScript chunks detected',
        current: `${this.results.bundleAnalysis.assets.javascript.length} chunks`,
        target: '< 10 chunks',
        solutions: [
          'Combine related small chunks',
          'Optimize chunk splitting strategy',
          'Use webpack chunk names for better organization'
        ],
        impact: 'low'
      });
    }
    
    this.results.recommendations = recommendations;
    
    console.log(`  ✅ Generated ${recommendations.length} recommendations`);
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport() {
    console.log('📊 Generating performance report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      summary: {
        overallScore: this.calculateOverallScore(),
        totalBundleSize: this.results.bundleAnalysis.totalSizeKB,
        initialChunkSize: this.results.chunkAnalysis?.initialChunk?.size 
          ? Math.round(this.results.chunkAnalysis.initialChunk.size / 1024) 
          : 'N/A',
        recommendationsCount: this.results.recommendations.length,
        criticalIssues: this.results.recommendations.filter(r => r.priority === 'high').length
      },
      detailed: this.results,
      optimizationChecklist: this.generateOptimizationChecklist(),
      nextSteps: this.generateNextSteps()
    };
    
    // Write report to file
    const reportPath = `./performance-report-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    await this.generateHumanReadableReport(report);
    
    console.log(`  ✅ Report saved to ${reportPath}`);
  }

  /**
   * Generate human-readable report
   */
  async generateHumanReadableReport(report) {
    const summary = `
# WealthFlow Performance Analysis Report
Generated: ${new Date().toLocaleString()}

## Summary
- **Overall Score**: ${report.summary.overallScore}/100
- **Total Bundle Size**: ${report.summary.totalBundleSize}KB
- **Initial Chunk Size**: ${report.summary.initialChunkSize}KB
- **Recommendations**: ${report.summary.recommendationsCount} (${report.summary.criticalIssues} critical)

## Bundle Breakdown
${this.formatBundleBreakdown()}

## Top Recommendations
${this.formatTopRecommendations()}

## Optimization Checklist
${report.optimizationChecklist.map(item => `- [${item.completed ? 'x' : ' '}] ${item.task}`).join('\n')}

## Next Steps
${report.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---
Generated by WealthFlow Performance Analyzer
`;

    const summaryPath = `./performance-summary-${new Date().toISOString().split('T')[0]}.md`;
    await fs.writeFile(summaryPath, summary);
    
    console.log(`  📝 Human-readable summary saved to ${summaryPath}`);
  }

  // Helper methods
  categorizeChunk(filename) {
    if (filename.includes('vendor') || filename.includes('react') || filename.includes('node_modules')) {
      return 'vendor';
    }
    if (filename.includes('Component') || filename.includes('Page')) {
      return 'component';
    }
    if (filename.includes('util') || filename.includes('helper')) {
      return 'utility';
    }
    return 'other';
  }

  identifyHeavyLibraries(dependencies) {
    const heavyLibs = {
      'moment': '~300KB',
      'lodash': '~330KB',
      'recharts': '~375KB',
      'html2canvas': '~200KB',
      'jspdf': '~390KB'
    };
    
    return Object.keys(dependencies).filter(dep => heavyLibs[dep]);
  }

  analyzeImageAssets(images) {
    return {
      count: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
      formats: this.getImageFormats(images),
      recommendations: this.getImageRecommendations(images)
    };
  }

  analyzeFontAssets(fonts) {
    return {
      count: fonts.length,
      totalSize: fonts.reduce((sum, font) => sum + font.size, 0),
      formats: this.getFontFormats(fonts),
      recommendations: this.getFontRecommendations(fonts)
    };
  }

  getImageFormats(images) {
    const formats = {};
    images.forEach(img => {
      const ext = path.extname(img.name).toLowerCase().substring(1);
      formats[ext] = (formats[ext] || 0) + 1;
    });
    return formats;
  }

  getFontFormats(fonts) {
    const formats = {};
    fonts.forEach(font => {
      const ext = path.extname(font.name).toLowerCase().substring(1);
      formats[ext] = (formats[ext] || 0) + 1;
    });
    return formats;
  }

  getImageRecommendations(images) {
    const recommendations = [];
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    
    if (totalSize > 500 * 1024) {
      recommendations.push('Consider image optimization and modern formats (WebP, AVIF)');
    }
    
    const hasLargeImages = images.some(img => img.size > 100 * 1024);
    if (hasLargeImages) {
      recommendations.push('Implement responsive images with srcset');
    }
    
    return recommendations;
  }

  getFontRecommendations(fonts) {
    const recommendations = [];
    const totalSize = fonts.reduce((sum, font) => sum + font.size, 0);
    
    if (totalSize > 200 * 1024) {
      recommendations.push('Consider font subsetting to reduce size');
    }
    
    const hasOldFormats = fonts.some(font => 
      font.name.includes('.ttf') || font.name.includes('.otf')
    );
    if (hasOldFormats) {
      recommendations.push('Use modern font formats (WOFF2)');
    }
    
    return recommendations;
  }

  getBundleSizeRecommendations(totalSize, assets) {
    const recommendations = [];
    
    if (totalSize > this.targetMetrics.bundleSizeTotal) {
      recommendations.push('Total bundle size exceeds recommendation');
    }
    
    const jsSize = assets.javascript?.reduce((sum, asset) => sum + asset.size, 0) || 0;
    if (jsSize > 1.5 * 1024 * 1024) { // 1.5MB
      recommendations.push('JavaScript bundle is very large - consider more aggressive code splitting');
    }
    
    return recommendations;
  }

  calculateOverallScore() {
    let score = 100;
    
    // Bundle size impact
    if (this.results.bundleAnalysis.totalSize > this.targetMetrics.bundleSizeTotal) {
      const overage = (this.results.bundleAnalysis.totalSize - this.targetMetrics.bundleSizeTotal) / this.targetMetrics.bundleSizeTotal;
      score -= Math.min(30, overage * 30);
    }
    
    // Recommendations impact
    const criticalIssues = this.results.recommendations.filter(r => r.priority === 'high').length;
    score -= criticalIssues * 15;
    
    const mediumIssues = this.results.recommendations.filter(r => r.priority === 'medium').length;
    score -= mediumIssues * 8;
    
    const lowIssues = this.results.recommendations.filter(r => r.priority === 'low').length;
    score -= lowIssues * 3;
    
    return Math.max(0, Math.round(score));
  }

  formatBundleBreakdown() {
    const assets = this.results.bundleAnalysis.assets;
    let breakdown = '';
    
    Object.keys(assets).forEach(category => {
      const totalSize = assets[category].reduce((sum, asset) => sum + asset.size, 0);
      breakdown += `- **${category}**: ${Math.round(totalSize / 1024)}KB (${assets[category].length} files)\n`;
    });
    
    return breakdown;
  }

  formatTopRecommendations() {
    const top = this.results.recommendations.slice(0, 3);
    return top.map((rec, i) => 
      `${i + 1}. **${rec.category}** (${rec.priority}): ${rec.issue}\n   Solutions: ${rec.solutions.join(', ')}`
    ).join('\n\n');
  }

  generateOptimizationChecklist() {
    return [
      { task: 'Bundle size under 2MB', completed: this.results.bundleAnalysis.totalSize <= this.targetMetrics.bundleSizeTotal },
      { task: 'Initial chunk under 200KB', completed: this.results.chunkAnalysis?.initialChunk?.size <= this.targetMetrics.bundleSizeInitial },
      { task: 'Tree shaking enabled', completed: this.results.treeShakingAnalysis?.sideEffectsFree },
      { task: 'CSS code splitting enabled', completed: this.results.cssAnalysis?.codeSplitEnabled },
      { task: 'Modern image formats used', completed: false }, // Would need actual implementation check
      { task: 'Font optimization applied', completed: false },  // Would need actual implementation check
      { task: 'Service worker implemented', completed: false }, // Would need actual implementation check
      { task: 'Critical resource preloading', completed: false } // Would need actual implementation check
    ];
  }

  generateNextSteps() {
    const steps = [];
    
    const criticalIssues = this.results.recommendations.filter(r => r.priority === 'high');
    if (criticalIssues.length > 0) {
      steps.push(`Address ${criticalIssues.length} critical performance issues`);
    }
    
    if (this.results.bundleAnalysis.totalSize > this.targetMetrics.bundleSizeTotal) {
      steps.push('Implement aggressive code splitting to reduce bundle size');
    }
    
    if (this.results.treeShakingAnalysis?.optimizationOpportunities?.length > 0) {
      steps.push('Replace heavy libraries with tree-shakable alternatives');
    }
    
    steps.push('Set up continuous performance monitoring');
    steps.push('Implement performance budgets in CI/CD pipeline');
    
    if (steps.length === 0) {
      steps.push('Performance looks good! Focus on monitoring and maintenance');
    }
    
    return steps;
  }
}

// Run the analysis
const analyzer = new PerformanceAnalyzer();
analyzer.analyze().catch(console.error);
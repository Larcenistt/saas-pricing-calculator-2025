#!/usr/bin/env node

/**
 * Website Health Monitor for predictionnexus.com
 * Run this script to verify your website is working correctly
 */

import https from 'https';
import { execSync } from 'child_process';

const SITE_URL = 'https://www.predictionnexus.com';
const EXPECTED_TITLE = 'SaaS Pricing Calculator';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkWebsite() {
  log('\n🔍 Monitoring predictionnexus.com...', 'blue');
  log('=' .repeat(50));
  
  const checks = {
    domainReachable: false,
    httpsWorking: false,
    contentLoading: false,
    jsBundle: false,
    cssBundle: false,
    analyticsLoaded: false
  };

  try {
    // 1. Check if domain is reachable
    await new Promise((resolve, reject) => {
      https.get(SITE_URL, (res) => {
        checks.domainReachable = res.statusCode === 200;
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // 2. Check HTTPS
          checks.httpsWorking = res.socket.encrypted;
          
          // 3. Check content loading
          checks.contentLoading = data.includes(EXPECTED_TITLE);
          
          // 4. Check JS bundle
          checks.jsBundle = data.includes('index-') && data.includes('.js');
          
          // 5. Check CSS bundle
          checks.cssBundle = data.includes('index-') && data.includes('.css');
          
          // 6. Check Analytics
          checks.analyticsLoaded = data.includes('G-JMQMDLTNK4');
          
          resolve();
        });
      }).on('error', reject);
    });

    // Display results
    log('\n📊 Health Check Results:', 'yellow');
    log('-' .repeat(50));
    
    Object.entries(checks).forEach(([check, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? 'green' : 'red';
      const labels = {
        domainReachable: 'Domain Reachable',
        httpsWorking: 'HTTPS/SSL Working',
        contentLoading: 'HTML Content Loading',
        jsBundle: 'JavaScript Bundle',
        cssBundle: 'CSS Styles',
        analyticsLoaded: 'Google Analytics'
      };
      log(`${status} - ${labels[check]}`, color);
    });

    // Overall status
    const allPassed = Object.values(checks).every(check => check);
    log('\n' + '=' .repeat(50));
    if (allPassed) {
      log('✅ Website is FULLY OPERATIONAL!', 'green');
      log('💰 Ready to accept customer payments', 'green');
    } else {
      log('⚠️  Some checks failed - investigate immediately!', 'red');
    }

    // Additional info
    log('\n📝 Quick Links:', 'blue');
    log(`Homepage: ${SITE_URL}`);
    log(`Calculator: ${SITE_URL}/calculator`);
    log(`Stripe Test Card: 4242 4242 4242 4242`);
    
  } catch (error) {
    log('\n❌ ERROR: Could not reach website!', 'red');
    log(error.message, 'red');
  }
}

// Run the check
checkWebsite();

// Optional: Run every 5 minutes
if (process.argv.includes('--watch')) {
  log('\n👀 Monitoring mode enabled (checking every 5 minutes)...', 'yellow');
  setInterval(checkWebsite, 5 * 60 * 1000);
}
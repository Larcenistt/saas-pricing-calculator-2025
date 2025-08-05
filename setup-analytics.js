#!/usr/bin/env node

/**
 * Quick Google Analytics Setup Script
 * Run: node setup-analytics.js YOUR-GA-ID
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const gaId = args[0];

if (!gaId || !gaId.startsWith('G-')) {
  console.error('❌ Please provide a valid Google Analytics ID');
  console.error('Usage: node setup-analytics.js G-YOUR_ID_HERE');
  console.error('\nExample: node setup-analytics.js G-ABC123XYZ');
  process.exit(1);
}

const indexPath = path.join(__dirname, 'index.html');

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace all instances of G-XXXXXXXXXX with the actual ID
  const updatedContent = content.replace(/G-XXXXXXXXXX/g, gaId);
  
  if (content === updatedContent) {
    console.log('⚠️  No placeholders found. Analytics may already be configured.');
  } else {
    fs.writeFileSync(indexPath, updatedContent);
    console.log(`✅ Successfully updated Google Analytics ID to: ${gaId}`);
    console.log('\n📊 Next steps:');
    console.log('1. Deploy your changes');
    console.log('2. Verify in Google Analytics Real-Time view');
    console.log('3. Set up conversion tracking for purchases');
  }
  
} catch (error) {
  console.error('❌ Error updating index.html:', error.message);
  process.exit(1);
}
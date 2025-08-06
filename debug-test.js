// Debug script to test the app
// Run this in the browser console at http://localhost:5175/

console.log('=== DEBUG TEST START ===');

// Check if React is loaded
if (typeof React !== 'undefined') {
    console.log('✓ React is loaded');
} else {
    console.log('✗ React is NOT loaded');
}

// Check if root element exists
const root = document.getElementById('root');
if (root) {
    console.log('✓ Root element exists');
    console.log('Root content:', root.innerHTML.substring(0, 200));
    console.log('Root children count:', root.children.length);
} else {
    console.log('✗ Root element NOT found');
}

// Check for any error messages
const errors = document.querySelectorAll('.error, [class*="error"]');
if (errors.length > 0) {
    console.log('⚠ Found error elements:', errors);
}

// Check console for errors
console.log('=== Check browser console for any red error messages above ===');

// Check if app styles are loaded
const styles = document.styleSheets;
console.log('Stylesheets loaded:', styles.length);

// Check computed styles on body
const bodyStyles = window.getComputedStyle(document.body);
console.log('Body background:', bodyStyles.backgroundColor);
console.log('Body color:', bodyStyles.color);

console.log('=== DEBUG TEST END ===');
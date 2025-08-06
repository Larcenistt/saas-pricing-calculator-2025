import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppTest from './App-test.jsx'

console.log('=== MAIN-TEST.JSX STARTING ===')
console.log('Document ready state:', document.readyState)
console.log('Looking for root element...')

const root = document.getElementById('root')
console.log('Root element found:', !!root)

if (root) {
  console.log('Creating React root...')
  try {
    const reactRoot = createRoot(root)
    console.log('Rendering test app...')
    reactRoot.render(
      <StrictMode>
        <AppTest />
      </StrictMode>
    )
    console.log('✓ Test app rendered successfully!')
  } catch (error) {
    console.error('✗ Error rendering test app:', error)
    console.error('Stack trace:', error.stack)
  }
} else {
  console.error('✗ No root element found!')
  console.log('Current HTML:', document.documentElement.innerHTML)
}
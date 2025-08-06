import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function SimplePage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Application is Running!</h1>
      <p>The basic React setup is working correctly.</p>
      <p>If you see this, the error is in one of the removed components.</p>
    </div>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple timeout instead of font loading
    setTimeout(() => {
      setIsLoading(false)
    }, 100)
  }, [])

  if (isLoading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-dark-void">
          <Toaster position="bottom-right" />
          <Routes>
            <Route path="*" element={<SimplePage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
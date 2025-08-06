import { useState, useEffect } from 'react'

function AppTest() {
  const [status, setStatus] = useState('Loading...')
  
  useEffect(() => {
    console.log('AppTest: Component mounted')
    setStatus('App is working!')
  }, [])
  
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: '#1a1a1a', 
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        Test App
      </h1>
      <p style={{ fontSize: '24px', color: '#00ff00' }}>
        Status: {status}
      </p>
      <div style={{ marginTop: '40px', padding: '20px', border: '2px solid #00ff00' }}>
        <h2>Debug Info:</h2>
        <ul>
          <li>React is working ✓</li>
          <li>Component rendering ✓</li>
          <li>State updates working ✓</li>
          <li>Timestamp: {new Date().toLocaleTimeString()}</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('Button clicked!')}
          style={{ 
            padding: '10px 20px', 
            fontSize: '18px',
            backgroundColor: '#00ff00',
            color: '#000',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  )
}

export default AppTest
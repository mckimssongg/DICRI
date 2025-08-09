import { useEffect, useState } from 'react'

export function App() {
  const [health, setHealth] = useState<string>('checking...')

  useEffect(() => {
    fetch('/api/v1/health')
      .then(r => r.json())
      .then(d => setHealth(d?.ok ? 'ok' : 'error'))
      .catch(() => setHealth('error'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>DICRI — Demo</h1>
      <p>API health: <b>{health}</b></p>
    </div>
  )
}

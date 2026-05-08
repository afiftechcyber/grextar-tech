// src/components/SystemLogs.jsx
import { useEffect, useRef } from 'react'
import { FiTerminal, FiX } from 'react-icons/fi'

export default function SystemLogs({ logs, onClose }) {
  const logEndRef = useRef(null)

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  return (
    <div className="log-panel">
      <div className="log-header">
        <h3><FiTerminal /> SYSTEM LOGS</h3>
        <button onClick={onClose}><FiX /></button>
      </div>
      <div className="log-content">
        {logs.length === 0 ? <p className="log-empty">Tidak ada log aktif...</p> : null}
        {logs.map((log, index) => {
          let color = 'var(--text-2)'
          if (log.includes('[ERROR]')) color = '#ef4444'
          if (log.includes('[SUCCESS]')) color = '#22c55e'
          if (log.includes('[INFO]')) color = '#eab308'
          return (
            <div key={index} style={{ color }} className="log-line">
              {log}
            </div>
          )
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
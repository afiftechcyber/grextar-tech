// src/components/layout/Sidebar.jsx
import { FiX, FiTerminal } from 'react-icons/fi'
import { roleData } from '../roleData'

export default function Sidebar({ isOpen, setIsOpen, currentRole, setCurrentRole, showLogs, setShowLogs }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div>
          <h1>GREXTAR</h1>
          <p>MINSTESION AI</p>
        </div>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          <FiX />
        </button>
      </div>

      <div className="sidebar-section">
        <p className="section-title">MODE AI</p>
        {Object.entries(roleData).map(([key, role]) => (
          <button
            key={key}
            className={`role-btn ${currentRole === key ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole(key)
              setIsOpen(false)
            }}
          >
            <span>{role.avatar}</span>
            {role.name}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <p>Made with ❤️ by <strong>ApipBoyzz</strong></p>
        <button onClick={() => setShowLogs(!showLogs)} className="log-toggle-btn">
          <FiTerminal /> {showLogs ? 'Tutup Log System' : 'Buka Log System'}
        </button>
      </div>
    </aside>
  )
}
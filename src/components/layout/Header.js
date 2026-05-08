// src/components/layout/Header.jsx
import { FiMenu, FiTrash2 } from 'react-icons/fi'
import { roleData } from '../roleData'

export default function Header({ currentRole, setSidebarOpen, onClearChat }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
          <FiMenu />
        </button>
        <div className="header-info">
          <span className="avatar">{roleData[currentRole]?.avatar}</span>
          <div>
            <h2>{roleData[currentRole]?.name}</h2>
            <p>GREXTAR ONLINE</p>
          </div>
        </div>
      </div>
      
      <button className="clear-btn" onClick={onClearChat} title="Hapus Obrolan">
        <FiTrash2 />
      </button>
    </header>
  )
}
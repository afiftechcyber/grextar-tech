// src/components/chat/ChatInput.jsx
import { FiSend, FiSquare, FiMic, FiDownload } from 'react-icons/fi'

export default function ChatInput({ input, setInput, sendMessage, stopGenerating, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) sendMessage()
    }
  }

  return (
    <div className="input-area">
      <div className="input-box">
        <textarea
          placeholder="Ketik pesan atau paste link TikTok/YouTube..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        {/* Placeholder Fitur Tambahan */}
        <button className="tool-btn" style={{ background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)', width: '50px', borderRadius: '4px' }} title="Gunakan Suara" disabled={loading}><FiMic /></button>
        <button className="tool-btn" style={{ background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)', width: '50px', borderRadius: '4px', marginRight: '10px' }} title="Download Media" disabled={loading}><FiDownload /></button>

        {loading ? (
          <button onClick={stopGenerating} className="stop-btn" title="Hentikan">
            <FiSquare />
          </button>
        ) : (
          <button onClick={sendMessage} disabled={!input.trim()}>
            <FiSend />
          </button>
        )}
      </div>
    </div>
  )
}
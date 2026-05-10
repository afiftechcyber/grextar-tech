import { FiSend, FiSquare, FiMic, FiMicOff, FiDownload, FiPhoneCall, FiPhoneOff, FiVolume2, FiVolumeX } from 'react-icons/fi'

export default function ChatInput({ 
  input, setInput, sendMessage, stopGenerating, handleDownload, 
  loading, toggleRecording, isRecording, toggleLiveMode, isLiveMode,
  isAutoSpeak, setIsAutoSpeak // Terima props dari index.js
}) {
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) sendMessage()
    }
  }

  return (
    <div className="input-area">
      <div className="input-box" style={{ borderColor: isRecording || isLiveMode ? 'var(--accent-2)' : '' }}>
        <textarea
          placeholder={isLiveMode ? "LIVE MODE: Sedang menelepon AI..." : isRecording ? "Mendengarkan suara..." : "Ketik pesan atau paste link..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLiveMode} // Kunci keyboard saat lagi mode telepon
        />
        
        {/* Tombol 1: Mode Panggilan / Live Voice */}
        <button 
          className={`tool-btn ${isLiveMode ? 'pulse' : ''}`} 
          style={{ background: isLiveMode ? '#22c55e' : 'transparent', border: '1px solid #22c55e', color: isLiveMode ? '#000' : '#22c55e', width: '50px', borderRadius: '4px', marginRight: '10px' }} 
          title={isLiveMode ? "Matikan Panggilan Live" : "Mode Panggilan Live (Hands-free)"} 
          disabled={loading && !isLiveMode}
          onClick={toggleLiveMode} 
        >
          {isLiveMode ? <FiPhoneOff /> : <FiPhoneCall />}
        </button>

        {/* Tombol 2: Toggle Suara AI (Default Nonaktif) */}
        <button 
          className="tool-btn" 
          style={{ background: isAutoSpeak ? 'var(--accent-2)' : 'transparent', border: '1px solid var(--accent-2)', color: isAutoSpeak ? '#000' : 'var(--accent-2)', width: '50px', borderRadius: '4px', marginRight: '10px' }} 
          title={isAutoSpeak ? "Matikan Suara AI" : "Nyalakan Suara AI"} 
          disabled={loading || isLiveMode}
          onClick={() => setIsAutoSpeak(!isAutoSpeak)} 
        >
          {isAutoSpeak ? <FiVolume2 /> : <FiVolumeX />}
        </button>

        {/* Tombol 3: Dikte Manual */}
        <button 
          className="tool-btn" 
          style={{ background: isRecording && !isLiveMode ? 'var(--accent-2)' : 'transparent', border: '1px solid var(--accent-2)', color: isRecording && !isLiveMode ? '#000' : 'var(--accent-2)', width: '50px', borderRadius: '4px', marginRight: '10px' }} 
          title={isRecording ? "Hentikan Dikte" : "Dikte Suara Manual"} 
          disabled={loading || isLiveMode}
          onClick={toggleRecording} 
        >
          {isRecording && !isLiveMode ? <FiMicOff /> : <FiMic />}
        </button>

        {/* Tombol 4: Download */}
        <button 
          className="tool-btn" 
          style={{ background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)', width: '50px', borderRadius: '4px', marginRight: '10px' }} 
          title="Download Media (Paste link di kolom chat)" 
          disabled={loading || isLiveMode}
          onClick={handleDownload} 
        >
          <FiDownload />
        </button>

        {/* Tombol Kirim / Stop */}
        {loading ? (
          <button onClick={stopGenerating} className="stop-btn" title="Hentikan"><FiSquare /></button>
        ) : (
          <button onClick={() => sendMessage()} disabled={!input.trim() || isLiveMode}><FiSend /></button>
        )}
      </div>
    </div>
  )
}
// src/pages/index.js
import { useState } from 'react'
import IntroScreen from '../components/IntroScreen'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import ChatBox from '../components/chat/ChatBox'
import ChatInput from '../components/chat/ChatInput'
import SystemLogs from '../components/SystemLogs'
import { useChat } from '../hooks/useChat'

export default function Home() {
  const [intro, setIntro] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const { 
    messages, input, setInput, loading, currentRole, setCurrentRole, 
    sendMessage, stopGenerating, clearChat, logs, addLog, handleDownload,
    toggleRecording, isRecording,
    toggleLiveMode, isLiveMode
    
  } = useChat()

  function launchApp() {
    setIntro(false)
    addLog('SYSTEM', 'Aplikasi diluncurkan.')
  }

  if (intro) {
    return <IntroScreen onLaunch={launchApp} />
  }

  return (
    <div className="app">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
      />
      
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main">
        <Header 
          currentRole={currentRole} 
          setSidebarOpen={setSidebarOpen} 
          onClearChat={clearChat} 
        />
        
        <ChatBox messages={messages} loading={loading} />
        
        <ChatInput 
          input={input}
          setInput={setInput}
          sendMessage={sendMessage} 
          stopGenerating={stopGenerating}
          handleDownload={handleDownload} 
          loading={loading}
          toggleRecording={toggleRecording} 
          isRecording={isRecording}         
          toggleLiveMode={toggleLiveMode} 
          isLiveMode={isLiveMode}         
        />
      </main>

      {showLogs && <SystemLogs logs={logs} onClose={() => setShowLogs(false)} />}
    </div>
  )
}
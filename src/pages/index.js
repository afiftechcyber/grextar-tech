import { useEffect, useRef, useState } from 'react'
import { FiMenu, FiX, FiSend, FiTerminal, FiTrash2, FiSquare } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'

export default function Home() {
  const [intro, setIntro] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState('grextar')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false) // Untuk mencegah Hydration Error localStorage

  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  
  const logEndRef = useRef(null)
  const chatRef = useRef(null)
  const abortControllerRef = useRef(null) // Controller untuk fitur Stop Generating

  const roleData = {
    grextar: { name: 'Grextar AI', avatar: '🤖' },
    tsundere: { name: 'Tsundere Mode', avatar: '😺' },
    rudi: { name: 'Rudi Mode', avatar: '💀' },
    coding: { name: 'Coding Mode', avatar: '👨‍💻' },
  }

  // ── 1. LOCAL STORAGE: MEMUAT PESAN ──
  useEffect(() => {
    setIsClient(true)
    const savedChat = localStorage.getItem('grextar_history')
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat))
      } catch (e) {
        console.error('Gagal membaca history', e)
      }
    }
  }, [])

  // ── 1. LOCAL STORAGE: MENYIMPAN PESAN ──
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('grextar_history', JSON.stringify(messages))
    }
  }, [messages, isClient])

  // Auto Scroll Chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  // Auto Scroll Logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, showLogs])

  function launchApp() {
    setIntro(false)
    addLog('SYSTEM', 'Aplikasi diluncurkan.')
  }

  function addLog(type, message) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false })
    setLogs((prev) => [...prev, `[${time}] [${type}] ${message}`])
  }

  // ── 2. FITUR CLEAR CHAT ──
  function clearChat() {
    if (window.confirm('Yakin ingin menghapus seluruh riwayat obrolan?')) {
      setMessages([])
      addLog('SYSTEM', 'Riwayat obrolan telah dihapus.')
    }
  }

  // ── 3. FITUR STOP GENERATING ──
  function stopGenerating() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      addLog('INFO', 'Generation dihentikan oleh user.')
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
    addLog('REQUEST', `Mengirim pesan ke model: ${currentRole}`)

    // Inisialisasi AbortController baru untuk request ini
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal, // Tambahkan signal ini
        body: JSON.stringify({
          role: currentRole,
          model: 'gpt_oss',
          messages: newMessages,
        }),
      })

      addLog('RESPONSE', `HTTP Status: ${res.status}`)

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.trim().startsWith('data:') && !line.includes('[DONE]')) {
            const jsonStr = line.replace(/^data:\s*/, '').trim()
            if (!jsonStr) continue

            try {
              const chunkData = JSON.parse(jsonStr)
              const textChunk = chunkData.choices?.[0]?.delta?.content || ''

              if (textChunk) {
                setMessages((prev) => {
                  const updatedMessages = [...prev]
                  const lastIndex = updatedMessages.length - 1
                  updatedMessages[lastIndex] = {
                    ...updatedMessages[lastIndex],
                    content: updatedMessages[lastIndex].content + textChunk,
                  }
                  return updatedMessages
                })
              }
            } catch (err) {
              // Abaikan jika JSON belum lengkap
            }
          }
        }
      }
      
      addLog('SUCCESS', 'Stream selesai diterima.')

    } catch (error) {
      if (error.name === 'AbortError') {
        // Jika error karena dihentikan user
        addLog('INFO', 'Stream berhasil dibatalkan.')
      } else {
        // Jika error asli dari server
        addLog('ERROR', error.message)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1].content = updated[updated.length - 1].content + `\n\n*[Koneksi bermasalah: ${error.message}]*`
          return updated
        })
      }
    }

    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) sendMessage()
    }
  }

  return (
    <>
      {intro && (
        <div className="intro-screen">
          <div className="intro-bg" />
          <div className="intro-content">
            <h1>GREXTAR MINSTESION AI</h1>
            <p>Premium AI Assistant</p>
            <button onClick={launchApp} className="enter-btn">Lewati →</button>
          </div>
        </div>
      )}

      {!intro && (
        <div className="app">
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div>
                <h1>GREXTAR</h1>
                <p>MINSTESION AI</p>
              </div>
              <button className="close-btn" onClick={() => setSidebarOpen(false)}>
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
                    setSidebarOpen(false)
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

          {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

          <main className="main">
            {/* -- UPDATE HEADER -- */}
            <header className="header">
              <div className="header-left">
                <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                  <FiMenu />
                </button>
                <div className="header-info">
                  <span className="avatar">{roleData[currentRole].avatar}</span>
                  <div>
                    <h2>{roleData[currentRole].name}</h2>
                    <p>GREXTAR ONLINE</p>
                  </div>
                </div>
              </div>
              
              {/* TOMBOL CLEAR CHAT */}
              <button className="clear-btn" onClick={clearChat} title="Hapus Obrolan">
                <FiTrash2 />
              </button>
            </header>

            <div className="chat-container" ref={chatRef}>
              {messages.length === 0 && (
                <div className="welcome">
                  <h1>GREXTAR MINSTESION AI</h1>
                  <p>Pilih mode dan mulai ngobrol</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="bubble">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={dracula}
                                language={match[1]}
                                PreTag="div"
                                className="code-block"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.content === '' && (
                <div className="message assistant">
                  <div className="bubble">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="input-area">
              <div className="input-box">
                <textarea
                  placeholder="Ketik pesan..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {/* -- TOMBOL STOP/SEND -- */}
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
          </main>

          {showLogs && (
            <div className="log-panel">
              <div className="log-header">
                <h3><FiTerminal /> SYSTEM LOGS</h3>
                <button onClick={() => setShowLogs(false)}><FiX /></button>
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
          )}
        </div>
      )}
    </>
  )
}
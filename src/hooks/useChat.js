// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState('grextar')
  const [logs, setLogs] = useState([])
  const [isClient, setIsClient] = useState(false)
  
  // -- STATE UNTUK MANUAL MIC & LIVE VOICE --
  const [isRecording, setIsRecording] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const isLiveModeRef = useRef(false) // Referensi agar tidak terkena stale closure
  
  const recognitionRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Load history dari LocalStorage
  useEffect(() => {
    setIsClient(true)
    const savedChat = localStorage.getItem('grextar_history')
    if (savedChat) {
      try { setMessages(JSON.parse(savedChat)) } catch (e) {}
    }
  }, [])

  // Simpan history ke LocalStorage
  useEffect(() => {
    if (isClient) localStorage.setItem('grextar_history', JSON.stringify(messages))
  }, [messages, isClient])

  // -- VOICE: Inisialisasi Speech Recognition 1x --
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'id-ID' 
    }
  }, [])

  // -- VOICE: Update Event Listener Tiap Render (Menghindari stale state) --
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsRecording(false)
        addLog('VOICE', `Transkripsi: "${transcript}"`)
        
        // JIKA LIVE MODE AKTIF, LANGSUNG KIRIM OTOMATIS
        if (isLiveModeRef.current) {
          sendMessage(transcript) 
        }
      }

      recognitionRef.current.onerror = (event) => {
        setIsRecording(false)
        addLog('ERROR', `Voice Error: ${event.error}`)
        
        // Jika diam terlalu lama di Live Mode, paksa mic nyala lagi
        if (isLiveModeRef.current && event.error === 'no-speech') {
          try { recognitionRef.current?.start() } catch(e) {}
        } else if (isLiveModeRef.current && event.error !== 'aborted') {
          toggleLiveMode() // Matikan live mode jika ada error serius
        }
      }
    }
  }) // Tanpa array dependency agar closure selalu membaca state terbaru

  // -- VOICE: Fungsi Baca Teks (TTS) --
  function speak(text) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel() 
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'id-ID'
      utterance.rate = 1.0

      // KUNCI LIVE VOICE: Saat AI selesai bicara, nyalakan Mic lagi!
      utterance.onend = () => {
        if (isLiveModeRef.current) {
          try {
            recognitionRef.current?.start()
            setIsRecording(true)
            addLog('VOICE', 'Live Mode: Mendengarkan kembali...')
          } catch (e) {}
        }
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  // Tombol Manual Mic
  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current?.start()
      setIsRecording(true)
      addLog('VOICE', 'Mendengarkan...')
    }
  }

  // Tombol Live Voice
  function toggleLiveMode() {
    const newMode = !isLiveModeRef.current
    isLiveModeRef.current = newMode
    setIsLiveMode(newMode)

    if (newMode) {
      addLog('SYSTEM', 'Live Voice Diaktifkan')
      try { 
        recognitionRef.current?.start() 
        setIsRecording(true)
      } catch(e) {}
    } else {
      addLog('SYSTEM', 'Live Voice Dimatikan')
      try { recognitionRef.current?.stop() } catch(e) {}
      window.speechSynthesis.cancel() // Hentikan AI bicara jika dimatikan
      setIsRecording(false)
    }
  }

  function addLog(type, message) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false })
    setLogs((prev) => [...prev, `[${time}] [${type}] ${message}`])
  }

  function clearChat() {
    if (window.confirm('Yakin ingin menghapus seluruh riwayat obrolan?')) {
      setMessages([])
      addLog('SYSTEM', 'Riwayat obrolan telah dihapus.')
    }
  }

  function stopGenerating() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      addLog('INFO', 'Generation dihentikan oleh user.')
      setLoading(false)
    }
  }

  // Modifikasi agar bisa menerima teks langsung (untuk Live Voice)
 async function sendMessage(textOverride = null) {
    const messageToSend = textOverride || input
    if (!messageToSend.trim() || loading) return

    setInput('')
    setLoading(true)
    addLog('REQUEST', `Mengirim pesan ke model: ${currentRole}`)

    // 1. Buat pesan user baru
    const userMessage = { role: 'user', content: messageToSend }
    
    // 2. Gabungkan dengan history pesan yang ada di state saat ini UNTUK API
    const newMessagesForApi = [...messages, userMessage]

    // 3. Update state UI (tambahkan pesan user + placeholder untuk AI)
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }])

    abortControllerRef.current = new AbortController()
    let fullAssistantMessage = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          role: currentRole,
          model: 'nemotron_omni', 
          messages: newMessagesForApi, // Variabel ini sekarang sudah terisi
        }),
      })

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
                fullAssistantMessage += textChunk
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated.length - 1
                  updated[last] = { ...updated[last], content: updated[last].content + textChunk }
                  return updated
                })
              }
            } catch (err) {}
          }
        }
      }
      addLog('SUCCESS', 'Stream selesai.')
      
      // AI membacakan pesan jika Live Mode atau Manual Voice
      speak(fullAssistantMessage.replace(/[#*`]/g, ''))

    } catch (error) {
      if (error.name !== 'AbortError') {
        addLog('ERROR', error.message)
      }
    }
    setLoading(false)
  }

  // Fungsi Download Tetap Aman
  async function handleDownload() {
    if (!input.trim() || loading) return
    if (!input.includes('http')) return alert("Harap masukkan URL/Link yang valid!")
    const urlToDownload = input
    setMessages((prev) => [...prev, { role: 'user', content: `Tolong download video ini:\n${urlToDownload}` }])
    setInput('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '⏳ *Sedang mengambil link...*' }])
    try {
      const res = await fetch('/api/downloader', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlToDownload }) })
      const data = await res.json()
      setMessages((prev) => {
        const updated = [...prev]
        if (data.success) {
          updated[updated.length - 1].content = `✅ **Berhasil menemukan video!**\n\n**Judul:** ${data.title}\n\n[🚀 KLIK DI SINI UNTUK DOWNLOAD/NONTON (No WM)](${data.downloadLink})`
        } else {
          updated[updated.length - 1].content = `❌ **Gagal:** ${data.error}`
        }
        return updated
      })
    } catch (error) {}
    setLoading(false)
  }

  return {
    messages, input, setInput, loading, currentRole, setCurrentRole,
    logs, addLog, clearChat, stopGenerating, sendMessage, handleDownload,
    toggleRecording, isRecording, toggleLiveMode, isLiveMode // Export fitur baru
  }
}
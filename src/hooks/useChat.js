// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState('grextar')
  const [logs, setLogs] = useState([])
  const [isClient, setIsClient] = useState(false)
  
  const abortControllerRef = useRef(null)

  // Load history dari LocalStorage
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

  // Simpan history ke LocalStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('grextar_history', JSON.stringify(messages))
    }
  }, [messages, isClient])

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

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
    addLog('REQUEST', `Mengirim pesan ke model: ${currentRole}`)

    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
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
      addLog('SUCCESS', 'Stream selesai diterima.')
    } catch (error) {
      if (error.name === 'AbortError') {
        addLog('INFO', 'Stream berhasil dibatalkan.')
      } else {
        addLog('ERROR', error.message)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1].content += `\n\n*[Koneksi bermasalah: ${error.message}]*`
          return updated
        })
      }
    }
    setLoading(false)
  }

  return {
    messages, input, setInput, loading, currentRole, setCurrentRole,
    logs, addLog, clearChat, stopGenerating, sendMessage
  }
}
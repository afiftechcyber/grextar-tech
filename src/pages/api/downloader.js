// src/pages/api/downloader.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL tidak boleh kosong' })
  }

  try {
 // ── 1. LOGIKA UNTUK TIKTOK (Menggunakan tikwm.com) ──
    if (url.includes('tiktok.com')) {
      // Menggunakan API gratis dari tikwm (No Watermark)
      const fetchUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
      const response = await fetch(fetchUrl)
      const data = await response.json()

      if (data.code === 0 && data.data) {
        return res.status(200).json({
          success: true,
          platform: 'TikTok',
          title: data.data.title || 'Video TikTok',
          // data.data.play adalah link video murni tanpa watermark
          downloadLink: data.data.play, 
          cover: data.data.cover
        })
      } else {
        throw new Error('Gagal mengambil data dari TikTok')
      }
    } 
 
    
    // ── 2. JIKA PLATFORM TIDAK DIDUKUNG ──
    else {
      return res.status(400).json({ error: 'Link tidak didukung. Harap masukkan link TikTok .' })
    }

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan internal server' })
  }
}
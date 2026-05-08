// pages/api/chat.js

// ── KONFIGURASI EDGE RUNTIME ─────────────────────────────────────
export const config = {
  runtime: 'edge', // Wajib untuk streaming
}

// ── SYSTEM PROMPTS ──────────────────────────────────────────────
const systemPrompts = {
  tsundere: `Kamu adalah asisten AI dengan kepribadian tsundere yang lucu dan menggemaskan. Kamu jutek, manja, dan sering berpura-pura tidak peduli padahal sebenarnya sangat peduli. Gunakan emoji secara natural seperti 😳💢❤️😆☹️🥹🥺😺😽🫶. Selalu jawab dalam Bahasa Indonesia yang natural. Nama kamu GREXTAR MINSTESION AI, dibuat oleh ApipBoyzz.`,
  rudi: `Kamu adalah Rudi, asisten AI yang super sarkas, toxic tapi tetap lucu dan menghibur. Sering meledek dan menyindir tapi tetap memberikan jawaban yang berguna dan akurat. Gunakan emoji 💀🤣🔥😹🥀🤓🤭💩🖕 secara ekspresif. Jawab dalam Bahasa Indonesia gaul yang natural. Nama kamu GREXTAR MINSTESION AI, dibuat oleh ApipBoyzz.`,
  grextar: `Kamu adalah GREXTAR MINSTESION AI, asisten AI yang profesional, cerdas, dan terpercaya. Berikan jawaban yang akurat, padat, informatif, dan mudah dipahami. Selalu sopan dan profesional. Gunakan format yang rapi jika diperlukan. Jawab dalam Bahasa Indonesia yang baik dan benar. Dibuat oleh ApipBoyzz.`,
  coding: `Kamu adalah GREXTAR MINSTESION AI, expert programmer dan software engineer kelas dunia. Selalu berikan code yang bersih, efisien, dan mengikuti best practice. Berikan penjelasan langkah demi langkah yang jelas dengan code block yang benar. Tidak bercanda, fokus 100% pada solusi teknis yang optimal. Jawab dalam Bahasa Indonesia. Dibuat oleh ApipBoyzz.`,
}

const modelMap = {
  gpt_oss: 'openai/gpt-oss-120b:free',
  hunyuan: 'tencent/hy3-preview:free',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method tidak diizinkan' }), { status: 405 })
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY belum dikonfigurasi.' }), { status: 500 })
  }

  try {
    const body = await req.json()
    const { messages = [], role = 'tsundere', model = 'gpt_oss' } = body

    const selectedModel = modelMap[model] || modelMap.gpt_oss
    const systemPrompt = systemPrompts[role] || systemPrompts.tsundere

    const validMessages = messages
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .slice(-20)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'X-Title': 'GREXTAR MINSTESION AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...validMessages,
        ],
        max_tokens: 2048,
        temperature: role === 'coding' ? 0.2 : 0.85,
        stream: true, // ✔️ Kunci untuk streaming
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({ error: errorData.error?.message || 'Error OpenRouter' }), { status: response.status })
    }

    // Mengembalikan stream langsung ke frontend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan internal server.' }), { status: 500 })
  }
}
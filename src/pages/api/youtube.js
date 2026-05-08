import ytdl from "ytdl-core";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: "URL tidak valid" });
  }

  try {
    const info = await ytdl.getInfo(url);

    const formats = ytdl.filterFormats(info.formats, "videoandaudio");

    return res.status(200).json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      download: formats[0].url
    });
  } catch (err) {
    return res.status(500).json({ error: "Gagal mengambil video" });
  }
}
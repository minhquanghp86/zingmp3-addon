const express = require('express');
const path    = require('path');
const axios   = require('axios');
const { ZingMp3 } = require('./dist');

const app  = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Endpoint chính cho ESP32 (Giữ nguyên)
app.get('/stream_pcm', async (req, res) => {
  try {
    const { song } = req.query;
    if (!song) return res.status(400).json({ error: 'Missing song parameter' });

    const searchData = await ZingMp3.search(String(song));
    const items      = searchData?.data?.items || searchData?.data?.songs || [];
    const firstSong  = items.find(item => item.targetType === 'song' || item.encodeId);

    if (!firstSong) return res.status(404).json({ error: 'Song not found' });

    const songId = firstSong.encodeId || firstSong.id;

    res.json({
      title: firstSong.title,
      artist: firstSong.artistsNames || firstSong.artists?.[0]?.name || "Unknown",
      audio_url: `/proxy_audio?id=${songId}`,
      lyric_url: `/proxy_lyric?id=${songId}`,
      thumbnail: firstSong.thumbnail || firstSong.thumbnailM,
      duration: firstSong.duration,
      language: "unknown"
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Endpoint Proxy Audio (Giữ nguyên)
app.get('/proxy_audio', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send('Missing ID');

    const songDetail = await ZingMp3.getSong(id);
    const streamUrl  = songDetail?.data?.['128'] || songDetail?.data?.['320'];

    if (!streamUrl) return res.status(404).send('Audio not found');

    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);

    req.on('close', () => { if (response.data) response.data.destroy(); });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// 3. Các API bổ sung cho giao diện Web (Để các nút bấm hoạt động)
app.get('/api/search', async (req, res) => {
  try {
    res.json(await ZingMp3.search(String(req.query.q)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/song', async (req, res) => {
  try {
    res.json(await ZingMp3.getSong(req.query.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/info-song', async (req, res) => {
  try {
    res.json(await ZingMp3.getInfoSong(req.query.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/lyric', async (req, res) => {
  try {
    res.json(await ZingMp3.getLyric(req.query.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/proxy_lyric', async (req, res) => {
  try {
    res.json(await ZingMp3.getLyric(req.query.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

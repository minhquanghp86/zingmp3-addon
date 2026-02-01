const express = require('express');
const path    = require('path');
const axios   = require('axios');
const { ZingMp3 } = require('./dist');

const app  = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * STREAM_PCM – TÌM NHIỀU BÀI
 * http://ip:5555/stream_pcm?song=hello
 */
app.get('/stream_pcm', async (req, res) => {
  try {
    const { song } = req.query;
    if (!song) {
      return res.status(400).json({ error: 'Missing song parameter' });
    }

    const searchData = await ZingMp3.search(String(song));

    const items =
      searchData?.data?.items?.filter(i => i.resourceType === 'song') ||
      searchData?.data?.songs ||
      [];

    if (!items.length) {
      return res.status(404).json({ total: 0, songs: [] });
    }

    const songs = items.map(item => {
      const id = item.encodeId || item.id;

      return {
        title: item.title,
        artist: item.artistsNames || "Unknown",
        audio_url: `/proxy_audio?id=${id}`,
        lyric_url: `/proxy_lyric?id=${id}`,
        thumbnail: item.thumbnail || item.thumbnailM || null,
        duration: item.duration || 0,
        language: "unknown"
      };
    });

    res.json({
      total: songs.length,
      songs
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =================== PROXY AUDIO =================== */
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

    req.on('close', () => {
      if (response.data) response.data.destroy();
    });

  } catch (e) {
    res.status(500).send(e.message);
  }
});

/* =================== API CHO WEB =================== */
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
  console.log(`ZingMP3 Server running on port ${PORT}`);
});

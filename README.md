# ZingMP3 Backend — Home Assistant Add-on

Self-hosted ZingMP3 API server cho Home Assistant. Cung cấp search, stream nhạc và proxy endpoints.

---

## Cài đặt

**1. Thêm repository:**

Settings → Add-ons → Add-on Store → ⋮ (menu) → Repositories:

```
https://github.com/minhquanghp86/zingmp3-addon
```

**2. Install add-on:**

Tìm "ZingMP3 Backend" → Install → Start.

**3. Mở Web UI:**

Click "OPEN WEB UI" để access giao diện.

---

## API Endpoints

### `/stream_pcm?song=<query>`

Tìm nhiều bài hát theo từ khóa.

```bash
curl "http://192.168.10.2:5555/stream_pcm?song=phai%20dau"
```

**Response:**
```json
{
  "total": 5,
  "songs": [
    {
      "title": "Phai Dấu Cuộc Tình",
      "artist": "Lam Trường",
      "audio_url": "/proxy_audio?id=ZOACFBBU",
      "lyric_url": "/proxy_lyric?id=ZOACFBBU",
      "thumbnail": "https://...",
      "duration": 280
    }
  ]
}
```

---

### `/proxy_audio?id=<encodeId>`

Stream audio MP3 qua proxy. Hỗ trợ Range requests.

```bash
curl "http://192.168.10.2:5555/proxy_audio?id=ZOACFBBU" -o song.mp3
```

---

### `/api/search?q=<query>`

Search raw data (tất cả kết quả: bài hát, playlist, MV).

---

### `/api/song?id=<encodeId>`

Lấy stream URLs gốc từ ZingMP3.

**Response:**
```json
{
  "data": {
    "128": "https://...",  // Link MP3 128kbps
    "320": "https://..."   // Link MP3 320kbps
  }
}
```

---

### `/api/lyric?id=<encodeId>`

Lấy URL file lời bài hát (.lrc).

---

## Sử dụng với Home Assistant

### **REST Command:**

```yaml
rest_command:
  zing_search:
    url: http://localhost:5555/stream_pcm
    method: GET
```

### **Automation:**

```yaml
automation:
  - alias: "Play ZingMP3"
    trigger:
      platform: state
      entity_id: input_text.zing_query
    action:
      - service: rest_command.zing_search
        data:
          song: "{{ states('input_text.zing_query') }}"
        response_variable: zing
      
      - service: media_player.play_media
        target:
          entity_id: media_player.esp_audio
        data:
          media_content_id: "http://192.168.10.2:5555{{ zing.content.songs[0].audio_url }}"
          media_content_type: music
```

---

## Troubleshooting

**Addon không start:**
- Check log: Add-on → Log tab
- Port 5555 đã bị chiếm?

**Không search được:**
- ZingMP3 API có thể thay đổi
- Check log xem error gì

**Stream không phát:**
- Link từ ZingMP3 có thời hạn ~30 phút
- Cần search lại để lấy link mới

---

## Source Code

Repository: https://github.com/minhquanghp86/zingmp3-addon

Báo lỗi hoặc góp ý qua GitHub Issues.

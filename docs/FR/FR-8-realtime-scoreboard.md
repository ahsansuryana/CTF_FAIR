# FR-8: Real-time Scoreboard (WebSocket)

## Deskripsi
Scoreboard menampilkan ranking peserta berdasarkan total poin secara real-time menggunakan WebSocket (Socket.io). Dapat diakses publik tanpa login. Saat admin membekukan scoreboard (freeze), tampilan berhenti diperbarui meski submission terus berjalan di background.

---

## Requirements Detail

### FR-8.1 — Data Scoreboard
Setiap entri scoreboard berisi:
```json
{
  "rank": 1,
  "userId": "uuid",
  "username": "peserta1",
  "totalPoints": 350,
  "solvedCount": 4,
  "lastSolveAt": "2025-01-01T10:30:00Z",
  "solves": [
    { "challengeId": "uuid", "challengeTitle": "Easy Crypto", "points": 100, "solvedAt": "..." }
  ]
}
```

### FR-8.2 — Pengurutan (Ranking)
- Utama: `totalPoints` DESC
- Tie-breaker: `lastSolveAt` ASC (yang solve lebih cepat rank lebih tinggi)

### FR-8.3 — WebSocket Events

| Event | Arah | Payload | Keterangan |
|-------|------|---------|------------|
| `scoreboard:init` | Server → Client | Full scoreboard array | Dikirim saat client connect |
| `scoreboard:update` | Server → Client | Full scoreboard array (terbaru) | Dikirim setiap ada solve baru |

### FR-8.4 — Freeze Scoreboard
- Saat admin mengaktifkan freeze (`event_config.scoreboard_frozen = true`):
  - Server **tidak** emit `scoreboard:update` ke client publik/peserta
  - Submission dan solve tetap berjalan normal di backend
  - Admin tetap dapat melihat scoreboard terbaru di dashboard (endpoint khusus admin)
- Saat unfreeze: emit `scoreboard:update` dengan data terbaru

### FR-8.5 — Akses Publik
- Scoreboard dapat diakses di `/scoreboard` tanpa login
- Socket.io connection tidak memerlukan JWT untuk scoreboard
- Endpoint REST fallback: `GET /api/scoreboard` — return data scoreboard saat ini

### FR-8.6 — Saat Event Belum Mulai
- Scoreboard menampilkan pesan "Event belum dimulai" atau daftar kosong

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/scoreboard` | Tidak | REST fallback scoreboard |
| GET | `/api/admin/scoreboard` | Admin | Scoreboard terbaru (bypass freeze) |
| PATCH | `/api/admin/scoreboard/freeze` | Admin | Toggle freeze scoreboard |

---

## Socket.io Namespace
- Namespace: `/` (default)
- Room: `scoreboard`
- Client join: `socket.join('scoreboard')` otomatis saat connect ke namespace

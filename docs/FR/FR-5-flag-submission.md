# FR-5: Flag Submission & Validasi

## Deskripsi
Peserta mengirimkan flag melalui form di halaman soal. Backend memvalidasi flag, mencatat attempt, dan jika benar memperbarui skor serta mengirim update scoreboard via WebSocket.

---

## Requirements Detail

### FR-5.1 — Submit Flag
- Endpoint: `POST /api/challenges/:id/submit`
- Input: `{ flag: string }`
- Middleware yang dijalankan (berurutan):
  1. `authMiddleware` — verifikasi JWT
  2. `requireParticipant` — cek role & tidak di-ban
  3. `requireEventRunning` — cek event aktif
  4. `flagSubmitRateLimiter` — rate limit (lihat FR-10)
  5. Sequential unlock check — cek apakah challenge unlocked

### FR-5.2 — Validasi Flag
- Trim whitespace dari input sebelum compare
- Perbandingan **case-sensitive**
- Cek apakah peserta sudah pernah solve challenge ini → jika ya, return `{ correct: true, alreadySolved: true }`
- Compare flag input dengan flag tersimpan
- **Flag tidak pernah dikembalikan** dalam response apapun

### FR-5.3 — Jika Flag Benar
1. INSERT ke tabel `solves` `{ user_id, challenge_id, solved_at, points_earned }`
2. INSERT ke tabel `submissions` `{ ..., is_correct: true }`
3. Hitung ulang total skor user (SUM dari `solves.points_earned`)
4. Emit WebSocket event `scoreboard:update` ke semua client (lihat FR-8)
5. Return `{ correct: true, points: N, message: 'Flag benar!' }`

### FR-5.4 — Jika Flag Salah
1. INSERT ke tabel `submissions` `{ ..., is_correct: false }`
2. Return `{ correct: false, message: 'Flag salah, coba lagi!' }`
3. **Tidak** ada informasi hint tambahan dari response ini

### FR-5.5 — Pencatatan
- Semua attempt (benar & salah) disimpan di `submissions` dengan: `user_id`, `challenge_id`, `submitted_flag`, `is_correct`, `ip_address`, `submitted_at`
- IP address diambil dari header `X-Forwarded-For` (karena di balik Nginx) atau `req.ip`

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| POST | `/api/challenges/:id/submit` | Peserta | Submit flag |

---

## Response Format

```json
// Benar
{ "correct": true, "points": 100, "message": "Flag benar! +100 poin" }

// Salah
{ "correct": false, "message": "Flag salah, coba lagi!" }

// Sudah solve sebelumnya
{ "correct": true, "alreadySolved": true, "message": "Kamu sudah menyelesaikan soal ini!" }

// Event tidak aktif
{ "error": "Event belum dimulai atau sudah berakhir" }
```

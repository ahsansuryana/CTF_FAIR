# FR-14: Public Scoreboard Access

## Deskripsi
Halaman scoreboard dapat diakses oleh siapa pun tanpa login, termasuk penonton/juri.

---

## Requirements Detail

### FR-14.1 — Akses Tanpa Login
- Route `/scoreboard` di frontend: tidak memerlukan auth
- `GET /api/scoreboard`: tidak memerlukan JWT

### FR-14.2 — Konten Scoreboard Publik
- Ranking peserta (username, total poin, jumlah solve, last solve time)
- Daftar soal yang sudah di-solve per peserta (opsional, bisa dikonfigurasi admin untuk sembunyikan)
- **Tidak** menampilkan: password, email, flag, IP address, submission yang salah

### FR-14.3 — Update Real-time
- Scoreboard publik connect ke Socket.io tanpa auth
- Auto-update saat ada solve baru (kecuali scoreboard difreeze)

### FR-14.4 — Freeze Mode
- Saat frozen: scoreboard publik menampilkan data terakhir sebelum freeze
- Tidak ada indikator "scoreboard sedang dibekukan" di tampilan publik (untuk suspense closing ceremony)
- Setelah unfreeze: tampilkan data terbaru sekaligus

### FR-14.5 — Info Event
- Halaman scoreboard menampilkan nama event, waktu mulai/selesai, dan countdown/status

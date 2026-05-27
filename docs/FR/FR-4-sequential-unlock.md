# FR-4: Sequential Challenge Unlock

## Deskripsi
Soal dibuka secara bertahap berdasarkan urutan. Peserta harus menyelesaikan (solve) soal dengan `order_index = N` sebelum dapat mengakses soal `order_index = N+1`. Soal pertama (`order_index = 1`) selalu terbuka saat event berjalan.

---

## Requirements Detail

### FR-4.1 — Logika Unlock
- Soal dengan `order_index = 1`: selalu `unlocked` selama event berjalan
- Soal dengan `order_index = N` (N > 1): `unlocked` **jika dan hanya jika** peserta sudah memiliki entri di tabel `solves` untuk soal dengan `order_index = N-1`
- Unlock berdasarkan **global order_index**, bukan per kategori

### FR-4.2 — Status Soal per Peserta
Setiap soal memiliki salah satu status berikut dari perspektif peserta:
| Status | Kondisi |
|--------|---------|
| `solved` | Ada di tabel `solves` untuk user ini |
| `unlocked` | Soal sebelumnya sudah di-solve, tapi soal ini belum |
| `locked` | Soal sebelumnya belum di-solve |

### FR-4.3 — Proteksi di Backend
- Endpoint `GET /api/challenges/:id`: cek apakah challenge `unlocked` atau `solved` untuk user tersebut. Jika `locked` → 403
- Endpoint `POST /api/challenges/:id/submit`: cek unlock sebelum memproses. Jika `locked` → 403
- Endpoint `POST /api/instances/generate`: cek unlock. Jika `locked` → 403

### FR-4.4 — Tampilan Frontend
- Soal `locked` ditampilkan sebagai kartu abu-abu dengan ikon gembok
- Soal `unlocked` ditampilkan normal dengan tombol buka
- Soal `solved` ditampilkan dengan badge/checkmark hijau
- Klik pada soal `locked` → tampilkan pesan "Selesaikan soal sebelumnya terlebih dahulu"

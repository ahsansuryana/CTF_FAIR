# FR-12: Event Timer Management

## Deskripsi
Admin dapat mengatur waktu mulai dan selesai event, serta start/stop event secara manual. Peserta tidak dapat submit flag di luar waktu event.

---

## Requirements Detail

### FR-12.1 — Konfigurasi Waktu
- Field di `event_config`: `start_time` (ISO datetime), `end_time` (ISO datetime)
- Dapat diubah dari dashboard sebelum event dimulai

### FR-12.2 — Start/Stop Manual
- Admin dapat start event kapan saja (set `is_running: true`)
- Admin dapat stop event kapan saja (set `is_running: false`)
- Stop paksa tidak menghapus data submission/solve yang sudah ada

### FR-12.3 — Auto Start/Stop
- Server cron job cek setiap menit: jika `now >= start_time` dan `is_running = false` → auto start
- Server cron job: jika `now >= end_time` dan `is_running = true` → auto stop
- Auto stop juga: stop semua Docker instance yang masih running

### FR-12.4 — Tampilan Timer di Frontend
- Countdown timer ditampilkan di navbar/header selama event berlangsung
- Saat event belum mulai: tampilkan waktu mundur ke start
- Saat event selesai: tampilkan "Event Telah Berakhir"
- Timer diambil dari `GET /api/event/info` (public endpoint)

### FR-12.5 — Proteksi Saat Event Tidak Berjalan
- `requireEventRunning` middleware diterapkan pada:
  - Submit flag
  - Generate instance
- Challenge tetap bisa dilihat (read-only) meski event tidak berjalan

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/event/info` | Tidak | Info event publik (nama, waktu, status) |
| POST | `/api/admin/event/start` | Admin | Start event manual |
| POST | `/api/admin/event/stop` | Admin | Stop event manual |

# FR-9: Admin Dashboard (Konfigurasi Dinamis)

## Deskripsi
Dashboard admin adalah control center penuh untuk platform. Semua aspek platform dapat dikonfigurasi dari sini tanpa perlu edit file atau restart server. Tidak ada nilai yang hardcoded di frontend atau backend — semua berasal dari database.

---

## Halaman & Fitur Dashboard

### FR-9.1 — Overview / Home
- Statistik real-time: jumlah peserta, jumlah solve hari ini, challenge paling banyak di-solve, challenge yang belum pernah di-solve
- Status event: running / stopped / not started
- Tombol quick-action: Start Event, Stop Event, Freeze Scoreboard

### FR-9.2 — Manajemen Soal
- Tabel semua soal dengan kolom: judul, kategori, poin, order, status, jumlah solver
- Tombol: Tambah, Edit, Hapus, Toggle Aktif
- Drag-and-drop untuk re-ordering (atau input manual `order_index`)
- Form soal mendukung Markdown preview untuk deskripsi
- Upload file attachment per soal
- CRUD hint di dalam form soal

### FR-9.3 — Manajemen Peserta
- Tabel semua peserta: username, total poin, jumlah solve, status (aktif/banned)
- Tambah peserta satu per satu (input form)
- Reset password peserta
- Ban/unban peserta
- Lihat detail aktivitas peserta (solves, submissions)

### FR-9.4 — Konfigurasi Event
- Nama event, deskripsi, logo URL
- Waktu mulai & selesai (datetime picker)
- Format flag prefix
- Warna tema (hex color picker)
- Semua tersimpan ke `event_config` di DB

### FR-9.5 — Konfigurasi Docker
- Default TTL instance (dalam detik)
- Maksimum instance per peserta
- Tabel instance aktif saat ini (semua peserta)
- Tombol stop paksa instance

### FR-9.6 — Monitor Submissions
- Feed real-time semua submission (benar & salah)
- Filter per peserta, per challenge, per status (benar/salah)
- Tampilkan: username, challenge, flag yang disubmit, IP, timestamp

### FR-9.7 — Audit Log
- Log semua aksi admin (perubahan config, CRUD soal, ban/unban)
- Log submission lengkap dengan IP address
- Filter dan export (download sebagai CSV)

---

## API Endpoints Admin (Ringkasan)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/admin/stats` | Statistik dashboard |
| GET/PUT | `/api/admin/config` | Baca/update event config |
| GET | `/api/admin/submissions` | Semua submission dengan filter |
| GET | `/api/admin/audit-logs` | Audit log |
| GET | `/api/admin/audit-logs/export` | Export CSV |

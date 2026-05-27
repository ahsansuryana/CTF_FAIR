# FR-2: Setup Wizard (First-run Configuration)

## Deskripsi
Saat pertama kali `docker compose up` dijalankan dan database masih kosong, admin diarahkan ke halaman setup wizard. Wizard ini mengumpulkan konfigurasi dasar platform dan membuat akun admin pertama. Setelah selesai, wizard tidak dapat diakses lagi.

---

## Requirements Detail

### FR-2.1 — Deteksi First Run
- Backend cek `app_config.is_setup_done` saat server start
- Jika `false` (atau tabel kosong): semua API request non-setup mengembalikan 503 dengan pesan "Setup belum selesai"
- Frontend: jika menerima 503 khusus ini atau `/api/setup/status` return `{ done: false }`, redirect ke `/setup`

### FR-2.2 — Langkah Setup Wizard
Wizard terdiri dari **3 langkah**:

**Langkah 1 — Konfigurasi Platform**
- Nama Event (required)
- Deskripsi Event (optional)
- Format Flag Prefix (default: `CTF_ITFAIR`, dapat diubah)
- Logo URL (optional, bisa diisi nanti)
- Warna Primer (hex color, default: `#6366f1`)

**Langkah 2 — Konfigurasi Event**
- Tanggal & Waktu Mulai (datetime-local)
- Tanggal & Waktu Selesai (datetime-local)
- Default TTL Instance Docker (dalam detik, default: 300)
- Maksimum Instance per Peserta (default: 3)

**Langkah 3 — Buat Akun Admin Pertama**
- Username (required, min 3 karakter)
- Password (required, min 8 karakter)
- Konfirmasi Password

### FR-2.3 — Submit Setup
- Endpoint: `POST /api/setup/complete`
- Tidak perlu auth (hanya bisa diakses saat `is_setup_done = false`)
- Validasi semua field dengan Zod
- Simpan konfigurasi ke tabel `event_config` (key-value JSONB)
- Buat user admin dengan `role: 'admin'`
- Set `app_config.is_setup_done = true`
- Kembalikan JWT admin dan set cookie
- Redirect ke `/admin/dashboard`

### FR-2.4 — Keamanan Wizard
- Endpoint setup **hanya dapat diakses** saat `is_setup_done = false`
- Setelah setup selesai, `POST /api/setup/complete` mengembalikan 404

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/setup/status` | Tidak | Cek apakah setup sudah done |
| POST | `/api/setup/complete` | Tidak (only if !done) | Submit konfigurasi setup |

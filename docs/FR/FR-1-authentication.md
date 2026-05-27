# FR-1: Authentication (Login, Logout, Session)

## Deskripsi
Sistem autentikasi berbasis JWT yang disimpan di httpOnly cookie. Peserta dan admin login menggunakan username dan password. Tidak ada registrasi mandiri — akun dibuat oleh admin.

---

## Requirements Detail

### FR-1.1 — Login
- Endpoint: `POST /api/auth/login`
- Input: `{ username: string, password: string }`
- Validasi input dengan Zod
- Cek `username` di tabel `users`, jika tidak ada → 401
- `bcrypt.compare(password, user.password)`, jika salah → 401
- Cek `user.is_banned`, jika true → 403 dengan pesan "Akun Anda telah dinonaktifkan"
- Jika valid: sign JWT `{ userId, role }`, set httpOnly cookie `token`
- Response: `{ user: { id, username, role } }`
- Rate limit: 5 attempt/15 menit per IP

### FR-1.2 — Logout
- Endpoint: `POST /api/auth/logout`
- Hapus cookie `token` (set `maxAge: 0`)
- Response: `{ message: 'Logged out' }`

### FR-1.3 — Cek Session
- Endpoint: `GET /api/auth/me`
- Verify JWT dari cookie
- Response: `{ user: { id, username, role } }` atau 401

### FR-1.4 — Setup Wizard Check
- Saat app pertama kali diakses, cek tabel `app_config.is_setup_done`
- Jika `false`: redirect semua request ke halaman setup wizard
- Jika `true`: flow normal

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| POST | `/api/auth/login` | Tidak | Login |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/auth/me` | JWT | Cek session aktif |

---

## Error Responses

| HTTP | Kondisi |
|------|---------|
| 400 | Input tidak valid (Zod error) |
| 401 | Username tidak ditemukan atau password salah |
| 403 | Akun di-ban |
| 429 | Rate limit login terlampaui |

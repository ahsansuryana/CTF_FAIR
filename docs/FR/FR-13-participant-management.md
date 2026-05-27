# FR-13: Participant Management

## Deskripsi
Admin mengelola semua akun peserta melalui dashboard. Tidak ada registrasi mandiri — admin menginput peserta secara manual (dari data Excel).

---

## Requirements Detail

### FR-13.1 — Tambah Peserta (Satu per Satu)
- Endpoint: `POST /api/admin/participants`
- Input: `{ username, password }`
- Password di-hash sebelum disimpan
- Username harus unik

### FR-13.2 — Reset Password
- Endpoint: `PATCH /api/admin/participants/:id/reset-password`
- Input: `{ newPassword: string }`
- Admin menentukan password baru untuk peserta

### FR-13.3 — Ban / Unban
- Endpoint: `PATCH /api/admin/participants/:id/toggle-ban`
- Peserta yang di-ban tidak dapat login dan submission-nya ditolak
- Data solve/submission tetap tersimpan

### FR-13.4 — Hapus Peserta
- Endpoint: `DELETE /api/admin/participants/:id`
- Hanya dapat dilakukan jika peserta belum memiliki submission apapun
- Jika ada submission → 400 (untuk menjaga integritas data)

### FR-13.5 — List Peserta
- Endpoint: `GET /api/admin/participants`
- Return: semua peserta + statistik (total poin, jumlah solve, status ban)
- Bisa difilter dan diurutkan

### FR-13.6 — Detail Peserta
- Endpoint: `GET /api/admin/participants/:id`
- Return: info peserta + semua solve + semua submission (dengan flag yang diinput)

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/admin/participants` | Admin | List semua peserta |
| POST | `/api/admin/participants` | Admin | Tambah peserta |
| GET | `/api/admin/participants/:id` | Admin | Detail peserta |
| PATCH | `/api/admin/participants/:id/reset-password` | Admin | Reset password |
| PATCH | `/api/admin/participants/:id/toggle-ban` | Admin | Ban/unban |
| DELETE | `/api/admin/participants/:id` | Admin | Hapus peserta |

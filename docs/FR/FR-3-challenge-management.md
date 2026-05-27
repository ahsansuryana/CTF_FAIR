# FR-3: Challenge Management (CRUD Soal)

## Deskripsi
Admin dapat membuat, mengedit, menghapus, dan mengaktifkan/menonaktifkan soal CTF melalui dashboard. Setiap soal memiliki kategori, poin, flag, urutan unlock, hint opsional, dan untuk kategori Web, sebuah Docker image.

---

## Requirements Detail

### FR-3.1 — Struktur Data Soal
Field per challenge:
| Field | Tipe | Keterangan |
|-------|------|------------|
| `title` | string | Judul soal |
| `description` | text | Deskripsi soal (mendukung Markdown) |
| `category` | enum | `web`, `crypto`, `forensics`, `stegano`, `osint` |
| `points` | integer | Poin yang didapat jika solve (fixed) |
| `flag` | string | Flag jawaban, disimpan plaintext terenkripsi atau AES |
| `order_index` | integer | Urutan unlock (1 = paling awal) |
| `is_active` | boolean | Jika false, soal tidak tampil ke peserta |
| `docker_image` | string | Nama Docker image (hanya untuk kategori `web`) |
| `attachment_url` | string | URL file download (opsional) |
| `hints` | array | Daftar hint (lihat FR-7) |

### FR-3.2 — Buat Soal Baru
- Endpoint: `POST /api/admin/challenges`
- Validasi semua field dengan Zod
- `order_index` harus unik, jika duplikat → geser soal lain secara otomatis atau return error 400
- Flag disimpan dalam bentuk yang tidak mudah terbaca di DB (enkripsi simetris AES-256 atau hashing)
- Jika kategori `web`: `docker_image` wajib diisi

### FR-3.3 — Edit Soal
- Endpoint: `PUT /api/admin/challenges/:id`
- Semua field dapat diubah termasuk flag
- Jika flag diubah: peserta yang sudah solve **tidak** terpengaruh (tetap terhitung)
- Jika `order_index` diubah: backend handle re-ordering

### FR-3.4 — Hapus Soal
- Endpoint: `DELETE /api/admin/challenges/:id`
- Soal tidak dapat dihapus jika sudah ada minimal 1 solve → return 400 dengan pesan jelas
- Jika belum ada solve: hapus soal beserta hint-nya (cascade)

### FR-3.5 — Toggle Aktif/Nonaktif
- Endpoint: `PATCH /api/admin/challenges/:id/toggle`
- Mengubah `is_active` antara `true` dan `false`
- Soal nonaktif tidak tampil ke peserta, tapi data solve tetap tersimpan

### FR-3.6 — List Soal (Admin)
- Endpoint: `GET /api/admin/challenges`
- Return semua soal termasuk yang nonaktif
- Include statistik: jumlah solver, jumlah total attempt
- Diurutkan berdasarkan `order_index`

### FR-3.7 — List Soal (Peserta)
- Endpoint: `GET /api/challenges`
- Return hanya soal aktif
- **Flag tidak diikutkan** dalam response
- Include status peserta: `solved`, `unlocked`, `locked`
- Include jumlah hint tersedia per soal

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/challenges` | Peserta | List soal aktif + status peserta |
| GET | `/api/challenges/:id` | Peserta | Detail soal (jika unlocked) |
| GET | `/api/admin/challenges` | Admin | List semua soal + statistik |
| POST | `/api/admin/challenges` | Admin | Buat soal baru |
| PUT | `/api/admin/challenges/:id` | Admin | Edit soal |
| DELETE | `/api/admin/challenges/:id` | Admin | Hapus soal |
| PATCH | `/api/admin/challenges/:id/toggle` | Admin | Toggle aktif/nonaktif |
| PATCH | `/api/admin/challenges/reorder` | Admin | Update urutan soal (bulk) |

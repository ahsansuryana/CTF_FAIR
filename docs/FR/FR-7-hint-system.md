# FR-7: Hint System

## Deskripsi
Setiap soal dapat memiliki satu atau lebih hint yang dibuat oleh admin. Peserta dapat membuka hint kapan saja tanpa pengurangan poin.

---

## Requirements Detail

### FR-7.1 — Struktur Hint
- Setiap hint terikat ke satu challenge
- Hint memiliki `order_index` (urutan tampil)
- Konten hint berupa teks (mendukung Markdown)

### FR-7.2 — Tampilan Hint ke Peserta
- Endpoint: `GET /api/challenges/:id/hints`
- Hanya dapat diakses jika challenge `unlocked` atau `solved`
- Return semua hint challenge tersebut (langsung visible, tidak perlu "beli")
- Tidak ada pengurangan poin untuk membuka hint

### FR-7.3 — CRUD Hint (Admin)
- Endpoint: `POST /api/admin/challenges/:id/hints` — tambah hint
- Endpoint: `PUT /api/admin/hints/:hintId` — edit hint
- Endpoint: `DELETE /api/admin/hints/:hintId` — hapus hint
- Endpoint: `PATCH /api/admin/challenges/:id/hints/reorder` — ubah urutan hint

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/challenges/:id/hints` | Peserta | Lihat semua hint soal |
| POST | `/api/admin/challenges/:id/hints` | Admin | Tambah hint |
| PUT | `/api/admin/hints/:hintId` | Admin | Edit hint |
| DELETE | `/api/admin/hints/:hintId` | Admin | Hapus hint |

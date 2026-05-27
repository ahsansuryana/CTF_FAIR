# US-9: Manajemen Soal (CRUD)

**As an** admin,
**I want** membuat, mengedit, menghapus, dan mengatur urutan soal dari dashboard,
**So that** saya bisa menyiapkan konten kompetisi secara fleksibel tanpa menyentuh kode atau database langsung.

## Acceptance Criteria

- [ ] Dashboard menampilkan tabel semua soal dengan info: judul, kategori, poin, urutan, status aktif, jumlah solver
- [ ] Tombol "Tambah Soal" membuka form dengan semua field yang diperlukan
- [ ] Form mendukung: judul, deskripsi (Markdown editor dengan preview), kategori, poin, flag, urutan, status aktif, Docker image (untuk web), upload attachment
- [ ] Tombol edit membuka form pre-filled dengan data soal yang ada
- [ ] Hapus soal: konfirmasi dialog → gagal jika sudah ada solver, berhasil jika belum ada
- [ ] Toggle aktif/nonaktif per soal tanpa form
- [ ] Re-ordering soal bisa dilakukan dengan drag-and-drop atau mengubah nilai `order_index`
- [ ] Hint dapat ditambah/edit/hapus di dalam form soal (sub-section)
- [ ] Semua perubahan langsung terlihat oleh peserta tanpa restart server

## Notes
- FR Terkait: [FR-3](../FR/FR-3-challenge-management.md), [FR-7](../FR/FR-7-hint-system.md)

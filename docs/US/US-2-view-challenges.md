# US-2: Melihat Daftar Soal

**As a** peserta,
**I want** melihat daftar soal yang tersedia beserta statusnya,
**So that** saya tahu soal mana yang sudah bisa saya kerjakan dan mana yang masih terkunci.

## Acceptance Criteria

- [ ] Halaman `/challenges` menampilkan semua soal aktif
- [ ] Setiap soal menampilkan: judul, kategori, poin, dan status (solved/unlocked/locked)
- [ ] Soal `solved` ditandai dengan badge hijau / checkmark
- [ ] Soal `locked` ditampilkan abu-abu dengan ikon gembok
- [ ] Klik soal `locked` → tampilkan pesan "Selesaikan soal sebelumnya terlebih dahulu"
- [ ] Klik soal `unlocked` atau `solved` → buka halaman detail soal
- [ ] Halaman detail menampilkan: judul, deskripsi (render Markdown), kategori, poin, tombol submit flag
- [ ] Untuk soal Web, halaman detail menampilkan tombol "Generate Instance"
- [ ] Jumlah hint yang tersedia ditampilkan per soal

## Notes
- FR Terkait: [FR-3](../FR/FR-3-challenge-management.md), [FR-4](../FR/FR-4-sequential-unlock.md)

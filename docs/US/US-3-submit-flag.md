# US-3: Submit Flag

**As a** peserta,
**I want** mengirimkan flag jawaban untuk soal yang sedang saya kerjakan,
**So that** saya mendapatkan poin dan bisa melanjutkan ke soal berikutnya.

## Acceptance Criteria

- [ ] Form submit flag tersedia di halaman detail soal (jika soal `unlocked`)
- [ ] Setelah submit flag benar: tampilkan notifikasi sukses + poin yang didapat
- [ ] Setelah submit benar: status soal berubah menjadi `solved`, soal berikutnya menjadi `unlocked`
- [ ] Setelah submit salah: tampilkan pesan "Flag salah" tanpa informasi tambahan
- [ ] Jika soal sudah pernah di-solve: tampilkan pesan "Kamu sudah menyelesaikan soal ini" tanpa error
- [ ] Setelah 10 submit dalam 1 menit: tampilkan pesan rate limit
- [ ] Submit tidak bisa dilakukan jika event sudah berakhir
- [ ] Scoreboard diperbarui real-time setelah solve berhasil

## Notes
- FR Terkait: [FR-5](../FR/FR-5-flag-submission.md), [FR-10](../FR/FR-10-rate-limiting.md)

# US-14: Kontrol Timer Event

**As an** admin,
**I want** bisa memulai dan menghentikan event secara manual,
**So that** saya punya kendali penuh terhadap jalannya kompetisi.

## Acceptance Criteria

- [ ] Tombol "Mulai Event" tersedia di dashboard jika event belum berjalan
- [ ] Tombol "Hentikan Event" tersedia jika event sedang berjalan
- [ ] Konfirmasi dialog muncul sebelum stop event
- [ ] Saat event di-stop: semua Docker instance dihentikan otomatis
- [ ] Saat event di-stop: peserta tidak dapat submit flag lagi
- [ ] Status event ditampilkan jelas di dashboard: "Belum Mulai", "Sedang Berjalan", "Berakhir"
- [ ] Timer event menghitung mundur di halaman dashboard

## Notes
- FR Terkait: [FR-12](../FR/FR-12-event-timer.md)

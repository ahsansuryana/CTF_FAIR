# US-6: Melihat Scoreboard

**As a** pengunjung atau peserta,
**I want** melihat papan skor real-time tanpa harus login,
**So that** saya (dan penonton) dapat memantau posisi ranking selama event berlangsung.

## Acceptance Criteria

- [ ] Halaman `/scoreboard` dapat diakses tanpa login
- [ ] Menampilkan ranking: nomor urut, username, total poin, jumlah solve, waktu solve terakhir
- [ ] Update otomatis saat ada peserta yang solve (tanpa refresh halaman)
- [ ] Jika event belum mulai → tampilkan pesan "Event belum dimulai"
- [ ] Saat scoreboard difreeze → tetap tampilkan data terakhir (tidak ada indikator freeze)
- [ ] Tampil responsif di desktop dan mobile

## Notes
- FR Terkait: [FR-8](../FR/FR-8-realtime-scoreboard.md), [FR-14](../FR/FR-14-public-scoreboard.md)

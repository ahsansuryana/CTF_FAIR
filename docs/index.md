# CTF FAIR — Documentation Index

> Baca file ini terlebih dahulu. Index ini dirancang untuk menghemat token coding agent — baca hanya file yang relevan dengan task yang sedang dikerjakan.

## Metadata Proyek

| Key | Value |
|-----|-------|
| **Nama** | CTF FAIR |
| **Tipe** | Platform CTF self-hosted, open source |
| **Lisensi** | MIT |
| **Flag Format** | `CTF_ITFAIR{...}` |
| **Tech** | React + Express + PostgreSQL + Docker |
| **Deployment** | Docker Compose + Nginx (HTTPS) |

---

## Peta Dokumen

| File | Isi | Baca jika... |
|------|-----|--------------|
| [`SRS.md`](./SRS.md) | Scope, aktor, definisi, gambaran sistem | Setup awal, memahami konteks proyek |
| [`tech-stack.md`](./tech-stack.md) | Stack lengkap + versi + justifikasi | Install dependencies, setup project |
| [`architecture.md`](./architecture.md) | Diagram komponen, alur data, DB schema | Membangun struktur folder, relasi antar service |
| [`security.md`](./security.md) | Auth, RBAC, Docker isolation, rate limit, headers | Implementasi auth, middleware, Docker, Nginx |
| [`NFR.md`](./NFR.md) | Performa, skalabilitas, ketersediaan, maintainability | Optimasi, deployment, CI/CD |
| [`FR/index.md`](./FR/index.md) | Index semua Functional Requirements | Melihat daftar FR sebelum membuka file spesifik |
| [`US/index.md`](./US/index.md) | Index semua User Stories | Melihat daftar US sebelum membuka file spesifik |

---

## Functional Requirements — Quick Reference

| ID | Judul | File |
|----|-------|------|
| FR-1 | Authentication | [`FR/FR-1-authentication.md`](./FR/FR-1-authentication.md) |
| FR-2 | Setup Wizard | [`FR/FR-2-setup-wizard.md`](./FR/FR-2-setup-wizard.md) |
| FR-3 | Challenge Management | [`FR/FR-3-challenge-management.md`](./FR/FR-3-challenge-management.md) |
| FR-4 | Sequential Unlock | [`FR/FR-4-sequential-unlock.md`](./FR/FR-4-sequential-unlock.md) |
| FR-5 | Flag Submission & Validasi | [`FR/FR-5-flag-submission.md`](./FR/FR-5-flag-submission.md) |
| FR-6 | Docker Instance Management | [`FR/FR-6-docker-instance-management.md`](./FR/FR-6-docker-instance-management.md) |
| FR-7 | Hint System | [`FR/FR-7-hint-system.md`](./FR/FR-7-hint-system.md) |
| FR-8 | Real-time Scoreboard | [`FR/FR-8-realtime-scoreboard.md`](./FR/FR-8-realtime-scoreboard.md) |
| FR-9 | Admin Dashboard | [`FR/FR-9-admin-dashboard.md`](./FR/FR-9-admin-dashboard.md) |
| FR-10 | Rate Limiting & Anti-Cheat | [`FR/FR-10-rate-limiting.md`](./FR/FR-10-rate-limiting.md) |
| FR-11 | Audit Logging | [`FR/FR-11-audit-logging.md`](./FR/FR-11-audit-logging.md) |
| FR-12 | Event Timer Management | [`FR/FR-12-event-timer.md`](./FR/FR-12-event-timer.md) |
| FR-13 | Participant Management | [`FR/FR-13-participant-management.md`](./FR/FR-13-participant-management.md) |
| FR-14 | Public Scoreboard | [`FR/FR-14-public-scoreboard.md`](./FR/FR-14-public-scoreboard.md) |

---

## User Stories — Quick Reference

| ID | Judul | Aktor | File |
|----|-------|-------|------|
| US-1 | Login | Peserta | [`US/US-1-login.md`](./US/US-1-login.md) |
| US-2 | Melihat Daftar Soal | Peserta | [`US/US-2-view-challenges.md`](./US/US-2-view-challenges.md) |
| US-3 | Submit Flag | Peserta | [`US/US-3-submit-flag.md`](./US/US-3-submit-flag.md) |
| US-4 | Generate Web Instance | Peserta | [`US/US-4-generate-web-instance.md`](./US/US-4-generate-web-instance.md) |
| US-5 | Melihat Hint | Peserta | [`US/US-5-view-hints.md`](./US/US-5-view-hints.md) |
| US-6 | Melihat Scoreboard | Publik / Peserta | [`US/US-6-view-scoreboard.md`](./US/US-6-view-scoreboard.md) |
| US-7 | Melihat Progress Pribadi | Peserta | [`US/US-7-view-personal-progress.md`](./US/US-7-view-personal-progress.md) |
| US-8 | Setup Wizard | Admin | [`US/US-8-setup-wizard.md`](./US/US-8-setup-wizard.md) |
| US-9 | Manajemen Soal | Admin | [`US/US-9-manage-challenges.md`](./US/US-9-manage-challenges.md) |
| US-10 | Manajemen Peserta | Admin | [`US/US-10-manage-participants.md`](./US/US-10-manage-participants.md) |
| US-11 | Konfigurasi Event | Admin | [`US/US-11-configure-event-settings.md`](./US/US-11-configure-event-settings.md) |
| US-12 | Monitor Submission | Admin | [`US/US-12-monitor-submissions.md`](./US/US-12-monitor-submissions.md) |
| US-13 | Manajemen Docker Instance | Admin | [`US/US-13-manage-docker-instances.md`](./US/US-13-manage-docker-instances.md) |
| US-14 | Kontrol Timer Event | Admin | [`US/US-14-control-event-timer.md`](./US/US-14-control-event-timer.md) |
| US-15 | Freeze Scoreboard | Admin | [`US/US-15-freeze-scoreboard.md`](./US/US-15-freeze-scoreboard.md) |
| US-16 | Lihat Audit Log | Admin | [`US/US-16-view-audit-logs.md`](./US/US-16-view-audit-logs.md) |

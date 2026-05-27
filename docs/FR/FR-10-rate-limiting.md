# FR-10: Rate Limiting & Anti-Cheat

## Rate Limits

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `POST /api/auth/login` | 5 req | 15 menit | Per IP |
| `POST /api/challenges/:id/submit` | 10 req | 1 menit | Per User |
| `POST /api/instances/generate` | 5 req | 1 menit | Per User |
| Semua `/api/*` | 200 req | 1 menit | Per IP |

## Anti-Cheat Measures

- **Rate limit submit** mencegah brute force flag
- **Cooldown 30 detik** setelah 5 submit salah berturut-turut pada soal yang sama
- **Audit log IP**: semua submission dicatat dengan IP address — admin dapat audit secara manual
- **One solve per user per challenge**: UNIQUE constraint di DB
- **Flag tidak di-cache** di client (tidak ada di response API)

## Implementasi

```javascript
// Flag submission rate limiter
const flagSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user.id + ':' + req.params.id,
  message: { error: 'Terlalu banyak percobaan. Tunggu sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Response Saat Rate Limit Terlampaui
- HTTP 429 Too Many Requests
- Header `Retry-After` berisi detik tunggu
- Body: `{ "error": "Terlalu banyak percobaan. Coba lagi dalam X detik." }`

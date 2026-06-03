# Product

## Register

product

## Users

Two distinct user types sharing the same platform:

**CTF Participants (students):** Competing individually to solve cybersecurity challenges across web, crypto, forensics, stegano, and OSINT categories. In a focused, time-pressure mindset during live events. Their primary tasks: browse challenges, submit flags, track rank on the scoreboard, manage Docker challenge instances. Need speed, clarity, and zero friction — every millisecond between reading a challenge and submitting a flag is cognitive overhead.

**CTF Administrators:** Running the competition — creating challenges, managing participants, monitoring submissions, reviewing audit logs, controlling event lifecycle (start/stop/freeze). In a workflow/tool mindset during event prep and live monitoring. Need efficient information density, clear status indicators, and quick CRUD operations.

## Product Purpose

CTF FAIR is a self-hosted, open-source Capture The Flag platform that lets anyone deploy a cybersecurity competition with a single `docker compose up -d`. It exists because existing CTF platforms are either SaaS-only (no self-host), over-engineered, or tied to specific competition formats. Success looks like: an organizer spins it up in 5 minutes, participants solve challenges without touching the administration layer, and the platform disappears into the background — invisible when it works.

## Brand Personality

**Bold, Clear, Authoritative.** This is a cybersecurity competition — the design communicates confidence and precision, not playfulness. The tone is direct and technical, not gamified or casual. Every interaction is snappy and purposeful. The amber accent signals urgency and importance without being aggressive. Dark theme is the default because that's the environment security work happens in: late nights, focus mode, terminals.

## Anti-references

No gamification or toy-like elements. Avoid bright primary colors, cartoon icons, progress bars for the sake of decoration, or anything that makes a cybersecurity competition feel like a mobile game. This is closer to a professional tool than a game, even though the participants are competing.

## Design Principles

1. **Speed over ornament.** Every UI decision must pass the test: does this help a participant submit a flag faster or an admin find a problem faster? If not, cut it.
2. **One user at a time.** The participant experience and admin experience are separate products sharing a backend. Don't compromise one to serve the other. The admin panel can be dense; the participant dashboard must be sparse.
3. **Dark as identity, not fashion.** The dark theme isn't "dark mode" — it's the native environment. No fake terminal aesthetic, no CRT scanlines, no green-on-black retro hacker clichés. Clean dark surfaces with intentional contrast ratios.
4. **State is the interface.** Locked, available, solved, running, expired, frozen — the platform's core vocabulary is states. Every state transition should be visibly unambiguous without color alone (use icons, text, borders, and motion).
5. **Authority without intimidation.** New CTF participants should feel welcome, not overwhelmed. Technical precision is the tone, not jargon or gatekeeping. Error messages explain what to do next, not just what went wrong.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Dark theme contrast is the primary risk area: body text on bg-base and bg-surface must pass 4.5:1. The amber accent against dark surfaces needs ≥3:1 for UI components and ≥4.5:1 for text. All state indicators (locked/solved/running) must use icon + text + color, not color alone. Supports reduced motion via `prefers-reduced-motion` query — every Framer Motion animation has a non-animated fallback.

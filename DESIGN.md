---
name: CTF FAIR
description: Self-hosted Capture The Flag competition platform
colors:
  midnight: "#0d0d10"
  surface: "#16161a"
  elevated: "#1e1e24"
  muted-bg: "#252530"
  border-subtle: "#2a2a35"
  border-default: "#3a3a48"
  border-strong: "#52526a"
  text-primary: "#f0f0f5"
  text-secondary: "#a0a0b8"
  text-muted: "#787898"
  text-disabled: "#3a3a50"
  ember-shadow: "#d4820a"
  ember-hover: "#e8950f"
  ember-subtle: "rgba(212, 130, 10, 0.12)"
  success: "#22c55e"
  danger: "#ef4444"
  warning: "#f59e0b"
  info: "#3b82f6"
  category-web: "#3b82f6"
  category-crypto: "#a855f7"
  category-forensics: "#f59e0b"
  category-stegano: "#22c55e"
  category-osint: "#ef4444"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontWeight: 600
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "Sora, sans-serif"
    fontWeight: 600
    fontSize: "clamp(1.25rem, 2vw, 1.5rem)"
    lineHeight: 1.3
  title:
    fontFamily: "Sora, sans-serif"
    fontWeight: 500
    fontSize: "1.125rem"
    lineHeight: 1.4
  body:
    fontFamily: "Sora, sans-serif"
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.6
  label:
    fontFamily: "Sora, sans-serif"
    fontWeight: 500
    fontSize: "0.75rem"
    lineHeight: 1.5
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.5
rounded:
  card: "8px"
  button: "6px"
  badge: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  sidebar: "240px"
  sidebar-collapsed: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ember-shadow}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ember-hover}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.muted-bg}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.button}"
    padding: "6px 12px"
    border: "1px solid {colors.border-default}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.button}"
    padding: "6px 12px"
  input-default:
    backgroundColor: "{colors.muted-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
    border: "1px solid {colors.border-default}"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
    border: "1px solid {colors.border-default}"
  badge-category:
    backgroundColor: "rgba(59, 130, 246, 0.2)"
    textColor: "#3b82f6"
    rounded: "{rounded.badge}"
    padding: "2px 8px"
    border: "1px solid rgba(59, 130, 246, 0.3)"
---

# Design System: CTF FAIR

## 1. Overview

**Creative North Star: "The Briefing Room"**

This is a space designed for focus, not spectacle. Like a military briefing room before an operation — the walls are dark, the light is directed at the mission, and every element on the board earns its place. Nothing decorative, nothing playful, nothing that distracts from the task.

The interface is an instrument of the competition, not a game itself. Participants scan challenge cards, submit flags, and track standings. Administrators manage the event from a control panel that prioritizes information density over onboarding delight. Both surfaces share the same visual vocabulary: layered dark tones, amber signals, monospaced data, and a deliberate absence of shadow.

**Key Characteristics:**
- Dark as native environment, not as a feature
- Tonal layering replaces shadow — depth through lightness, not blur
- Amber as signal (urgency, attention, the active state)
- Information over ornament on every surface
- State is communicated through icon + text + color, never color alone
- Reduced motion is the baseline; animation enhances, never gates

## 2. Colors

The palette is anchored in **Midnight**, the near-black body color, and **Ember Shadow**, the amber accent that carries all interactive signals. Chroma is reserved for category badges and semantic states; the neutral ramp occupies most of the surface area.

### Primary
- **Ember Shadow** (#d4820a): The single interactive accent. Used for primary buttons, active nav items, point values, rank indicators, and the logo. Its rarity is deliberate — when amber appears, the eye knows something demands attention. Never used as a background tint.
- **Ember Hover** (#e8950f): Primary button hover state. Brighter, lighter, one step up the same hue.

### Neutral
- **Midnight** (#0d0d10): The body background. The darkest value in the ramp. True near-black with a slight cool cast — not pure #000, which would collapse depth.
- **Surface** (#16161a): Card, sidebar, and container backgrounds. One step off Midnight, creates the first tonal layer without a border.
- **Elevated** (#1e1e24): Hover states for surface-level elements. Modals and dropdowns.
- **Muted BG** (#252530): Input backgrounds, secondary button backgrounds, the deepest tonal inset.
- **Border Subtle** (#2a2a35): Table dividers, low-emphasis separators.
- **Border Default** (#3a3a48): Card borders, input borders, standard divider.
- **Border Strong** (#52526a): Focus-visible indicators, active borders.
- **Text Primary** (#f0f0f5): Body text and headings. The whitest value in the palette.
- **Text Secondary** (#a0a0b8): Secondary prose, descriptions. 4.5:1 against Surface.
- **Text Muted** (#787898): Placeholder text, timestamps, non-essential metadata. 4.5:1 against Surface.
- **Text Disabled** (#3a3a50): Locked challenges, disabled controls. Visible but unactionable.

### Semantic
- **Success** (#22c55e): Correct flag submissions, solved challenge indicators.
- **Danger** (#ef4444): Errors, destructive actions, logout text.
- **Warning** (#f59e0b): Scoreboard freeze, event-ended states.
- **Info** (#3b82f6): General informational callouts, links.

### Category (Challenge Types)
Each category badge uses a 20% opacity bg, the full-saturation text, and a 30% opacity border — all from the same hue.
- **Web** (#3b82f6, blue)
- **Crypto** (#a855f7, purple)
- **Forensics** (#f59e0b, amber)
- **Stegano** (#22c55e, green)
- **OSINT** (#ef4444, red)

### Named Rules
**The Ember Rarity Rule.** The amber accent occupies ≤5% of any given screen. Its scarcity is its power — when Ember Shadow appears, the user's attention follows.

**The Chroma-Only-When-Meaningful Rule.** Chroma is reserved for semantics: solved (green), locked (muted), error (red), category (hue-coded). Gray backgrounds stay gray; adding tint to neutrals for "warmth" is forbidden.

**The Three-Signal Rule.** Every state indicator must carry three signals: an icon, a text label, and a color. Never color alone.

## 3. Typography

**Display & Body Font:** Sora (sans-serif, Google Fonts)
**Mono Font:** IBM Plex Mono (monospace, Google Fonts)

**Character:** A single sans typeface carries the system — Sora's geometric clarity with open apertures reads well at small sizes and authoritative at large. IBM Plex Mono enters only for data: scores, timestamps, code snippets, port numbers. The pairing is functional, not decorative: the contrast axis is proportion (proportional vs. monospace) rather than genre (serif vs. sans).

### Hierarchy
- **Display** (Sora 600, `clamp(1.5rem, 3vw, 2.25rem)`, 1.25): Page titles, event name on scoreboard. `text-wrap: balance`.
- **Headline** (Sora 600, `clamp(1.25rem, 2vw, 1.5rem)`, 1.3): Section headings, challenge detail title. `text-wrap: balance`.
- **Title** (Sora 500, 1.125rem, 1.4): Card titles, admin section headers.
- **Body** (Sora 400, 0.875rem, 1.6): The default type size. Challenge descriptions, table content. Max line length 75ch.
- **Label** (Sora 500, 0.75rem, 1.5, 0.05em tracking, uppercase): Table headers, section eyebrows, category badges. Used sparingly — not above every section.
- **Mono** (IBM Plex Mono 400, 0.875rem, 1.5): Points, rank numbers, timestamps, instance port, code blocks. Distinctive by being the only non-proportional typeface on screen.

### Named Rules
**The Mono-Is-Data Rule.** IBM Plex Mono is reserved for user-facing data values: scores, ranks, ports, timestamps, flags. Navigation, descriptions, and UI labels never use mono. If it's not a number or a code value, it's Sora.

## 4. Elevation

This system has no shadows. Depth is conveyed entirely through **tonal layering** — lighter surfaces sit on top of darker ones. The ramp is five steps: Midnight (body) → Surface (cards) → Elevated (modals) → Muted BG (inputs) → a border where surface meets surface.

The effect is a clean, planar hierarchy: every layer announces itself through its lightness, not through a drop shadow. Modals and dropdowns inherit the Elevated background with a 1px Border Subtle outline to separate them from Surface. Hover states on cards use a 1px border shift from Border Default to Border Strong, accompanied by a vertical lift (-2px translateY) that reads as the card moving toward the viewer rather than casting a shadow.

### Named Rules
**The No-Shadow Rule.** box-shadow is prohibited for depth. The sole exception is the focus-visible ring (`accent-glow`), which is an accessibility requirement, not an elevation treatment. Card hover uses translateY and border-strength change, not shadow.

## 5. Components

### Buttons
- **Shape:** Gently curved edges (6px border-radius).
- **Primary:** Ember Shadow background, white text, 10px 24px padding. Hover shifts to Ember Hover. Transition: 150ms with snappy ease curve.
- **Secondary:** Muted BG background, Text Secondary color, 6px 12px padding, 1px Border Default stroke. Hover brightens text to Text Primary and shifts border to Border Strong.
- **Danger:** Transparent background, Danger text, 6px 12px padding. Hover background shifts to Danger at 10% opacity. Used for logout, destructive confirms.
- **Disabled:** Opacity 50%, cursor not-allowed. No hover treatment.

### Inputs / Fields
- **Style:** Muted BG fill, Border Default stroke, 6px radius, 10px 16px padding. Text Primary input text, Text Muted placeholder.
- **Focus:** Border shifts to Ember Shadow, 3px Ember Subtle ring via `accent-glow` box-shadow. 150ms transition.
- **Error:** Border shifts to Danger, accompanied by inline error text below the field.
- **Disabled:** Muted BG at lowered opacity, Text Disabled content.

### Cards / Containers
- **Corner Style:** 8px radius.
- **Background:** Surface.
- **Elevation:** No shadow. Depth via tonal contrast against Midnight body.
- **Border:** 1px Border Default. Hover shifts to Border Strong when actionable.
- **Internal Padding:** 24px.

### Challenge Cards (Signature)
- Active challenges: Surface background, Border Default stroke. Hover lifts -2px translateY, border shifts to Border Strong. Green border + tinted bg when solved. 50% opacity + Text Disabled + lock icon when locked. Category badge in top-left, points mono in top-right, title + truncated description below, status line at bottom.

### Badges / Category Tags
- **Style:** 4px radius, uppercase Label font. Background at 20% category hue, text at 100% category hue, 1px border at 30% category hue.

### Navigation (Admin Sidebar)
- **Style:** Surface background with Border Subtle right divider. 240px wide, collapses to 64px. Nav items use 6px radius, Text Secondary with 150ms hover transition. Active item: Ember Subtle background + Ember Shadow text. Collapse and logout pinned to bottom.

### Scoreboard Table
- **Style:** Border Default outer container, Border Subtle row dividers. Text Muted uppercase label headers. Hover row shifts to Muted BG at 50% opacity via `hover:bg-bg-muted/50`. Rank 1-3 use emoji indicators; rank 4+ use monospaced `#N`.

### Loading Spinner
- 32px, 2px Ember Shadow stroke with transparent top segment, circular, infinite 1s rotation. Rendered full-page centered.

### Named Rules
**The Card-Is-A-Link Rule.** Challenge cards on the participant dashboard are entire clickable surfaces. The card itself is the affordance — never a nested "View" button. The hover lift and border shift serve as the only signifiers.

## 6. Do's and Don'ts

### Do:
- **Do** use the tonal ramp (Midnight → Surface → Elevated → Muted BG) to create depth. No shadows.
- **Do** restrict amber accent to ≤5% of any screen. Its rarity is its authority.
- **Do** pair every state indicator with an icon, a text label, and a color — never alone.
- **Do** use monospaced type for data values only. All UI labels stay in Sora.
- **Do** keep body line length at 65–75ch maximum.
- **Do** apply `text-wrap: balance` on h1–h3 and `text-wrap: pretty` on prose.
- **Do** provide reduced-motion fallbacks for every animation via `prefers-reduced-motion`.
- **Do** use the snappy ease curve `cubic-bezier(0.16, 1, 0.3, 1)` for all micro-interactions.

### Don't:
- **Don't** use box-shadow for elevation. Depth comes from tonal contrast, not shadows.
- **Don't** use gradient text, glassmorphism, or noise-overlay blurs. Function over decoration.
- **Don't** place a tiny uppercase tracked eyebrow above every section. The Label style is for table headers and badges only.
- **Don't** use side-stripe borders (`border-left` > 1px as a colored accent). Use full borders or background tints instead.
- **Don't** use cartoon icons, gamification elements, or bright primary colors. This is a cybersecurity competition, not a mobile game.
- **Don't** use all-caps body copy. Uppercase is reserved for labels (≤4 words) and badges.
- **Don't** make the design louder than the data. The challenges are the content; the interface is invisible when it works.

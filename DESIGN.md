---
name: Market Impact Intelligence
description: Subway-map "impact chains" that turn a market move into evidence-backed cause and effect for novice Thai investors.
colors:
  chalk: "#EEF1F4"
  paper: "#FFFFFF"
  ink: "#0F1B2D"
  ink-muted: "#4A5568"
  rule: "#D5DBE3"
  navy: "#1B2A4A"
  line-oil: "#6B4EFF"
  line-inflation: "#0E8F9B"
  line-dollar: "#C8327C"
  positive: "#15803D"
  negative: "#C8261E"
  mixed: "#A16207"
typography:
  display:
    fontFamily: "var(--font-chakra), var(--font-anuphan), sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "var(--font-chakra), var(--font-anuphan), sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "var(--font-chakra), var(--font-anuphan), sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  stat:
    fontFamily: "var(--font-chakra)"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "var(--font-anuphan), \"Noto Sans Thai\", Tahoma, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "var(--font-anuphan)"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  pill: "999px"
  lg: "28px"
  md: "20px"
  sm: "14px"
  xs: "12px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "22px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "50px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "40px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px 18px"
---

# Design System: Market Impact Intelligence

## Overview

**Creative North Star: "The Transit Map of Cause and Effect"**

The whole system reads as a subway map for market reasoning: a market story is a colored "line" (oil, inflation, dollar) running through fixed "stations" — event → economy → industry → company — and every station is either a solid stop (strong evidence) or a dashed one (a factor that could change the outcome). This is not a decorative metaphor; it is the actual information architecture, so the visual language exists to make cause-and-effect legible at a glance, not to look impressive.

The product is explicitly not a news site and never recommends buying or selling, so the surface stays calm and editorial rather than urgent or salesy: chalk-and-ink neutrals carry almost the whole UI, the three line colors are reserved for their one job (marking which story a piece of content belongs to), and green/red/amber are reserved for Positive/Negative/Mixed Exposure and nothing else. Corners are soft and forgiving everywhere (pill chips, 20–28px cards), borders do the separating work instead of shadows, and the one place the system allows itself to feel playful — the homepage's XP/streak/quiz "learning path" — is deliberately fenced off from the serious reading surfaces (event pages, evidence pages, calendar).

**Key Characteristics:**
- Mobile-first single column (460px, 560px ≥900px), never a wide desktop layout
- Flat and bordered by default; shadows appear only in the gamified quiz interaction
- One reserved color per market "line," never reused for anything else
- Fact / Analysis / Uncertainty rendered as three distinct mark shapes, not just three colors
- Chakra Petch for anything numeric or declarative (headlines, stats, tickers); Anuphan for everything read at length

## Colors

Neutrals carry the page; color is spent only where it means something specific.

### Primary
- **Navy** (`#1B2A4A`): the one solid UI color — primary CTA buttons, toasts, the "why this stock" pull-quote note. Reserved for the system's own voice, not for market data.

### Secondary — the three line colors (equal rank, not a hue ramp)
- **Oil Violet** (`#6B4EFF`): the oil line — badges, chip toggles, impact-map track, chain rail, wherever oil-line content is marked.
- **Inflation Teal** (`#0E8F9B`): the inflation/rates line, same treatment.
- **Dollar Magenta** (`#C8327C`): the dollar line, same treatment.

### Tertiary — exposure semantics (fixed meaning, never repurposed)
- **Positive Green** (`#15803D`): Positive Exposure only.
- **Negative Red** (`#C8261E`): Negative Exposure only.
- **Mixed Amber** (`#A16207`): Mixed Exposure only; pairs with a dashed stroke, not just the color.

### Neutral
- **Chalk** (`#EEF1F4`): page background.
- **Paper** (`#FFFFFF`): card/surface background, floats just above Chalk.
- **Ink** (`#0F1B2D`): primary text.
- **Ink Muted** (`#4A5568`): secondary text, timestamps, captions.
- **Rule** (`#D5DBE3`): every border and divider in the system.

### Named Rules
**The One Job Per Color Rule.** A line color (violet/teal/magenta) marks which market story something belongs to and nothing else; an exposure color (green/red/amber) marks Positive/Negative/Mixed and nothing else. The two palettes never swap jobs, and no other UI color is invented outside them.

**The Dark Mode Mirror Rule.** Every token above has a confirmed dark-mode counterpart (e.g. Chalk → `#0D1420`, Ink → `#E8EDF4`, line colors lighten to stay legible on the darker ground). Dark mode is a first-class palette swap via `:root[data-theme="dark"]` / `prefers-color-scheme`, not an afterthought filter.

## Typography

**Display/Headline/Title Font:** Chakra Petch (`var(--font-chakra)`, falls back to Anuphan then sans-serif)
**Body Font:** Anuphan (`var(--font-anuphan)`, falls back to "Noto Sans Thai", Tahoma, sans-serif)

**Character:** Chakra Petch's geometric, slightly technical letterforms carry every number and every declarative headline (market mood, event titles, tickers, the giant abnormal-return figure) — it's the system's "this is a measurement" voice. Anuphan carries the actual reading (explanations, Q&A, evidence notes) in a warmer, longer-form register. The pairing exists to let a reader's eye separate "here is a fact/number" from "here is the explanation of it" without reading a single word.

### Hierarchy
- **Display** (700, 38px, 1.15 line-height): the homepage mood sentence — the single biggest, boldest statement on the site.
- **Headline** (700, 32px, 1.2): event-page titles.
- **Stat** (700, 52px, 1.0): the "why this stock" giant ticker/return figure — numbers only, never prose.
- **Title** (700, 20px, 1.3): section headers (`h2`), card titles, sign-card headlines.
- **Body** (400, 15px, 1.65): all reading copy, Anuphan.
- **Label** (400, 12–13px): captions, timestamps, muted metadata, the "ข้อมูลสมมติ" / source-count lines.

### Named Rules
**The Numbers-Wear-Chakra Rule.** Any rendered market figure (price, return, ticker, XP count, level, pill amount) uses Chakra Petch, even inline inside an Anuphan sentence. It is the system's tell that "this specific span is a measurement."

## Layout

Single mobile column, `max-width: 460px` centered via `.wrap`, widening only slightly to `560px` at `≥900px` — the product never adopts a conventional multi-column desktop layout, on the theory that a phone-width reading column is the honest form factor for its audience. Side gutter is a flat `20px`. Vertical rhythm between major sections is generous and consistent (`.sec { margin-top: 36px }`), while internal card padding sits in the 14–22px range depending on density. The bottom tab bar is fixed, translucent (`backdrop-filter: blur(8px)`), and reserves `96px` of bottom padding on every scrollable screen so content never sits under it.

## Elevation & Depth

The system is flat by default: separation between surfaces comes from a `1px solid` Rule-colored border and a Paper-vs-Chalk background swap, not shadows. The one deliberate exception is the homepage quiz: its answer buttons use a hard, non-blurred `box-shadow: 0 4px 0` in a game-controller style that visibly compresses to `0 0 0` on press — a tactile, skeuomorphic cue reserved for the gamified layer, never used on a reading surface.

### Named Rules
**The Flat-Reading, Tactile-Play Rule.** Event pages, evidence pages, search, and the calendar stay flat (borders only). Shadows are permitted only inside the homepage's learning-path/quiz components, where a physical "pressable" feeling is the point.

## Shapes

Corners are soft everywhere and scale with a component's weight: full pill (`999px`) for chips, badges, and status pills; large (`20–28px`) for cards and the impact-map container; medium (`14–16px`) for buttons, inputs, and the CTA; small (`12px`) for icon buttons and inline chips. Nothing in the system uses a sharp (0px) corner. Exposure is also carried in stroke style, not just color: a solid stroke means strong evidence, a dashed stroke means uncertainty — this applies to card borders, chain rails, and impact-map tracks alike.

## Components

### Buttons
- **Primary CTA:** Navy background, white text, `14px` radius, `50px` min-height, centered content — used for the one primary action on a card (e.g. "อ่านเรื่องนี้ใน 1 นาที").
- **Icon button:** `44×44px`, `14px` radius, Paper background with a Rule border — top-bar actions (theme toggle, back).
- **Chip (toggle):** pill-shaped, transparent by default, `1.5px` Rule border; selected state fills with a 12%-tint of the relevant line color and switches the border to that line color.

### Cards / Containers
- **Corner style:** 20–28px depending on prominence (the impact-map card and quiz get the largest radius on the page).
- **Background:** Paper on Chalk.
- **Border:** `1px solid` Rule; no shadow.
- **Internal padding:** 16–22px, denser (12–14px) for list-style cards like FAQ rows.

### Pills / Badges
- **Exposure pill:** `999px` radius, `1.5px` border in the exposure color, text in the same color; Mixed additionally switches the border to dashed — color alone is never the only signal.
- **Line badge:** pill with a small solid dot in the line color plus a 14%-tint background fill.

### Evidence Marks
- **Fact:** a filled `16px` circle in Ink.
- **Analysis:** a `16px` circle, hollow, `3px` Ink stroke.
- **Uncertainty:** a `16px` circle, hollow, `3px` dashed Mixed-amber stroke.
These three shapes are the system's most load-bearing signature: they appear identically in the impact-map legend, the chain rail, and the Fact/Analysis/Uncertainty list, and must never be redrawn as anything but these three forms.

### Inputs / Fields
- **Style:** `1.5px` Rule border, `16px` radius, `52px` min-height, `16px` font (prevents iOS zoom-on-focus).
- **Focus:** system-wide `3px` solid-oil-violet outline with `2px` offset and `6px` corner rounding (`:focus-visible`), used identically on every interactive element, not just inputs.

### Navigation (tab bar)
- Fixed to viewport bottom, translucent Paper background with `blur(8px)`, `1px` top border.
- Inactive items: Ink Muted, no weight change. Active item: Ink, `600` weight, 12%-tint pill background in Oil Violet — note this is the one place a line color is repurposed as a generic "active" indicator rather than a line marker, which is an intentional, isolated exception.

### Journey / Quiz (signature, homepage-only)
A progress rail with filled/hollow "station" dots animating to a solid fill as the day's three learning stations complete, paired with the tactile quiz buttons described under Elevation & Depth. This entire component family is confined to the homepage; it does not appear on event, evidence, search, or calendar pages.

## Do's and Don'ts

### Do:
- **Do** keep a line color meaning "this belongs to the oil/inflation/dollar story" everywhere except the tab bar's single active-state exception.
- **Do** pair every exposure color with its stroke-style twin (solid/dashed) so the signal survives grayscale or color-blindness.
- **Do** set every rendered number in Chakra Petch, even mid-sentence.
- **Do** keep event/evidence/search/calendar surfaces flat (border-only); reserve shadow for the homepage quiz.
- **Do** honor the `460px` (`560px` ≥900px) reading column; this is a phone-first product, not a responsive-desktop one.

### Don't:
- **Don't** introduce a new accent color outside the three line colors and three exposure colors — Navy and the neutrals are the only other spend the palette allows.
- **Don't** use green/red/amber for anything other than Positive/Negative/Mixed Exposure, even decoratively.
- **Don't** add shadows to a reading surface (event, evidence, search, calendar) — that vocabulary belongs to the gamified homepage only.
- **Don't** use a sharp corner anywhere in the system.
- **Don't** widen the core content column into a conventional multi-column desktop layout.

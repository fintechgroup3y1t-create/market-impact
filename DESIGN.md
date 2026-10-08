---
name: Market Impact Intelligence
description: An exchange ticker board — the physical LED price board at a Thai brokerage — that turns a market move into evidence-backed cause and effect for novice Thai investors.
colors:
  chalk: "#EDEEEC"
  paper: "#FFFFFF"
  ink: "#14171A"
  ink-muted: "#5B6066"
  rule: "#D8DBDD"
  navy: "#1E2227"
  line-oil: "#B4720F"
  line-inflation: "#246B5B"
  line-dollar: "#9C2E42"
  positive: "#1E8A4C"
  negative: "#C4291E"
  mixed: "#9C4221"
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
  tag: "4px"
  sm: "6px"
  md: "8px"
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
    rounded: "{rounded.tag}"
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

**Creative North Star: "The Exchange Ticker Board"**

Redesigned 6 Oct 2026 from the original "subway map" concept. The whole system now reads as the physical LED price board at a Thai brokerage or bank branch: a dark board casing, amber as the one neutral "informational" accent (the universal ticker-board color for anything that isn't a price direction), sharp board-tile corners instead of soft rounded cards, and tabular monospace numerals for every number and ticker — the way every figure on a real board sits in its own fixed-width segment. A market "line" (oil, inflation, dollar) still runs through fixed stations — event → economy → industry → company — but each station now reads as a lit board module rather than a subway stop; solid vs. dashed still carries strong-evidence vs. uncertain exactly as before.

The product is still explicitly not a news site and never recommends buying or selling, so energy stays informational rather than salesy: the board casing (chalk/paper/ink neutrals) carries almost the whole UI, amber marks "this is a UI control, not a price," and green/red/amber are reserved for Positive/Negative/Mixed Exposure exactly as a real ticker board uses green/red for up/down. Corners are small and board-tile sharp everywhere (4–8px, never a soft pill), a thin 3px lit top-edge marks a card as its own board module, and the Fact/Analysis/Uncertainty mark shapes (filled/hollow/dashed circle) are unchanged — they were already a strong, load-bearing signature and the redesign keeps them as-is.

**Key Characteristics:**
- Mobile-first single column (460px, 560px ≥900px) — unchanged, still never a wide desktop layout
- Flat and bordered by default; a 3px amber top-edge marks a card as a "board module," not a shadow
- One reserved color per market "line," never reused for anything else
- Fact / Analysis / Uncertainty rendered as three distinct mark shapes, not just three colors — unchanged from the previous system
- Martian Mono (monospace, LED-board character) for anything numeric or declarative; Bai Jamjuree for everything read at length

## Colors

Neutrals carry the page; color is spent only where it means something specific.

### Primary
- **Board Charcoal / Navy** (`#1E2227` light-mode token name, dark-mode value `#353A40`): the one solid UI color — primary CTA buttons, toasts, the "why this stock" pull-quote note. Reserved for the system's own voice, not for market data.

### Secondary — the three line colors (equal rank, not a hue ramp)
- **Oil Amber** (`#B4720F`): the oil line — badges, chip toggles, strip nodes, chain rail, wherever oil-line content is marked. Also doubles as the system's one neutral UI accent (focus ring, active tab, card top-edge) since amber is the ticker board's own "informational" color.
- **Inflation Teal-Green** (`#246B5B`): the inflation/rates line, same treatment.
- **Dollar Garnet** (`#9C2E42`): the dollar line, same treatment.

### Tertiary — exposure semantics (fixed meaning, never repurposed)
- **Positive Green** (`#1E8A4C`): Positive Exposure only — the real ticker-board "up" color.
- **Negative Red** (`#C4291E`): Negative Exposure only — the real ticker-board "down" color.
- **Mixed Terracotta-Brown** (`#9C4221`): Mixed Exposure only; pairs with a dashed stroke, not just the color. Deliberately a different hue from the Oil line / UI-accent amber (shifted toward red-brown, not just darker) so the two jobs never read as the same color — confirmed by RGB distance in both themes (light ~57 units, dark ~45 units apart from Oil Amber), not just eyeballed in one theme.

### Neutral
- **Chalk** (`#EDEEEC`): page background — a cool paper grey (ledger-paper, not cream).
- **Paper** (`#FFFFFF`): card/surface background, floats just above Chalk.
- **Ink** (`#14171A`): primary text, near-black.
- **Ink Muted** (`#5B6066`): secondary text, timestamps, captions.
- **Rule** (`#D8DBDD`): every border and divider in the system.

### Named Rules
**The One Job Per Color Rule.** A line color (amber/teal-green/garnet) marks which market story something belongs to and nothing else; an exposure color (green/red/amber-brown) marks Positive/Negative/Mixed and nothing else. The two palettes never swap jobs, and no other UI color is invented outside them.

**The Dark Mode Mirror Rule.** Every token above has a confirmed dark-mode counterpart — this is the system's natural home (a real LED board is always dark): Chalk → `#0B0D0F`, Paper → `#16191D`, Ink → `#ECEEEF`, all line/exposure colors brighten to full LED intensity. Dark mode is a first-class palette swap via `:root[data-theme="dark"]` / `prefers-color-scheme`, not an afterthought filter. Light mode is a legitimate second rendition (a printed market report on ledger paper), not a discount version.

## Typography

**Display/Headline/Title/Number Font:** Martian Mono (`var(--font-chakra)` — variable name kept from the previous system so every component reference still resolves; the font bound to it changed)
**Body Font:** Bai Jamjuree (`var(--font-anuphan)`, falls back to "Noto Sans Thai", Tahoma, sans-serif)

**Character:** Martian Mono is a monospace, variable-width-digit face with genuine LED/segment-display character — it carries every number and every declarative headline (market mood, event titles, tickers, the giant abnormal-return figure), the system's "this is a measurement" voice, now literally rendered the way a board's digits sit in fixed-width segments. Martian Mono has no Thai glyphs by design (`subsets: ["latin"]` only): Thai text inside a Martian Mono element falls through the font stack to Bai Jamjuree automatically, so a Thai headline still reads in the body face while any English/numeric span inside the same string renders monospace — this per-glyph fallback is intentional, not a bug. Bai Jamjuree carries the actual reading (explanations, Q&A, evidence notes) — a Thai-Latin face with a squared, technical character that still fits the board world, chosen over a generic default like Sarabun or Noto Sans Thai.

### Hierarchy
- **Display** (700, 38px, 1.15 line-height): the homepage mood sentence — the single biggest, boldest statement on the site.
- **Headline** (700, 32px, 1.2): event-page titles.
- **Stat** (700, 52px, 1.0): the "why this stock" giant ticker/return figure — numbers only, never prose.
- **Title** (700, 20px, 1.3): section headers (`h2`), card titles, sign-card headlines.
- **Body** (400, 15px, 1.65): all reading copy, Bai Jamjuree.
- **Label** (400, 12–13px): captions, timestamps, muted metadata, the "ข้อมูลสมมติ" / source-count lines.

### Named Rules
**The Numbers-Wear-Mono Rule.** Any rendered market figure (price, return, ticker, XP count, level, pill amount) uses Martian Mono, even inline inside a Bai Jamjuree sentence. It is the system's tell that "this specific span is a measurement," now reinforced by `font-variant-numeric: tabular-nums` set globally on `body` so digits always align in a column the way a real board's segments do.

## Layout

Single mobile column, `max-width: 460px` centered via `.wrap`, widening only slightly to `560px` at `≥900px` — unchanged from the previous system; the product still never adopts a conventional multi-column desktop layout. Side gutter is a flat `20px`. Vertical rhythm between major sections is generous and consistent (`.sec { margin-top: 36px }`), while internal card padding sits in the 14–22px range depending on density. The bottom tab bar is fixed, translucent (`backdrop-filter: blur(8px)`), and reserves `96px` of bottom padding on every scrollable screen so content never sits under it.

## Elevation & Depth

The system is flat: separation between surfaces comes from a `1px solid` Rule-colored border and a Paper-vs-Chalk background swap — no shadows anywhere in the redesigned system (the previous system's one shadow exception, the homepage quiz, was removed from the product in a separate change before this redesign). A small number of prominent "module" cards (the impact-strip card, the 4-layer evidence card, the confidence card) additionally carry a `3px solid` Oil Amber top edge, reading as a lit board-segment edge; this is reserved for a few genuinely prominent cards, not applied everywhere — most cards stay plain-bordered.

## Shapes

Corners are small and board-tile sharp everywhere, scaling only slightly with a component's weight: `4px` for tags/pills/badges, `6px` for chips, inputs, and most cards, `8px` for the most prominent module cards (impact strip, evidence card, confidence card). Nothing in the system uses a fully soft/pill (`999px`) corner or a fully sharp (`0px`) one — the board-tile language sits deliberately between those two extremes. Exposure is also carried in stroke style, not just color: a solid stroke means strong evidence, a dashed stroke means uncertainty — this applies to card borders, chain rails, and the impact strip alike, unchanged from the previous system. The Fact/Analysis/Uncertainty evidence-mark circles stay fully circular (see Evidence Marks below) — that signature was never part of the corner-radius language and the redesign leaves it untouched.

## Components

### Buttons
- **Primary CTA:** Navy background, white text, `6px` radius, `50px` min-height, centered content — used for the one primary action on a card (e.g. "อ่านเรื่องนี้ใน 1 นาที").
- **Icon button:** `44×44px`, `6px` radius, Paper background with a Rule border — top-bar actions (theme toggle, back).
- **Chip (toggle):** `4px` radius, transparent by default, `1.5px` Rule border; selected state fills with a 12%-tint of the relevant line color and switches the border to that line color.

### Cards / Containers
- **Corner style:** `6–8px` depending on prominence (the impact-strip card and the 4-layer evidence card get the largest radius on the page, `8px`).
- **Background:** Paper on Chalk.
- **Border:** `1px solid` Rule; no shadow. A few prominent cards add a `3px solid` Oil Amber top edge (see Elevation & Depth).
- **Internal padding:** 16–22px, denser (12–14px) for list-style cards like FAQ rows.

### Pills / Badges
- **Exposure pill:** `4px` radius, `1.5px` border in the exposure color, text in the same color; Mixed additionally switches the border to dashed — color alone is never the only signal.
- **Line badge:** small-radius tag with a solid dot in the line color plus a 14%-tint background fill.

### Evidence Marks
- **Fact:** a filled `16px` circle in Ink.
- **Analysis:** a `16px` circle, hollow, `3px` Ink stroke.
- **Uncertainty:** a `16px` circle, hollow, `3px` dashed Mixed-amber stroke.
These three shapes are the system's most load-bearing signature, carried over unchanged from the previous visual world: they appear identically in the impact-strip legend, the chain rail, and the Fact/Analysis/Uncertainty list, and must never be redrawn as anything but these three forms, and never flattened into the board's sharp-corner language.

### Inputs / Fields
- **Style:** `1.5px` Rule border, `6px` radius, `52px` min-height, `16px` font (prevents iOS zoom-on-focus).
- **Focus:** system-wide `3px` solid-amber outline with `2px` offset and `4px` corner rounding (`:focus-visible`), used identically on every interactive element, not just inputs.

### Navigation (tab bar)
- Fixed to viewport bottom, translucent Paper background with `blur(8px)`, `1px` top border.
- Inactive items: Ink Muted, no weight change. Active item: Ink, `600` weight, 12%-tint tag background in Oil Amber — note this is the one place a line color is repurposed as a generic "active" indicator rather than a line marker, which is an intentional, isolated exception, unchanged from the previous system.

## Do's and Don'ts

### Do:
- **Do** keep a line color meaning "this belongs to the oil/inflation/dollar story" everywhere except the tab bar's single active-state exception.
- **Do** pair every exposure color with its stroke-style twin (solid/dashed) so the signal survives grayscale or color-blindness.
- **Do** set every rendered number in Martian Mono, even mid-sentence, and let Thai glyphs fall through to Bai Jamjuree automatically — never force a Thai span into the mono face.
- **Do** keep every surface flat (border-only); reserve the amber top-edge for a genuinely prominent "module" card, not every card.
- **Do** honor the `460px` (`560px` ≥900px) reading column; this is a phone-first product, not a responsive-desktop one.
- **Do** keep the Fact/Analysis/Uncertainty circles fully circular — they sit outside the board's corner-radius language entirely.

### Don't:
- **Don't** introduce a new accent color outside the three line colors and three exposure colors — Navy and the neutrals are the only other spend the palette allows.
- **Don't** use green/red/terracotta-brown for anything other than Positive/Negative/Mixed Exposure, even decoratively — Oil Amber (the UI accent) is a deliberately different hue from Mixed Terracotta-Brown so the two never get confused.
- **Don't** add shadows anywhere — the system is flat by contract now, with no gamified exception left in the product.
- **Don't** use a fully soft pill (`999px`) or fully sharp (`0px`) corner anywhere — the board-tile language is the small-but-not-zero middle ground.
- **Don't** widen the core content column into a conventional multi-column desktop layout.

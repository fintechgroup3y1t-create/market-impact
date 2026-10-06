---
name: Market Impact Intelligence
description: A modern fintech app surface — rounded glass cards, soft shadow, violet-mint gradient accent — that turns a market move into evidence-backed cause and effect for novice Thai investors.
colors:
  chalk: "#F5F4FC"
  paper: "#FFFFFF"
  ink: "#14161F"
  ink-muted: "#6B7088"
  rule: "#E6E4F2"
  navy: "#14161F"
  line-oil: "#C2820F"
  line-inflation: "#0E9C78"
  line-dollar: "#DB3368"
  line-ai: "#6B4EFF"
  positive: "#129459"
  negative: "#E0294F"
  mixed: "#9C6B14"
typography:
  display:
    fontFamily: "var(--font-chakra), var(--font-anuphan), sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "var(--font-chakra), var(--font-anuphan), sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.2
  title:
    fontFamily: "var(--font-chakra), var(--font-anuphan), sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.3
  stat:
    fontFamily: "var(--font-chakra)"
    fontSize: "48px"
    fontWeight: 800
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
  tag: "999px"
  sm: "14px"
  md: "20px"
  lg: "24px"
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
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Market Impact Intelligence

## Overview

**Creative North Star: "Modern Fintech"**

Redesigned 6 Oct 2026, same day as (and directly replacing) the previous "Exchange Ticker Board" concept — the owner was shown two live options (A: keep the ticker-board look and add motion/animation only; B: a full visual redesign toward a modern fintech/neo-bank app) and picked B. The whole system now reads as a contemporary fintech app (in the family of Revolut, Cash App, Robinhood): dark mode is the primary, default-feeling surface (a real neo-bank app is almost always dark-first), soft generously-rounded cards instead of sharp board-tiles, a subtle drop shadow plus (on a few prominent cards) a frosted-glass `backdrop-filter: blur()`, and two low-opacity violet/mint gradient blobs fixed behind every page for brand warmth without hurting readability. A market "line" (oil, inflation, dollar, AI Capex) still runs through fixed stations — event → economy → industry → company — rendered exactly as before (solid vs. dashed still carries strong-evidence vs. uncertain); only the skin around it changed.

The product is still explicitly not a news site and never recommends buying or selling, so despite the livelier skin, the information hierarchy stays disciplined: the new rounded-card-with-shadow treatment is reserved for genuinely prominent "module" surfaces (the impact-map card, the 4-layer evidence card, the confidence card, the home highlights list) — long, dense lists (stocks affected, FAQ, sources, evidence rows) stay flat bordered-divider rows exactly as the previous system intended, so a 10+ row list never turns into a stack of ten separate shadowed cards. This restraint is a deliberate carry-over from the previous DESIGN.md, not an oversight.

**Key Characteristics:**
- Mobile-first single column (460px, 560px ≥900px) — unchanged, still never a wide desktop layout
- Dark mode is the primary/native feeling of this system; light mode is a legitimate soft-lavender second rendition, not an afterthought
- Fully rounded corners everywhere (14–24px cards, 999px pills for chips/tags/buttons on cards) — the opposite extreme from the previous system's sharp board-tile language
- A few genuinely prominent cards get a soft shadow + `backdrop-filter: blur()`; everything else stays flat-bordered, exactly as before
- Fact / Analysis / Uncertainty rendered as three distinct mark shapes, not just three colors — **completely unchanged** from both previous systems; this signature survives every redesign
- Plus Jakarta Sans (geometric sans, fintech-app character) for anything numeric or declarative; Bai Jamjuree for everything read at length — same per-glyph Thai fallback trick as the previous system, just a different Latin face bound to the same CSS variable

## Colors

### Primary
- **Ink Navy** (`#14161F` light, `#1A1D33` dark): the one solid UI color — primary CTA buttons, the "why this stock" pull-quote note, the segmented-control active state. Reserved for the system's own voice, not for market data.

### Secondary — the four line colors (equal rank)
- **Oil Amber** (`#C2820F` light / `#FFB443` dark): the oil line.
- **Inflation Teal** (`#0E9C78` light / `#2FE6B8` dark): the inflation/rates line.
- **Dollar Pink** (`#DB3368` light / `#FF5C8A` dark): the dollar line.
- **AI Violet** (`#6B4EFF` light / `#8C6CFF` dark): the AI Capex line. **Also doubles as the system's neutral UI/brand accent** (focus ring, selected-chip glow, active tab, logo mark, the background gradient blobs) — exactly the same "one line color does double duty as the neutral accent" rule the previous system used with Oil Amber, just handed to violet this time because violet is the dominant brand hue in the fintech world the owner picked.

### Tertiary — exposure semantics (fixed meaning, never repurposed)
- **Positive Green** (`#129459` light / `#3DDC84` dark): Positive Exposure only.
- **Negative Red** (`#E0294F` light / `#FF4D6D` dark): Negative Exposure only.
- **Mixed Gold** (`#9C6B14` light / `#D9A441` dark): Mixed Exposure only; pairs with a dashed stroke, not just the color. Deliberately a different shade from Oil Amber so the two jobs never read as the same color, same discipline as the previous system.

### Neutral
- **Chalk** (`#F5F4FC` light / `#090B13` dark): page background — a soft lavender-white in light mode (not a cool grey this time), near-black with a faint violet cast in dark mode.
- **Paper** (`#FFFFFF` light / `#121625` dark): card/surface background, opaque (not literally translucent — the "glass" feel comes from `backdrop-filter: blur()` layered on top of an opaque card plus a soft shadow, not from alpha transparency, so the card never looks washed-out against busy content behind it).
- **Ink** (`#14161F` light / `#F2F3FA` dark): primary text.
- **Ink Muted** (`#6B7088` light / `#8C92AC` dark): secondary text, timestamps, captions.
- **Rule** (`#E6E4F2` light / `rgba(255,255,255,.10)` dark): every border and divider.

### Named Rules
**The One Job Per Color Rule** (carried over unchanged): a line color marks which market story something belongs to and nothing else; an exposure color marks Positive/Negative/Mixed and nothing else; the two palettes never swap jobs.

**The Dark Mode Mirror Rule** (carried over unchanged, but the *emphasis* flips): dark mode is this system's native home even more than before — it is the surface the brand gradient blobs, the glow-ring confidence dots, and the glass-card blur were designed against first. Light mode is a fully supported, equally finished second rendition (soft lavender paper), not a discount version — but if you only screenshot one theme to check a change, screenshot dark first this time.

## Typography

**Display/Headline/Title/Number Font:** Plus Jakarta Sans (`var(--font-chakra)` — variable name kept from both previous systems so every component reference still resolves; only the font bound to it changed, now for the second time).
**Body Font:** Bai Jamjuree (`var(--font-anuphan)`, unchanged from the previous system — it already paired well and didn't need replacing).

**Character:** Plus Jakarta Sans is a geometric, slightly rounded sans-serif with the dense confident weight fintech apps use for big numbers and headlines (think the display face on a modern banking app's balance screen) — a deliberate move away from the previous system's monospace LED-board digits toward a warmer, more approachable "app" register that still reads as serious/numeric through weight (700–800) and `font-variant-numeric: tabular-nums` (kept global on `body`, still important so numbers align in evidence tables even without the monospace face). Plus Jakarta Sans has no Thai glyphs (`subsets: ["latin"]` only): Thai text inside a Chakra-bound element still falls through the font stack to Bai Jamjuree automatically, identical mechanism to the previous system.

### Named Rules
**The Numbers-Wear-Chakra Rule** (renamed from "Numbers-Wear-Mono," same rule): any rendered market figure uses the `--font-chakra` face, even inline inside a Bai Jamjuree sentence, reinforced by global `tabular-nums`.

## Layout

Unchanged from both previous systems: single mobile column, `max-width: 460px` centered via `.wrap`, widening only to `560px` at `≥900px`. Flat `20px` side gutter. `.sec { margin-top: 36px }` vertical rhythm. Fixed bottom tab bar, now with a stronger `blur(12px)` frost and the active tab marked in AI Violet instead of a navy/amber tint.

## Elevation & Depth

This is the biggest structural change from the previous system, which was contractually flat (no shadows anywhere). This system uses a restrained two-tier depth language:
- **Flat rows** (list items inside `.stk-row`, `.src-row`, `.fau .r`, FAQ accordion rows, evidence layer rows): still just a `1px solid` Rule border/divider, no shadow — unchanged, because these are long dense lists where a shadow per row would be noise, not signal.
- **Module cards** (`.mapcard`, `.fau`, `.conf`, `.sign`, home `.item` rows, `.pulse` chips, `.sugg`, `.result-empty`): `border-radius` in the 14–24px range, a `1px solid` Rule border, and a soft two-layer `box-shadow` (`--shadow` token, tuned per theme — a near-invisible 1px contact shadow plus a diffuse 10–32px ambient shadow). A handful of the most prominent of these (`.mapcard`, `.fau`, `.conf`) additionally get `backdrop-filter: blur(16px)` in dark mode only (`--glass` token, `none` in light mode where there's nothing worth blurring behind an opaque near-white card).
- Two fixed, low-opacity (≈15–22%) radial-gradient blobs — one violet (top-left), one mint (bottom-right) — sit behind every page via `body::before`/`body::after`, `z-index:-1`, heavily blurred. This is the one truly new decorative element in the system; it is deliberately subtle enough to never compete with foreground text contrast, checked in both themes.

## Shapes

Corners are generously rounded everywhere now — the opposite pole from the previous system's board-tile sharpness: `999px` (full pill) for chips, tags, pills, and stock-exposure chips; `14px` for inputs, list-card rows, and most small cards; `20–24px` for the handful of prominent module cards. Nothing in the system uses a fully sharp (`0px`) corner. Exposure is still carried in stroke style as well as color — solid = strong evidence, dashed = uncertain — unchanged from both previous systems, applied identically to card borders, chain rails, and stock-exposure chips. The Fact/Analysis/Uncertainty evidence-mark circles stay fully circular and visually untouched by either redesign — filled dot / hollow ring / dashed ring, exactly as always.

## Components

### Buttons
- **Primary CTA:** Ink Navy background, white text, `14px` radius, `50px` min-height — a small lift (`translateY(-1px)`) plus opacity fade on hover, a scale-down on press/active for tactile feedback (new — the previous system had no interactive motion contract).
- **Icon button:** `44×44px`, `14px` radius, Paper background with a Rule border; border brightens to AI Violet and lifts slightly on hover.
- **Chip (toggle):** `999px` radius (full pill, was `4px` sharp-tag before), transparent by default, `1.5px` Rule border; selected state fills with a 16%-tint of the relevant line color, switches the border to that line color, and adds a soft 1px colored ring (`box-shadow`) for extra "lit" presence. Presses scale down slightly (`scale(.95)`).

### Cards / Containers
- **Corner style:** `14–24px` depending on prominence — the impact-map card and the 4-layer evidence card get the largest radius on the page (`20–24px`).
- **Background:** Paper on Chalk, opaque.
- **Border:** `1px solid` Rule plus (module cards only) the `--shadow` token; a few get `backdrop-filter: blur()` in dark mode. No more 3px colored top-edge accent bar — that was a board-tile-language device that doesn't belong in a soft-card world, so prominent cards now read as "elevated" through shadow/corner-radius alone, not a stripe.
- **Internal padding:** 16–22px, denser (12–14px) for list-style rows like FAQ.

### Pills / Badges
- **Exposure pill:** `999px` radius (was `4px`), `1.5px` border in the exposure color, text in the same color; Mixed additionally switches the border to dashed.
- **Line badge:** `999px` pill with a solid dot in the line color plus a 16%-tint background fill.

### Evidence Marks
Unchanged from both previous systems — this is the system's most load-bearing signature and must never be redrawn:
- **Fact:** a filled `16px` circle in Ink.
- **Analysis:** a `16px` circle, hollow, `3px` Ink stroke.
- **Uncertainty:** a `16px` circle, hollow, `3px` dashed Mixed-gold stroke.

### Inputs / Fields
- **Style:** `1.5px` Rule border, `14px` radius (was `6px`), `52px` min-height, `16px` font (prevents iOS zoom-on-focus). Border turns AI Violet on focus (new — previously relied on the generic focus ring alone).
- **Focus:** system-wide `3px` solid-violet outline with `2px` offset and `8px` corner rounding (`:focus-visible`), used identically on every interactive element.

### Navigation (tab bar)
- Fixed to viewport bottom, translucent Paper background with `blur(12px)`, `1px` top border.
- Inactive items: Ink Muted. Active item: **AI Violet** text/icon, `700` weight, 14%-tint violet tag background — the tab bar's active-state color changed from the old Oil Amber to the new double-duty AI Violet, consistent with "whichever line color also carries the UI-accent job."

## Motion

New section — the previous system had almost no motion contract beyond the FAQ chevron. This system adds purposeful, restrained interaction feedback everywhere a tap or hover happens:
- Buttons/CTAs/icon buttons: `translateY(-1px)` + opacity fade on hover, `scale(.94–.98)` on press.
- Chips/pills: `scale(.93–.95)` on press.
- Home list-item cards: `translateY(-1px)` + border-color shift to the line/accent color on hover.
- All transitions stay in the 120–250ms range with standard easing; nothing is purely decorative or blocks interaction. `prefers-reduced-motion` continues to disable the FAQ/fold chevron rotation exactly as before; the new press/hover transforms are short and subtle enough not to need a separate reduced-motion branch.

## Do's and Don'ts

### Do:
- **Do** keep a line color meaning "this belongs to the oil/inflation/dollar/AI story" everywhere except the tab bar's single active-state exception (now AI Violet, was Oil Amber).
- **Do** pair every exposure color with its stroke-style twin (solid/dashed) so the signal survives grayscale or color-blindness.
- **Do** reserve the shadow + glass-blur treatment for genuinely prominent module cards; keep dense lists (stocks, FAQ, sources, evidence rows) as flat bordered rows.
- **Do** design dark mode first when touching this system; it is the native surface now.
- **Do** keep the Fact/Analysis/Uncertainty circles fully circular and exactly as specified — they have now survived two full redesigns unchanged and must survive the next one too.
- **Do** honor the `460px` (`560px` ≥900px) reading column; this is still a phone-first product, not a responsive-desktop one.

### Don't:
- **Don't** introduce a new accent color outside the four line colors and three exposure colors — Ink Navy and the neutrals are the only other spend the palette allows.
- **Don't** use green/red/gold for anything other than Positive/Negative/Mixed Exposure, even decoratively.
- **Don't** add a shadow or glass-blur to every card indiscriminately — that was explicitly rejected as "heavy-shadow fatigue" on dense pages during this redesign.
- **Don't** bring back a sharp (`0px`) corner or the old 3px colored top-edge accent bar — both belonged to the previous board-tile language and clash with this system's fully-rounded, shadow-based depth model.
- **Don't** widen the core content column into a conventional multi-column desktop layout.

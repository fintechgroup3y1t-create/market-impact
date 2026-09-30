---
target: หน้าแรก
total_score: 20
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 3
target_identity: "file:/home/user/market-impact/web/app/page.tsx"
target_fingerprint: "sha256:a38da2d45287fbd840f9d9c9a59b7e60ef9bd42372c54a3f527973b54fede205"
target_path: /home/user/market-impact/web/app/page.tsx
timestamp: 2026-09-29T19-16-02Z
slug: web-app-page-tsx
closed: true
---
Method: dual-agent (A: general-purpose sub-agent (opus) · B: general-purpose sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Journey progress bar fills left-to-right regardless of which quest completed first; "อัปเดต 09:00 น." is a hardcoded string, not real freshness |
| 2 | Match System / Real World | 2 | Unexplained "WTI", "S&P 500", "บอนด์ 10 ปี", "อัตราคิดลดสูงขึ้น" on a novice-facing homepage; legend uses English "Positive Exposure" |
| 3 | User Control and Freedom | 3 | No traps; quiz commits on first tap with no undo |
| 4 | Consistency and Standards | 2 | Green/red mean three different things on one page (price direction, quiz right/wrong, exposure); chips and tappable SVG lines duplicate one 3-way choice |
| 5 | Error Prevention | 3 | Quiz options are 54px stacked buttons that commit on first touch — easy thumb misfire |
| 6 | Recognition Rather Than Recall | 2 | Quests aren't links ("เปิดดูหลักฐาน" gives no destination); default-visible oil line isn't counted toward "สำรวจครบ 3 สาย" until re-tapped |
| 7 | Flexibility and Efficiency | n/a | Read/Persuade-mode homepage; accelerators aren't meaningful here |
| 8 | Aesthetic and Minimalist Design | 2 | First viewport spends its space on a 5-line worry headline, a dead pulse bar, and a 0-score game HUD; primary CTA sits ~1,550px down inside a 1,022px card |
| 9 | Error Recovery | 2 | When metrics are unavailable, four bold "[ไม่มีข้อมูล]" render with no explanation of why or when data returns |
| 10 | Help and Documentation | 2 | One hint line plus an exposure legend; no "how to read this map," no inline term definitions despite teaching being the core job |
| **Total** | | **20/36** | **56%: Acceptable** (heuristic 7 scored n/a for this Read/Persuade surface) |

## Design Specificity Verdict

**Mostly authored for this product, but the system's key visual rules aren't applied consistently on the page that should teach them.**

**LLM assessment:** The impact map is genuinely distinctive — row-labeled stations (เหตุการณ์ → เศรษฐกิจ → อุตสาหกรรม → หุ้น), a branching oil track, exposure-ringed tickers with a dashed ring for Mixed, line-fade-on-select interaction, `aria-live` announcements, and reduced-motion handling. A generic news or stock-tip app could not reuse it unchanged. Chalk/ink neutrals, Chakra Petch for numbers, and the line-colored sign band also read as owned.

What undercuts it: the homepage's own gamification block is a stock Duolingo pattern with no transit-line language despite living on a transit-metaphor site; DESIGN.md's "most load-bearing signature" — the filled/hollow/dashed Fact/Analysis/Uncertainty marks — is entirely absent from the homepage legend and every map station renders as an identical hollow ring; every `.trk` line renders solid, so the solid-vs-dashed evidence-strength convention is never introduced where a first-time visitor would first learn it; and Positive/Negative/Mixed colors leak into unrelated jobs (price-direction arrows, quiz right/wrong feedback) plus two off-palette colors (flame orange, toast gold) appear nowhere in DESIGN.md's token set.

**Deterministic scan:** CLI static scan (`impeccable detect --json web/app/page.tsx web/components`) returned exit 0 / zero findings. A sanity check against synthetic bad-contrast HTML confirmed the binary works; a synthetic JSX-inline-style test suggests the TSX/JSX regex path may have blind spots for JS-object-syntax styles (`fontFamily:`, camelCase), so treat this "clean" CLI result as weak evidence, not a strong "no problems" signal.

The live-DOM browser pass (real signal) logged 4 concrete findings via injected `detect.js` against the actual rendered homepage:
- **`low-contrast`**: 4.4:1 (needs 4.5:1) — text `#15803d` on `#eef1f4`. This is literally DESIGN.md's `positive` token on the `chalk` background, falling just short of WCAG AA — direct, measured corroboration of the color-semantics problem flagged independently by Assessment A.
- **`body-text-viewport-edge`**: an 80-character `<p>` touching both viewport edges at 0px margin.
- **`bounce-easing`**: `cubic-bezier(0.3, 1.3, 0.5, 1)` — this matches DESIGN.md's documented `ease-bouncy` motion token used for the Journey progress-bar fill, so likely intentional rather than a defect; flagged here for visibility, not as a fix item.
- **`layout-transition`**: `transition: width` — the same Journey fill animates a layout-triggering property; worth a cheap `transform: scaleX()` swap since it's free performance, independent of whether the bounce curve itself is kept.

No false positives identified in the browser findings; each cites a concrete, checkable value rather than a vague claim.

**Visual overlays:** Browser injection succeeded (mutation preflight passed, `detect.js` loaded and logged to console) but was run headlessly by the sub-agent, not in a `[Human]`-labeled tab in your own browser — there is no live overlay open for you to look at right now. Screenshots (mobile light/dark, desktop, post-quiz, chip-toggled states) were captured to `/tmp/.../scratchpad/` by Assessment A instead; ask if you'd like these described further or re-captured against your live browser.

## Overall Impression

The impact map is the product's real idea, well executed, and worth protecting. Everything wrapped around it on the homepage — the game HUD, the quiz's placement, the color reuse, the stale/contradictory freshness claims — currently works against it: a first-time visitor spends their first two screens on a worry headline, a broken-looking scoreboard, and a data-outage message before reaching the one thing the product does that nothing else does. The single biggest opportunity is reordering the page around the map (quiz before the reveal, CTA within the first viewport) and enforcing the system's own color/mark rules on the page where a novice would first learn them.

## What's Working

1. **The impact map expresses the product's core idea spatially** — the four-row axis, branching oil track, exposure-ringed stations with a dashed Mixed ring, fade-to-14%-on-select interaction, `aria-live` announcements, and reduced-motion support are all specific to this product and well built.
2. **Honest handling of missing data and non-advice framing.** Numbers only ever arrive through `{{…}}` placeholders; when unavailable, the page shows "[ไม่มีข้อมูล]" rather than fabricating a number. Exposure wording is centralized in `web/lib/labels.ts`, and the footer states XP is unrelated to trading.
3. **The gamification layer is carefully engineered under the hood** — localStorage wrapped in try/catch throughout, post-hydration loading to avoid SSR mismatch, daily quest reset with persistent XP, `role="status"` toast, 44–52px touch targets, and a genuinely tactile quiz-button press effect matching DESIGN.md's intent.

## Priority Issues

**[P1] The page contradicts itself about whether its data is real.**
- **Why it matters:** `IS_SAMPLE_DATA = true` is hardcoded in `web/lib/data.ts:42`, so the "ข้อมูลสมมติ ไม่ใช่ราคาจริง" (this is fake data) banner renders even against real Tiingo prices and real sourced events. Alongside it: a hardcoded `home.asOf` timestamp, a permanent "ประกาศคืนนี้" (announced tonight, every night), a visible `[วันที่]` placeholder in production copy, and "ตรวจโดยทีมงานแล้ว" (team-verified) when no review step exists per current CLAUDE.md policy. PRODUCT.md's first principle is "every number is real or explicitly marked as missing" — a trust product can't carry banners that contradict its own evidence claims.
- **Fix:** Derive `IS_SAMPLE_DATA` from `!isDatabaseConfigured()`; derive "updated" time from the newest `market_metrics` timestamp; remove or hide `[วันที่]` when unknown; replace "ตรวจโดยทีมงานแล้ว" with something true; fix the pulse `aria-label`'s "15-minute delay" claim (data is actually overnight closes via ETF proxies) and add a one-line proxy note.
- **Suggested command:** `/impeccable harden`, then `/impeccable clarify` for the copy.

**[P1] The quiz comes after the map, which gives the answer away.**
- **Why it matters:** `page.tsx` renders `<ImpactMap>` before `<Quiz>`. The map's default oil line already shows XOM "บวก"/DAL "ลบ" with the sign card spelling out the mechanism, so by the time the quiz asks "น้ำมันแพงขึ้น ธุรกิจไหนมักได้ผลบวก?" it's a recall check with the answer already printed above — its own explanation even points back up at "เส้นสีม่วงบนแผนที่ด้านบน." The "guess before reading" teaching mechanic is lost.
- **Fix:** Move `<Quiz>` above `<ImpactMap>`, or keep the map's oil line/stock pills hidden until the quiz is answered so the map becomes the reveal.
- **Suggested command:** `/impeccable layout`.

**[P1] The first screen spends its space on a broken-wrapping headline, a dead pulse bar, and a zero-score HUD, while the primary action sits two screens down.**
- **Why it matters:** The 38px mood headline wraps to 5 lines with poor Thai line-breaks on a 390px viewport; the pulse bar clips its 4th value off-screen with no scroll affordance; the Journey (streak/level/XP) fills the rest of the fold. The primary CTA sits around y≈1550 inside a 1,022px map card. A novice arriving on a worrying market day needs to know what happened and where to tap within 5 seconds, and instead sees a 0/100 scoreboard first.
- **Fix:** Shrink the mood headline on mobile and author it in short clauses that break cleanly; add a fade/peek edge to the pulse bar; move the Journey below the map/quiz or collapse it to a one-line strip; surface the default sign card's headline and CTA earlier in the card.
- **Suggested command:** `/impeccable layout`, `/impeccable distill`.

**[P2] The Journey widget mis-reports progress and gives no directions — and its "low-contrast" positive-green also fails WCAG AA (4.4:1, detector-confirmed).**
- **Why it matters:** The fill logic (`n<=1?0:n===2?50:100`) assumes quests finish left-to-right, but they can finish in any order — answering the quiz first shows the middle stop checked with an empty track. The reward copy promises "+30 XP" but a wrong answer pays 15. The default-visible oil line isn't counted toward "สำรวจครบ 3 สาย" until re-tapped. Quests are plain `div`s, not links. Completed labels get struck through, reading as cancelled rather than done. The completion toast hardcodes "รู้ทันน้ำมัน" regardless of the day's actual line. Separately, the browser detector measured the `positive` token (`#15803d`) on `chalk` (`#eef1f4`) at 4.4:1 contrast, just under the 4.5:1 AA minimum this exact green needs when used as text.
- **Fix:** Render stops independently (or fill only between consecutive completed ones); call `seeLine(lines[0].id)` on mount so the default line counts; correct the XP copy to "+15–30 XP"; make each quest a real link/anchor; replace strikethrough with a check plus muted color; remove or genericize the medal copy; darken the `positive` token slightly for text use or reserve it for icon/border-only contexts where the stricter text-contrast ratio doesn't apply.
- **Suggested command:** `/impeccable harden`, `/impeccable polish`.

**[P2] Color and mark semantics are violated or missing on the one page that should teach them.**
- **Why it matters:** Pulse direction and quiz right/wrong both reuse `--pos`/`--neg`, the same tokens reserved for Positive/Negative Exposure; two off-palette colors (flame orange/gold toast) appear nowhere in DESIGN.md; the Fact/Analysis/Uncertainty marks are absent from the homepage legend; every map track renders solid, so the dashed "uncertain" convention is never introduced. This is the first page a novice sees — it currently teaches "green means went up / correct" instead of "green means Positive Exposure," which undercuts the product's core no-buy/sell framing.
- **Fix:** Render pulse direction in ink with ▲/▼ only; give quiz feedback in navy/ink plus a check/cross shape instead of green/red; replace the flame and gold with system tokens; add the three evidence marks to the map legend; draw lower-confidence segments dashed.
- **Suggested command:** `/impeccable colorize` (restrained — removing misapplied color), `/impeccable polish`.

## Persona Red Flags

**Jordan (confused first-timer):** Sees "WTI", "S&P 500", "บอนด์ 10 ปี" undefined, then "เลเวล 1 นักอ่านมือใหม่ 0/100 XP" with no idea what earns XP. The legend is partly in English ("Positive Exposure"). Taps "เปิดดูหลักฐาน +10 XP" — it isn't a link, nothing happens, they stall. The top banner claims everything is fake while cards claim "ตรวจโดยทีมงานแล้ว" — reading literally, can't decide what to trust. The primary CTA is ~2 screens down, below a diagram whose interactivity isn't obvious until the 13px hint is read.

**Riley (stress tester):** Answer the quiz before touching the map — the progress bar stays at 0% with the middle stop checked. Answer wrong — quest promised +30, toast gives +15. Never touch the already-visible oil line — "0/3," and tapping the already-selected chip (a no-op) is what actually completes the quest. Force the DB offline — four bold "[ไม่มีข้อมูล]" appear while "อัปเดต 09:00 น." still claims freshness. "ประกาศคืนนี้" shows every day; `[วันที่]` is visible in production. Completing all three quests fires "ได้เหรียญ รู้ทันน้ำมัน" regardless of the day's actual story, for a medal that appears nowhere in the UI.

**Casey (distracted mobile user):** The top-bar search icon duplicates the tab bar's search. The only primary action needs ~1,500px of scroll past the Journey and a tall SVG. The pulse bar's 4th value is clipped with no scroll hint. Quiz options are stacked 54px buttons that commit on first touch — a scroll-tap misfire permanently answers. The XP toast overlays the sign-card body text mid-read. Dimmed (14% opacity) map line labels are still tappable but unreadable. On the plus side: thumb-zone tab bar and 40–52px touch targets are solid.

## Minor Observations

- `.legend` wraps unevenly at 390px ("ผสม = Mixed Exposure" drops alone); consider a 3-column grid or shorter labels.
- Two equal selectors (chips + tappable SVG lines) exist for one 3-way choice; the SVG `g` elements also add 3 extra tab stops duplicating the chips.
- The non-link `div` row in "เรื่องอื่นที่ควรรู้" is styled identically to the two linked rows, with no chevron distinguishing them.
- A few inline `style={{...}}` usages (`.sign .body p`, `Quiz .small`) bypass the token system.
- Desktop's 560px column doesn't wrap "ตอบคำถามทาย/ผล" — the mobile wrapping is a mobile-specific weak spot; shortening to "ทายผล" would fix both.
- "เกือบแล้ว" (almost) as wrong-answer feedback isn't quite accurate for a wrong answer; "ยังไม่ใช่" (not quite) is equally kind and more honest.
- Dark mode's lightened line colors should be contrast-checked for white text in `.sign .band` — teal `#2BBAC6` with white is roughly 2.3:1 and likely fails.
- `.toast` uses `white-space:nowrap`; the completion message risks overflowing on 360px devices.
- The homepage's default oil-line map content (XOM/DAL) and the oil sign card (about the Mideast tension event) can disagree, since the map isn't wired to the day's specific active event — a known, CLAUDE.md-acknowledged gap.
- One stray `404` browser console error was logged before the detector ran; not confirmed related to homepage design (likely an unrelated dev-asset request), flagged for visibility only.

---
target: "web/app (full site: home, event, stock, search, calendar, portfolio)"
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/home/user/market-impact/web/app (full site: home, event, stock, search, calendar, portfolio)"
timestamp: 2026-10-06T19-21-14Z
slug: ome-event-stock-search-calendar-portfolio-a0a849c2
---
Method: dual-agent (A: aff1d0e49bb33c315 · B: aa212dda7c035e33b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `[ไม่มีข้อมูล]` on the homepage pulse strip doesn't distinguish "never collected" from "DB hiccup tonight" |
| 2 | Match System / Real World | 4 | Positive/Negative/Mixed vocabulary and inline glossary terms consistently enforced via `lib/labels.ts` |
| 3 | User Control and Freedom | 3 | Back buttons and instant depth-tab switching everywhere; no persistence of watchlist "other news" section state |
| 4 | Consistency and Standards | 3 | Internal CSS reuse is disciplined, but a new 4th "line" color (AI Capex, blue) shipped without updating DESIGN.md's "three equal-rank lines" rule |
| 5 | Error Prevention | 3 | Admin form has validation; public surfaces are read-only so little to prevent |
| 6 | Recognition Rather Than Recall | 3 | Depth-level choice ("เร็ว/เข้าใจ/เจาะลึก") resets to default on every navigation — forces re-picking |
| 7 | Flexibility and Efficiency of Use | 2 | No shortcuts for a returning daily user; everyone gets the first-timer experience every visit |
| 8 | Aesthetic and Minimalist Design | 3 | Flat/restrained system overall, but homepage stacks 6 distinct content patterns before any single "I'm informed" moment |
| 9 | Error Recovery | 3 | `error.tsx`/`not-found.tsx` exist, localized, on-brand, with working retry — good craft; no per-field reason given for missing data |
| 10 | Help and Documentation | 2 | Glossary only appears where an author remembered to wire it; no standing "คำศัพท์" page a confused user can browse |
| **Total** | | **29/40** | **Good** |

## Design Specificity Verdict

**LLM assessment**: Mostly passes, with one serious crack. The Exchange Ticker Board vocabulary (Martian Mono tabular numerals, flat board-tile corners, 3px amber module edges, filled/hollow/dashed Fact/Analysis/Uncertainty marks, solid-vs-dashed evidence strength) is genuinely load-bearing and specific — it could not be mistaken for a generic trading app. But the homepage's single highest-visibility element — the `.mood` h1, which DESIGN.md itself calls "the single biggest, boldest statement on the site" — is now the generic, non-answering "วันนี้มีอะไรน่าสนใจบ้าง" ("what's interesting today?"), hardcoded rather than synthesized from the day's actual data. That's exactly the kind of line any unrelated content app could ship unchanged, sitting in the one spot this product is supposed to prove it isn't that.

**Deterministic scan**: `impeccable detect` on `web/app` + `web/components` returned exit code 2 with 5 findings, all in `globals.css`: 4× `border-accent-on-rounded` (the 3px/5px amber top-edge on `.mapcard`, `.fau`, `.conf`, and the `.keys i` legend swatch) and 1× `side-tab` (`.rail .s`'s border-left chain-rail line). Cross-checked against DESIGN.md: all 5 are the product's own documented "module card top-edge" and "chain rail" patterns, not slop — false positives, correctly flagged as such by Assessment B. Live-browser injection on two pages (`/event/oil-supply`, `/event/oil-supply/stock/DAL`) surfaced one finding the static scan couldn't: a `skipped-heading` on `/event/oil-supply` (`<h1>` jumps straight to `<h3>` "เกิดอะไรขึ้น?" with no `<h2>`) — a genuine, if minor, semantic-structure gap. A `dark-glow` finding on both pages was traced to the live-server tool's own injected brand styling (`#ffba00` "kinpaku gold"), not the product — a `grep` for `box-shadow`/`text-shadow` across the whole app returned zero matches, consistent with DESIGN.md's explicit "no shadows anywhere" contract.

**Visual overlays**: No user-visible browser overlay was presented in this run — headless script injection ran programmatically against two pages and reported console output directly, rather than opening a `[Human]`-labeled tab. Treat the findings above as the deterministic-scan summary rather than an on-screen overlay.

## Overall Impression

The system genuinely earns its "Exchange Ticker Board" identity in its vocabulary — mono numerals, board-tile corners, the Fact/Analysis/Uncertainty mark shapes, solid-vs-dashed evidence strength — and the product's hardest promise (never fabricate a number, always separate fact from interpretation) is carried all the way into the UI layer, not just the backend. But two of the product's own signature mechanisms don't actually work as designed: the three-tier depth selector doesn't gate most of the event page, and the homepage's one "biggest, boldest" sentence has quietly become a content-free placeholder. The biggest opportunity is making the two features the product is proudest of (depth control, the daily mood read) actually deliver on their own premise.

## What's Working

1. **Solid-vs-dashed stroke always paired with color, never color alone** (`.pill.mix{border-style:dashed}`, dashed uncertainty-circles, dashed chain rails) — genuinely accessibility-literate and the most "authentic ticker board" detail in the system: a real board marks indicative/delayed data with a different glyph, not just a different color.
2. **The stock-exposure page's 4-layer evidence structure plus the explicit "ไม่ได้พิสูจน์ว่าเหตุการณ์เป็นสาเหตุ" (correlation≠causation) note** under the abnormal-return figure — rare intellectual honesty for a retail-facing product; it actively resists the "number went up, must mean something" instinct the category usually exploits.
3. **The missing-data philosophy is real, not just documented** — `lib/format.ts`'s `MISSING` constant threads through every metric-rendering component, so "no fabricated numbers" is enforced in the UI layer, not only the backend.

## Priority Issues

**[P0] Depth tabs don't actually gate the event page**
- **Why it matters**: `DepthProvider`/`Show` only wrap the Q&A block and the deep-timeline block (`app/event/[slug]/page.tsx` lines 125-199 render unconditionally). A user who taps "เร็ว" (quick, promised 15 seconds) still gets the full seven-section page — impact chain, Fact/Analysis/Uncertainty, FAQ, affected stocks, sources — all unconditional. For the exact persona this product targets (anxious, on a phone, wants the fast answer), the one feature built to serve that need doesn't work. This is a promise-vs-reality gap on the page every event lands on.
- **Fix**: Wrap the chain/FAQ/sources sections in `<Show at={["understand","deep"]}>` (or equivalent) so "เร็ว" is actually short.
- **Suggested command**: `/impeccable harden` (fixing a feature that silently doesn't do what its own UI promises) or `/impeccable shape` if the depth-gating boundaries need to be redesigned first.

**[P1] Gamification XP toast breaks its own "homepage-only" rule and visually overlaps content**
- **Why it matters**: Both assessments independently flagged this. CLAUDE.md/DESIGN.md state gamification is homepage-only, but `MarkEvidenceOpened` fires a "+10 XP เปิดดูหลักฐานแล้ว" toast on `/event/[slug]/stock/[ticker]` — explicitly the "read this seriously" evidence page in the product's own IA. Screenshots (`stock-dal-mobile-light.png`, `stock-dal-desktop-light.png`) confirm it visibly overlaps body text (the SEC 10-K citation line, the Beta `[ไม่มีข้อมูล]` value) and its lower edge touches the fixed bottom nav bar. A reward pop-up firing mid-serious-reading, obscuring the evidence it's celebrating, undercuts the calm/trustworthy tone the page is built for.
- **Fix**: Either stop firing XP events outside `app/page.tsx`, or reposition/redesign the toast so it never overlaps body copy or the nav bar.
- **Suggested command**: `/impeccable polish`

**[P1] Homepage hero headline is generic, not the product's signature "mood" statement**
- **Why it matters**: `app/page.tsx` line 41 hardcodes `<h1 className="mood">วันนี้มีอะไรน่าสนใจบ้าง</h1>` — a static question, not a synthesized read of today's market mood. DESIGN.md calls this element "the single biggest, boldest statement on the site." It's the first thing a cold first-time visitor reads, and it currently answers nothing — the exact spot where the product most needs to prove it isn't a generic content app is where it currently reads as one.
- **Fix**: Restore a data-driven mood sentence (even a simple template over the day's dominant line/exposure mix) as the h1, keeping the sub-headline rows as supporting detail beneath it rather than as the headline's replacement.
- **Suggested command**: `/impeccable clarify`

**[P2] Oil-amber vs. Mixed-exposure amber-brown color collision, worst in dark mode**
- **Why it matters**: Measured from the shipped tokens, light mode `#B4720F` (oil line) vs `#946A0E` (mixed exposure) sit ~33 RGB units apart; dark mode `#E8A23A` vs `#E0B23A` are only ~18 apart — nearly indistinguishable on a cheap screen in daylight. This is the exact collision DESIGN.md names and explicitly says must never happen ("a deliberately different amber... so the two jobs never read as the same color"). A user can misread "this is about the oil storyline" as "this stock has Mixed/uncertain exposure" — a mix-up that works directly against the product's core fact-vs-exposure promise, in the theme the product calls its natural home.
- **Fix**: Shift Mixed Exposure's hue further from amber (more red/brown) and re-verify the distance in both themes before shipping, rather than eyeballing in light mode only.
- **Suggested command**: `/impeccable colorize`

**[P2] The "ทายก่อนอ่าน" (predict-before-reading) quiz is fully built but never rendered**
- **Why it matters**: `home.quiz` data (question, 3 options, explanation, evidence note) and `GameProvider.answerQuiz()` both exist and are wired for XP, but no component in `app/page.tsx` or anywhere else renders it — confirmed by a repo-wide grep. This is one of four homepage elements named in both CLAUDE.md's own page spec and the product's documented IA, and it's simply missing with no `TODO` flagging the gap — the one moment designed to make a nervous first-timer feel actively engaged before being told the answer is currently inert.
- **Fix**: Wire it back into `page.tsx` under the ImpactMap (its data shape already fits there), or formally cut the dead data/API if it's been deliberately deprioritized.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Jordan (Confused First-Timer)**: Lands cold on a homepage whose biggest, boldest text ("วันนี้มีอะไรน่าสนใจบ้าง") answers nothing, then has to read four sub-headline rows, a blanked-out price strip, a portfolio upsell card, and a 4-way chip-picker before reaching anything resembling "here is today's market story, explained." The product's core promise — explain cause→effect simply — is buried under its own scaffolding on the one page a first-timer lands on cold.

**Casey (Distracted Mobile User)**: The depth selector — the one feature built specifically for "quick glance on a train platform" — doesn't shorten the page (P0 above), so a rushed mobile read gets the same scroll length as a deep dive. The XP toast overlapping the bottom nav bar (P1 above) is also a thumb-zone interaction risk for exactly this persona.

## Minor Observations

- `<h1>` → `<h3>` heading skip on `/event/oil-supply` (no `<h2>` in between) — a real if minor semantic-structure gap the static scanner couldn't catch but live-DOM inspection did.
- A 4th "line" color (AI Capex, blue `#2E5FA3`/`#6FA0F2`) now ships in `lib/sample/data.ts` with full equal-rank treatment, but DESIGN.md's "three equal-rank lines, never reused" section was never amended — untracked design-system drift that risks a future collision if it keeps growing unchecked.
- Homepage/calendar market-data fields (`[ไม่มีข้อมูล]`) don't distinguish "never collected" from "backend hiccup tonight" — same field, same visual, two very different situations for user trust.
- `StockSearch.tsx` still contains the stale comment "ข่าวจะเพิ่มในชิ้นที่ 5" — milestone 5 shipped months ago; harmless but a sign copy isn't always re-audited after roadmap items land.
- Depth-level choice isn't persisted in state/URL, so sharing an event link always lands the recipient back on "เข้าใจ" regardless of what the sender was viewing.

## Questions to Consider

- If gamification is supposed to be "homepage only" as a hard rule, is that rule actually enforced anywhere (a test, a lint check), or is it just convention that a new component can silently break?
- The predict-before-reading quiz sat fully built but unrendered with no `TODO`. What let a named, required feature quietly stop shipping unnoticed — and is anything else in the same state?
- Is "AI Capex" really a 4th equal-rank line, or is it better framed as a sub-topic of the existing inflation/rates story — and does the "one color, one story, forever" promise survive a 5th or 6th line without becoming as hard to track as the news cycle the product exists to simplify?

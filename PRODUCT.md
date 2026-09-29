# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Thai retail investors who are new to investing ("มือใหม่"). They come to the site to understand a specific market event as it's happening: what happened, why, who benefits, which stocks are involved, and what the evidence for that claim is.

## Product Purpose

Market Impact Intelligence helps novice Thai investors understand *what is happening in the market → why → who benefits → which stocks are related → what the evidence is*. Success means a reader leaves a page understanding the causal chain and its evidence, not a price target.

## Positioning

Explicitly not a news site, not a price-prediction site, and never gives buy/sell advice. Its mechanism — visualizing an "Impact Chain" (event → economy → industry → company) as a subway-map-style diagram, with every factual claim traceable to dated, linked evidence, and Fact/Analysis/Uncertainty kept visually distinct — is what a plain news aggregator or a stock-tip site could not truthfully copy.

## Operating Context

- US stock market only, ~35 covered companies across multiple sectors, organized into three recurring macro "lines": oil, inflation (rates/Fed), dollar.
- Real price data (Tiingo) and real macro data (FRED, EIA) update automatically overnight via cron; event write-ups (the "why") are authored by the site owner or by a Claude Code session, then published — there is no live newsroom pipeline.
- A companion `/admin` page exists for the owner to publish/withdraw events and search source news, but per this init's interview it is treated as an internal tool, not a second documented user segment.
- Resolution levels per event: quick (~15s), understand (~1 min, default), deep (~5 min).
- Gamification (XP, streak, daily 3-station learning path) is confined to the homepage only.

## Capabilities and Constraints

- No fabricated market numbers: every number shown comes from the backend and reaches copy only through a `{{TICKER.field}}` placeholder — the model never types a number directly into event prose.
- Every Fact claim must cite real evidence (source name, URL, published date, retrieved date).
- Fact / Analysis / Uncertainty must always read as visually distinct, never blended.
- Vocabulary is constrained to Positive / Negative / Mixed Exposure — words like "จะขึ้น" (will rise), "จะลง" (will fall), or "ควรซื้อ" (should buy) are banned outright.
- Only licensed/permitted APIs; no scraping of unauthorized sites (Yahoo Finance explicitly excluded).
- AI is an optional accelerant, not a dependency: the site must work fully with `ANTHROPIC_API_KEY` unset or out of credit. When AI is unavailable, a new event simply lands in a "pending explanation" state rather than breaking the page.
- Must run entirely on free-tier infrastructure through the current trial phase (Vercel, Supabase/Neon, GitHub Actions, free market-data tiers); anything with a cost requires the owner's sign-off first.
- Mobile-first, with light/dark mode support.

## Brand Commitments

- Line colors are fixed and carry meaning across every page: chalk `#EEF1F4`, ink `#0F1B2D`, navy `#1B2A4A`, oil line `#6B4EFF`, inflation line `#0E8F9B`, dollar line `#C8327C`, positive `#15803D`, negative `#C8261E`, mixed `#A16207`.
- Typography: Chakra Petch for headings/numbers, Anuphan for body copy.
- Solid line = strong evidence, dashed line = a factor that could change the outcome; filled dot = fact, hollow circle = analysis, dotted circle = uncertainty. These marks are load-bearing product semantics, not decoration — do not repurpose them.
- Reference file `design/hybrid-reference.html` is the sole visual authority for the site's established look; treat it as incumbent evidence, not a blank slate.

## Evidence on Hand

- Real, working data pipelines: Tiingo (prices), FRED + EIA (macro/calendar), Marketaux (news search, both ticker-based and free-text keyword).
- Four real, sourced events currently on the site (oil-mideast-tension, dollar-strength-gold, fed-rate-hike-tech, oil-supply), each citing real named outlets and primary sources (e.g. federalreserve.gov).
- 35 of 35 covered companies have a complete 4-layer "why this stock" evidence page.
- Known gaps, stated so future work doesn't invent numbers to fill them: beta-to-oil/rate/dollar and 10-year bond yield in bps have no real computed pipeline yet and render as "[ไม่มีข้อมูล]"; several company-specific figures in event copy are still `[x%]`-style placeholders pending real 10-K sourcing; the economic calendar has no real release times or FOMC meeting dates yet.

## Product Principles

1. Every number on the page is real or explicitly marked as missing — never a plausible-looking placeholder passed off as data.
2. Fact, analysis, and uncertainty are three different visual registers, always, everywhere on the site.
3. New event content should follow from what the market's own price data shows moved abnormally, not from what the operator finds personally interesting.
4. The site is not the newsroom; it is the interpretation layer over evidence that already exists elsewhere and is always linked back to.
5. AI is a convenience the site can lose at any time without breaking; the free/manual path always still works.

## Accessibility & Inclusion

No project-specific accessibility requirement has been established yet (confirmed in this init's interview). Follow ordinary web accessibility practice by default until the owner sets a specific bar.

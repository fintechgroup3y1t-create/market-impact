"use client";

// ปุ่มเพิ่ม/เอาออกจากพอร์ต (watchlist) — ใช้ร่วมกันในหน้าค้นหุ้นและหน้า "ทำไมถึงเป็นหุ้นตัวนี้"
import { useWatchlist } from "./WatchlistProvider";

export function WatchlistButton({ ticker }: { ticker: string }) {
  const { has, toggle, hydrated } = useWatchlist();
  const inWatchlist = hydrated && has(ticker);
  return (
    <button type="button" className="chip" aria-pressed={inWatchlist} onClick={() => toggle(ticker)} disabled={!hydrated}>
      {inWatchlist ? "เอาออกจากพอร์ต" : "เพิ่มเข้าพอร์ต"}
    </button>
  );
}

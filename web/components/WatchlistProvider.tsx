"use client";

// Portfolio Impact เฟส 1: watchlist เก็บใน localStorage ของเบราว์เซอร์ผู้ใช้เท่านั้น
// (ยังไม่มีระบบสมาชิกตาม CLAUDE.md)

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface WatchlistState {
  tickers: string[];
  hydrated: boolean;
  has: (ticker: string) => boolean;
  toggle: (ticker: string) => void;
}

const WatchlistContext = createContext<WatchlistState | null>(null);

export function useWatchlist(): WatchlistState {
  const w = useContext(WatchlistContext);
  if (!w) throw new Error("useWatchlist ต้องอยู่ภายใน WatchlistProvider");
  return w;
}

const STORAGE_KEY = "mi_watchlist_v1";
export const MAX_TICKERS = 30; // กันผู้ใช้เพิ่มเยอะเกินจนหน้า /portfolio ช้า (ไม่ได้เกี่ยวกับโควตา API ภายนอกเพราะไม่เรียกเพิ่ม)

/** แยก logic ล้วน ๆ (ไม่แตะ localStorage/React) ออกมาให้เทสต์ได้ตรง ๆ แบบเดียวกับ lib/prices/*.ts */
export function parseStoredTickers(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

export function toggleTicker(tickers: string[], ticker: string, max = MAX_TICKERS): string[] {
  const t = ticker.toUpperCase();
  if (tickers.includes(t)) return tickers.filter((x) => x !== t);
  if (tickers.length >= max) return tickers; // เต็มแล้ว ไม่เพิ่ม (เงียบ ๆ ไม่ error)
  return [...tickers, t];
}

function loadTickers(): string[] {
  try {
    return parseStoredTickers(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function saveTickers(tickers: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
  } catch {
    // localStorage ใช้ไม่ได้ (เช่น โหมดส่วนตัว) ไม่ให้หน้าเว็บพัง แค่ไม่บันทึก
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  // ค่าเริ่มต้นตอน render ต้องเหมือนกันทั้งฝั่งเซิร์ฟเวอร์และก่อนโหลด localStorage เสร็จ กัน hydration mismatch
  const [tickers, setTickers] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTickers(loadTickers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // อย่าเขียนทับค่าเดิมก่อนโหลดจาก localStorage เสร็จ
    saveTickers(tickers);
  }, [hydrated, tickers]);

  const has = useCallback((ticker: string) => tickers.includes(ticker.toUpperCase()), [tickers]);

  const toggle = useCallback((ticker: string) => {
    setTickers((prev) => toggleTicker(prev, ticker));
  }, []);

  return <WatchlistContext.Provider value={{ tickers, hydrated, has, toggle }}>{children}</WatchlistContext.Provider>;
}

/** การ์ดทางเข้าหน้า "พอร์ตของฉัน" วางบนหน้าแรก โชว์จำนวนหุ้นที่ติดตามอยู่ */
export function PortfolioEntryCard() {
  const { tickers, hydrated } = useWatchlist();
  return (
    <Link href="/portfolio" className="item" style={{ marginTop: 4 }}>
      <span className="bar" style={{ "--lc": "var(--navy)" } as React.CSSProperties} />
      <div>
        <b>พอร์ตของฉัน</b>
        <span className="small">{hydrated && tickers.length > 0 ? `ติดตามอยู่ ${tickers.length} ตัว` : "เพิ่มหุ้นที่สนใจเพื่อดูการวิเคราะห์รายตัว"}</span>
      </div>
    </Link>
  );
}

"use client";

// Portfolio Impact เฟส 2-4: หน้า "พอร์ตของฉัน"
// อ่าน watchlist จาก localStorage (WatchlistProvider) แล้วขอข้อมูลเหตุการณ์ที่เกี่ยวข้องจาก /api/portfolio
// (endpoint ภายใน อ่านจากฐานข้อมูล/ข้อมูลตัวอย่างเดิมเท่านั้น ไม่เรียก Marketaux/Tiingo เพิ่ม)
// หมายเหตุ: หน้านี้เป็น client component ล้วนเพื่ออ่าน localStorage ได้ จึงไม่มี export const metadata
// (ข้อจำกัดเล็กน้อยที่ยอมรับไว้ แทนที่จะเพิ่มไฟล์ layout ใหม่เกินขอบเขตที่อนุมัติ)

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/Footer";
import { WatchlistButton } from "@/components/WatchlistButton";
import { useWatchlist } from "@/components/WatchlistProvider";
import { EXPOSURE_SHORT } from "@/lib/labels";
import type { PortfolioItem } from "@/app/api/portfolio/route";

type LoadState = { status: "idle" | "loading" | "error" | "done"; items: PortfolioItem[]; error: string | null };

export default function PortfolioPage() {
  const { tickers, hydrated } = useWatchlist();
  const [state, setState] = useState<LoadState>({ status: "idle", items: [], error: null });
  // กัน fetch ซ้ำถ้ารายการ ticker ไม่ได้เปลี่ยนจริง (เช่น re-render จากเหตุผลอื่น)
  const lastFetchedKey = useRef<string | null>(null);

  const tickerKey = [...tickers].sort().join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (tickers.length === 0) {
      lastFetchedKey.current = "";
      setState({ status: "done", items: [], error: null });
      return;
    }
    if (lastFetchedKey.current === tickerKey) return; // รายการเดิม ไม่ fetch ซ้ำ
    lastFetchedKey.current = tickerKey;

    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading", error: null }));
    fetch(`/api/portfolio?tickers=${encodeURIComponent(tickerKey)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "ไม่ทราบสาเหตุ");
        setState({ status: "done", items: data.items as PortfolioItem[], error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState((s) => ({ ...s, status: "error", error: err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ" }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, tickerKey]);

  return (
    <>
      <h1 className="mood" style={{ marginTop: 22, fontSize: 34 }}>
        พอร์ต
        <br />
        ของฉัน
      </h1>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        หุ้นที่คุณติดตามไว้ และเหตุการณ์ที่เกี่ยวข้อง — เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ยังไม่มีระบบสมาชิก
      </p>

      {!hydrated && <p className="muted" style={{ marginTop: 20 }}>กำลังโหลด...</p>}

      {hydrated && tickers.length === 0 && (
        <p className="result-empty" style={{ marginTop: 20 }}>
          ยังไม่มีหุ้นในพอร์ต ไปที่{" "}
          <Link href="/search" style={{ fontWeight: 700 }}>
            หน้าค้นหุ้น
          </Link>{" "}
          แล้วกด &quot;เพิ่มเข้าพอร์ต&quot; ที่หุ้นที่สนใจ
        </p>
      )}

      {hydrated && tickers.length > 0 && state.status === "loading" && (
        <p className="muted" style={{ marginTop: 20 }}>กำลังโหลด...</p>
      )}

      {state.status === "error" && (
        <p className="result-empty" style={{ marginTop: 20, borderColor: "var(--neg)" }}>
          โหลดข้อมูลพอร์ตไม่สำเร็จ: {state.error} —{" "}
          <button
            type="button"
            onClick={() => {
              lastFetchedKey.current = null;
              setState((s) => ({ ...s, status: "idle" }));
            }}
            style={{ fontWeight: 700, background: "none", border: "none", color: "var(--a)", cursor: "pointer", padding: 0, font: "inherit" }}
          >
            ลองใหม่
          </button>
        </p>
      )}

      {state.status === "done" && tickers.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {state.items.map((item) => (
            <section key={item.ticker} className="sec" style={{ marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div className="tick" style={{ marginTop: 0, fontSize: 28 }}>{item.ticker}</div>
                  {item.name && <p className="small">{item.name}</p>}
                </div>
                <WatchlistButton ticker={item.ticker} />
              </div>

              {!item.covered ? (
                <p className="result-empty" style={{ marginTop: 10 }}>ยังไม่มีข้อมูลรองรับหุ้นตัวนี้ (นอกความครอบคลุม 35 บริษัทปัจจุบัน)</p>
              ) : item.stories.length === 0 ? (
                <p className="result-empty" style={{ marginTop: 10 }}>ช่วงนี้ยังไม่มีเหตุการณ์ที่เกี่ยวข้องกับหุ้นตัวนี้</p>
              ) : (
                <div className="list" style={{ marginTop: 10 }}>
                  {item.stories.map((st) => {
                    const inner = (
                      <>
                        <span className="bar" style={{ "--lc": st.color ?? "var(--rule)" } as CSSProperties} />
                        <div style={{ flex: 1 }}>
                          <b>{st.title}</b>
                          <span className="small">{st.sub}</span>
                        </div>
                        <span className={`pill ${st.exposure}`}>{EXPOSURE_SHORT[st.exposure]}</span>
                      </>
                    );
                    return st.href ? (
                      <Link key={st.title} className="item" href={st.href}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={st.title} className="item">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="note" style={{ marginTop: 20 }}>
        ป้าย Positive/Negative/Mixed Exposure บอกทิศทางของผลกระทบที่วิเคราะห์ไว้ ไม่ใช่คำแนะนำให้ซื้อหรือขาย
      </p>
      <Footer />
    </>
  );
}

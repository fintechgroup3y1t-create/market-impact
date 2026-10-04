import { describe, expect, it } from "vitest";
import { storiesForTicker } from "./data";
import type { MarketEvent } from "./types";

// บั๊กจริงที่พบบน Vercel Preview: watchlist/รายการ ticker เกิน ~3 ตัวใน request เดียวทำให้ /api/portfolio
// และ /search ค้าง/ล้มเหลว เพราะ storiesForTicker() เดิมเรียก publishedEvents() เอง "ทุกครั้งที่เรียกต่อ ticker"
// และ React cache() ที่ห่อ allEventsAnyStatus()/publishedEvents() ไว้ไม่ได้ dedupe การเรียกซ้ำภายใน
// Route Handler เดียวกันจริงตามที่โค้ดเดิมสันนิษฐาน (ยืนยันจริงด้วยการนับ log บน local server แยกต่างหาก
// นอกเหนือจากเทสต์นี้ — ดูหมายเหตุใน storiesForTicker() เอง) ทำให้ N ticker = N query ตารางเหตุการณ์แยกกัน
//
// เทสต์นี้ยืนยัน "สัญญา" ของ fix: เมื่อผู้เรียก (route.ts/page.tsx) ส่ง `published` เข้ามาเองแล้ว storiesForTicker
// ต้องใช้อาร์เรย์นั้นตรง ๆ ไม่เรียก publishedEvents() ซ้ำเพื่อดึงของตัวเอง — ถ้าฟังก์ชันเผลอเพิกเฉย `published`
// ที่ส่งมาแล้วไปเรียก publishedEvents() ใหม่ (ซึ่งไม่มี DATABASE_URL ในสภาพแวดล้อมเทสต์ จึงตกไปใช้ sample.events
// แทนเสมอ) ผลลัพธ์จะไม่ตรงกับข้อมูลสังเคราะห์ที่สร้างขึ้นเฉพาะเทสต์นี้ด้านล่าง ซึ่งไม่มีทางปรากฏใน sample.events จริง

function fakeEvent(overrides: Partial<MarketEvent> & { slug: string; impacts: MarketEvent["impacts"] }): MarketEvent {
  return {
    slug: overrides.slug,
    lineId: "oil",
    title: `เหตุการณ์ทดสอบ ${overrides.slug}`,
    updatedAt: "2026-01-01T00:00:00.000Z",
    reviewStatus: "approved",
    explanationSource: { by: "team" },
    quick: { what: "ทดสอบ", who: "ทดสอบ", tickers: overrides.impacts.map((i) => i.ticker) },
    understand: [],
    claims: [],
    deep: { timeline: [], history: { text: "", note: "" }, watch: "" },
    faq: [],
    chains: [],
    impacts: overrides.impacts,
    evidenceIds: [],
  };
}

describe("storiesForTicker (regression: หลายticker ในคำขอเดียวต้องไม่ยิง query เหตุการณ์ซ้ำ)", () => {
  it("เมื่อส่ง published array มาเอง ต้องใช้อาร์เรย์นั้นตรง ๆ ไม่เรียก publishedEvents() ซ้ำ (สัญญาของ fix)", async () => {
    const syntheticEvent = fakeEvent({
      slug: "__test-synthetic-event__",
      impacts: [{ ticker: "ZZZZ", exposure: "pos", reason: "เหตุผลทดสอบสังเคราะห์" }],
    });

    const stories = await storiesForTicker("ZZZZ", [syntheticEvent]);

    expect(stories).toHaveLength(1);
    expect(stories[0]).toMatchObject({
      title: syntheticEvent.title,
      sub: "วันนี้, เหตุผลทดสอบสังเคราะห์",
      exposure: "pos",
      lineId: "oil",
      href: "/event/__test-synthetic-event__",
    });
  });

  it("ticker ที่ไม่มี impact ใน published array ที่ส่งมา ต้องไม่มีเรื่องจาก event เลย (ไม่หลุดไปอ่าน publishedEvents() ของจริงมาปน)", async () => {
    const syntheticEvent = fakeEvent({
      slug: "__test-synthetic-event-2__",
      impacts: [{ ticker: "ZZZZ", exposure: "neg", reason: "ไม่เกี่ยวกับ YYYY" }],
    });

    const stories = await storiesForTicker("YYYY", [syntheticEvent]);
    expect(stories).toEqual([]);
  });

  it("ส่ง published array ที่มี 8 เหตุการณ์สังเคราะห์พร้อมกัน (จำลองวนหลาย ticker ใน watchlist ใหญ่) แต่ละ ticker ต้องได้แค่เรื่องของตัวเอง", async () => {
    const tickers = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
    const events = tickers.map((t, idx) =>
      fakeEvent({
        slug: `__test-bulk-event-${idx}__`,
        impacts: [{ ticker: t, exposure: "mix", reason: `เหตุผลของ ${t}` }],
      }),
    );

    for (const ticker of tickers) {
      const stories = await storiesForTicker(ticker, events);
      expect(stories).toHaveLength(1);
      expect(stories[0].sub).toBe(`วันนี้, เหตุผลของ ${ticker}`);
    }
  });

  it("ไม่ส่ง published เลย (ไม่มีพารามิเตอร์ที่สอง) ยังทำงานได้ตามเดิมโดยไปเรียก publishedEvents() เอง (backward compatible)", async () => {
    // ไม่มี DATABASE_URL ในสภาพแวดล้อมเทสต์ → publishedEvents() ตกไปใช้ sample.events เสมอ แค่ยืนยันว่าไม่ throw
    // และคืนอาร์เรย์ (เนื้อหาจริงขึ้นกับ sample data ซึ่งไม่ใช่สิ่งที่เทสต์นี้ต้องตรวจ)
    const stories = await storiesForTicker("XYZW");
    expect(Array.isArray(stories)).toBe(true);
  });
});

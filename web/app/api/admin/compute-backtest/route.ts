// คำนวณสถิติ "ในอดีต ... ([n] ครั้ง ตั้งแต่ปี [ปี])" ที่ปรากฏในเนื้อหาเหตุการณ์จริง ๆ จากข้อมูลราคาย้อนหลัง
// (สถิติล้วน ๆ ไม่ใช้ AI ตรงกับโน้ตที่เขียนกำกับไว้ในเนื้อหาว่า "คำนวณโดยระบบจากข้อมูลราคาย้อนหลัง")
//
// รันเองผ่านหน้าแอดมิน (ไม่ใช่ cron รายวัน เพราะสถิติแบบนี้ไม่เปลี่ยนเร็ว และกันโควตา Tiingo ชนกับงานอื่น)
// ผลลัพธ์เป็น JSON ให้เจ้าของ/Claude Code อ่านแล้วเอาตัวเลขไปแทนที่ข้อความ [n]/[x.x%]/[ปี] ใน lib/sample/data.ts เอง
// (ไม่ได้เขียนกลับเข้าฐานข้อมูลหรือไฟล์อัตโนมัติ เพราะข้อความเป็น prose ที่ต้องอ่านให้ลื่นด้วย ไม่ใช่แค่ตัวเลขในช่อง)
//
// ขอบเขตรอบนี้ (3 ใน 4 ข้อความที่มี [n] ครั้ง ตั้งแต่ปี [ปี]):
// - น้ำมันขึ้น >=X% ใน 1 สัปดาห์ -> หุ้นสายการบิน (DAL/UAL/LUV) เทียบตลาดในสัปดาห์เดียวกัน
// - ดอลลาร์แข็งค่าต่อเนื่องหลายสัปดาห์ (ใช้ราคาทองคำ GLD ขาลงเป็นตัวแทนทางอ้อม เพราะไม่มีข้อมูลดัชนีดอลลาร์ตรง ๆ
//   ในแผนฟรี — proxy เดียวกับที่ใช้ทั้งเว็บ) -> หุ้นเหมืองทอง/ทองแดง (NEM/GOLD/FCX) เทียบตลาดในช่วงเดียวกัน
// - เฟดขึ้นดอกเบี้ยแรงและเร็ว (ใช้ราคา TLT ขาลงเป็นตัวแทนทางอ้อมของผลตอบแทนพันธบัตรที่ขึ้นเร็ว/ดอกเบี้ยตลาดคาดว่าจะขึ้น
//   เพราะไม่มีข้อมูลดอกเบี้ยนโยบายรายวันในแผนฟรี) -> ความผันผวน (ไม่ใช่ผลตอบแทนเฉลี่ย) ของหุ้นเทค P/E สูง (NVDA/MSFT/GOOGL/AMD)
//   เทียบกับความผันผวนช่วงปกติ ใช้ chunkedVolatilityStudy แยกจาก chunkedEventStudy เพราะเป็นคนละคำถาม
// ยังไม่ทำ: "การโจมตีโครงสร้างพื้นฐานน้ำมันอ่าวเปอร์เซีย" (อ้างสาเหตุเฉพาะที่ราคาอย่างเดียวพิสูจน์ไม่ได้ว่าเกิดจากอะไร)

import { NextResponse } from "next/server";
import { getManualSecret } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/db/client";
import { chunkedEventStudy, chunkedVolatilityStudy, type BacktestResult, type VolatilityResult } from "@/lib/prices/backtest";
import { getDailyHistory, sleep, type DailyClose } from "@/lib/prices/tiingo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// เริ่มปี 2015 ให้ได้ประวัติยาวพอจะมีความหมายทางสถิติ (แผนฟรีของ Tiingo รองรับข้อมูลย้อนหลังหลายปีสำหรับหุ้น/ETF)
const START_DATE = "2015-01-01";

function summarize(result: BacktestResult | null) {
  if (!result) return { ok: false, reason: "ข้อมูลย้อนหลังสั้นเกินไป คำนวณไม่ได้" };
  return {
    ok: true,
    sinceYear: result.sinceYear,
    occurrences: result.occurrences,
    avgExcessReturnPct: Number(result.avgExcessReturnPct.toFixed(1)),
    // ตัวอย่างเหตุการณ์ล่าสุด 5 ครั้ง ให้เช็คความสมเหตุสมผลได้ด้วยตา ไม่ต้องเชื่อตัวเลขสรุปอย่างเดียว
    sampleRecentEvents: result.events.slice(-5).map((e) => ({
      startDate: e.startDate,
      endDate: e.endDate,
      triggerReturnPct: Number(e.triggerReturnPct.toFixed(1)),
      excessReturnPct: Number(e.excessReturnPct.toFixed(1)),
    })),
  };
}

function summarizeVolatility(result: VolatilityResult | null) {
  if (!result) return { ok: false, reason: "ข้อมูลย้อนหลังสั้นเกินไป คำนวณไม่ได้" };
  return {
    ok: true,
    sinceYear: result.sinceYear,
    occurrences: result.occurrences,
    avgEventVolatilityPct: Number(result.avgEventVolatilityPct.toFixed(2)),
    baselineVolatilityPct: Number(result.baselineVolatilityPct.toFixed(2)),
    // อัตราส่วนความผันผวนช่วงเหตุการณ์ เทียบกับช่วงปกติ (>1 แปลว่าผันผวนกว่าปกติจริง)
    ratioVsBaseline: result.baselineVolatilityPct > 0 ? Number((result.avgEventVolatilityPct / result.baselineVolatilityPct).toFixed(2)) : null,
    sampleRecentEvents: result.events.slice(-5).map((e) => ({
      startDate: e.startDate,
      endDate: e.endDate,
      triggerReturnPct: Number(e.triggerReturnPct.toFixed(1)),
      basketVolatilityPct: Number(e.basketVolatilityPct.toFixed(2)),
    })),
  };
}

export async function GET(request: Request) {
  const manualSecret = getManualSecret(request);
  const isManual = Boolean(process.env.ADMIN_SECRET) && manualSecret === process.env.ADMIN_SECRET;
  if (!isManual) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    // ไม่ได้ใช้ DB จริง ๆ ในนี้ แต่เช็กไว้ให้สอดคล้องกับ endpoint แอดมินตัวอื่น (กันเปิดใช้ก่อนตั้งค่าอะไรเลย)
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า DATABASE_URL" }, { status: 503 });
  }
  if (!process.env.TIINGO_API_KEY) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า TIINGO_API_KEY" }, { status: 503 });
  }

  const errors: string[] = [];
  const history = new Map<string, DailyClose[]>();
  const tickers = ["USO", "SPY", "GLD", "DAL", "UAL", "LUV", "NEM", "GOLD", "FCX", "TLT", "NVDA", "MSFT", "GOOGL", "AMD"];

  for (const ticker of tickers) {
    try {
      history.set(ticker, await getDailyHistory(ticker, START_DATE));
    } catch (err) {
      errors.push(`${ticker}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(250);
  }

  const get = (t: string) => history.get(t);
  const results: Record<string, ReturnType<typeof summarize> | ReturnType<typeof summarizeVolatility> | { ok: false; reason: string }> = {};

  if (get("USO") && get("SPY") && get("DAL") && get("UAL") && get("LUV")) {
    results.oilToAirlines = summarize(
      chunkedEventStudy(get("USO")!, [get("DAL")!, get("UAL")!, get("LUV")!], get("SPY")!, {
        windowDays: 5,
        thresholdPct: 5,
        direction: "up",
      }),
    );
  } else {
    results.oilToAirlines = { ok: false, reason: "ดึงราคาบางตัวไม่สำเร็จ ดู errors" };
  }

  if (get("GLD") && get("SPY") && get("NEM") && get("GOLD") && get("FCX")) {
    results.dollarToGoldMiners = summarize(
      chunkedEventStudy(get("GLD")!, [get("NEM")!, get("GOLD")!, get("FCX")!], get("SPY")!, {
        windowDays: 20,
        thresholdPct: 5,
        direction: "down", // GLD ลง = สัญญาณว่าดอลลาร์แข็งค่า (proxy ทางอ้อม ไม่ใช่ดัชนีดอลลาร์ตรง ๆ)
      }),
    );
  } else {
    results.dollarToGoldMiners = { ok: false, reason: "ดึงราคาบางตัวไม่สำเร็จ ดู errors" };
  }

  if (get("TLT") && get("NVDA") && get("MSFT") && get("GOOGL") && get("AMD")) {
    results.rateHikeToTechVolatility = summarizeVolatility(
      chunkedVolatilityStudy(get("TLT")!, [get("NVDA")!, get("MSFT")!, get("GOOGL")!, get("AMD")!], {
        windowDays: 10,
        thresholdPct: 3,
        direction: "down", // TLT ลง = ผลตอบแทนพันธบัตรขึ้นเร็ว (proxy ทางอ้อมของดอกเบี้ยตลาดคาดว่าจะขึ้นแรง ไม่ใช่ดอกเบี้ยนโยบายตรง ๆ)
      }),
    );
  } else {
    results.rateHikeToTechVolatility = { ok: false, reason: "ดึงราคาบางตัวไม่สำเร็จ ดู errors" };
  }

  return NextResponse.json(
    { ok: errors.length === 0, startDate: START_DATE, results, errors },
    { headers: { "Cache-Control": "no-store" } },
  );
}

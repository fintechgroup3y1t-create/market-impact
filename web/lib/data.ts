// จุดเดียวที่หน้าเว็บใช้ดึงข้อมูล
// เนื้อหาเหตุการณ์ (events, chains, claims, exposures) ยังอ่านจากข้อมูลตัวอย่างเหมือนเดิม
// (ย้ายเป็นเนื้อหาจริงในชิ้นที่ 5 ที่มี pipeline ข่าว+AI) แต่ "ตัวเลข" (metrics) อ่านจากฐานข้อมูลจริงแล้ว
// ตามชิ้นที่ 2: ราคาหุ้นจริง + คำนวณ return ใน backend (ดู app/api/cron/prices)

import { cache } from "react";
import { getDb, isDatabaseConfigured } from "@/db/client";
import { marketMetrics as marketMetricsTable } from "@/db/schema";
import * as sample from "./sample/data";
import type { Company, Evidence, Exposure, Line, MarketEvent, MarketMetrics, MetricValue, StockExposure } from "./types";

export const IS_SAMPLE_DATA = true;

/**
 * ตัวเลขตลาดจริงจากฐานข้อมูล (ใส่โดย /api/cron/prices เท่านั้น)
 * ยังไม่มีข้อมูลตัวไหน (เช่น ยังไม่เคยรัน cron หรือฐานข้อมูลต่อไม่ได้) → placeholder นั้นแสดง "[ไม่มีข้อมูล]"
 * ไม่ใช้ข้อมูลสมมติมาแทนที่ เพื่อไม่ให้ใครเข้าใจผิดว่าเป็นตัวเลขจริง
 */
export const getMetrics = cache(async (): Promise<MarketMetrics> => {
  if (!isDatabaseConfigured()) return sample.metrics; // เช่น รันในเครื่องที่ยังไม่ได้ตั้งค่า DATABASE_URL
  try {
    const rows = await getDb().select().from(marketMetricsTable);
    const out: MarketMetrics = {};
    for (const r of rows) {
      (out[r.entityKey] ??= {})[r.metric] = { value: r.value, unit: r.unit as MetricValue["unit"] };
    }
    return out;
  } catch (err) {
    console.error("getMetrics: อ่านฐานข้อมูลไม่ได้", err);
    return {};
  }
});

export const home = sample.home;
export const calendar = sample.calendar;
export const companies = sample.companies;

export function getLine(id: string | undefined): Line | undefined {
  return sample.lines.find((l) => l.id === id);
}

export function allLines(): Line[] {
  return sample.lines;
}

/** เผยแพร่เฉพาะเหตุการณ์ที่เจ้าของอนุมัติแล้ว */
export function publishedEvents(): MarketEvent[] {
  return sample.events.filter((e) => e.reviewStatus === "approved");
}

export function getEvent(slug: string): MarketEvent | undefined {
  return publishedEvents().find((e) => e.slug === slug);
}

export function getEvidence(ids: string[]): Evidence[] {
  return ids.map((id) => sample.evidence.find((e) => e.id === id)).filter((e): e is Evidence => Boolean(e));
}

export function getExposure(slug: string, ticker: string): StockExposure | undefined {
  return sample.exposures.find((x) => x.eventSlug === slug && x.ticker === ticker);
}

export function allExposures(): StockExposure[] {
  return sample.exposures.filter((x) => getEvent(x.eventSlug));
}

export function getCompany(ticker: string): Company | undefined {
  return sample.companies.find((c) => c.ticker === ticker);
}

export interface RelatedStory {
  title: string;
  sub: string;
  exposure: Exposure;
  lineId?: string;
  href?: string;
}

/** เรื่องที่เกี่ยวข้องกับหุ้นหนึ่งตัว ใช้ในหน้าค้นหุ้น */
export function storiesForTicker(ticker: string): RelatedStory[] {
  const fromEvents: RelatedStory[] = publishedEvents().flatMap((e) =>
    e.impacts
      .filter((i) => i.ticker === ticker)
      .map((i) => ({
        title: e.title,
        sub: `วันนี้, ${i.reason}`,
        exposure: i.exposure,
        lineId: e.lineId,
        href: getExposure(e.slug, ticker) ? `/event/${e.slug}/stock/${ticker}` : `/event/${e.slug}`,
      })),
  );
  return [...fromEvents, ...(sample.relatedPlaceholders[ticker] ?? [])];
}

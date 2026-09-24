// จุดเดียวที่หน้าเว็บใช้ดึงข้อมูล
// ตอนนี้อ่านจากข้อมูลตัวอย่าง ชิ้นที่ 2 จะเปลี่ยนให้อ่านจากฐานข้อมูล/API แทน โดยหน้าเว็บไม่ต้องแก้

import * as sample from "./sample/data";
import type { Company, Evidence, Exposure, Line, MarketEvent, StockExposure } from "./types";

export const IS_SAMPLE_DATA = true;

export const metrics = sample.metrics;
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

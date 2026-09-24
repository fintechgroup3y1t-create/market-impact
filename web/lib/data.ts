// จุดเดียวที่หน้าเว็บใช้ดึงข้อมูล
// เนื้อหาเหตุการณ์เดิม (น้ำมันพุ่ง) ยังเป็นข้อมูลตัวอย่างที่เขียนไว้อย่างดีจากชิ้นที่ 1-4 คงไว้เหมือนเดิม
// เหตุการณ์ใหม่ที่เขียนผ่านหน้าแอดมิน (ชิ้นที่ 5) เก็บในฐานข้อมูลจริง แล้ว "รวม" เข้ากับของตัวอย่างตอนแสดงผล
// "ตัวเลข" (metrics) อ่านจากฐานข้อมูลจริงเสมอตั้งแต่ชิ้นที่ 2 (ดู app/api/cron/prices)

import { and, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb, isDatabaseConfigured } from "@/db/client";
import {
  claimEvidence as claimEvidenceTable,
  claims as claimsTable,
  companyExposures as companyExposuresTable,
  entities as entitiesTable,
  eventCompanyImpacts as eventCompanyImpactsTable,
  events as eventsTable,
  evidence as evidenceTable,
  explanations as explanationsTable,
  impactChainSteps as impactChainStepsTable,
  impactChains as impactChainsTable,
  marketMetrics as marketMetricsTable,
} from "@/db/schema";
import * as sample from "./sample/data";
import type {
  ChainStep,
  Claim,
  Company,
  CompanyImpact,
  Evidence,
  Exposure,
  Faq,
  ImpactChain,
  Line,
  MarketEvent,
  MarketMetrics,
  MetricValue,
  QA,
  ReviewStatus,
  StockExposure,
  Template,
} from "./types";

export const IS_SAMPLE_DATA = true;

/**
 * ตัวเลขตลาดจริงจากฐานข้อมูล (ใส่โดย /api/cron/prices เท่านั้น)
 * ยังไม่มีข้อมูลตัวไหน (เช่น ยังไม่เคยรัน cron หรือฐานข้อมูลต่อไม่ได้) → placeholder นั้นแสดง "[ไม่มีข้อมูล]"
 * ไม่ใช้ข้อมูลสมมติมาแทนที่ เพื่อไม่ให้ใครเข้าใจผิดว่าเป็นตัวเลขจริง
 */
export const getMetrics = cache(async (): Promise<MarketMetrics> => {
  if (!isDatabaseConfigured()) return sample.metrics;
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

export function getCompany(ticker: string): Company | undefined {
  return sample.companies.find((c) => c.ticker === ticker);
}

// ---------- เหตุการณ์จากฐานข้อมูล (เขียนผ่านหน้าแอดมิน) ----------

type EventRow = typeof eventsTable.$inferSelect;

/** ดึงเหตุการณ์ทุกสถานะจาก DB มาประกอบเป็น MarketEvent — ใช้ทั้งฝั่งเว็บสาธารณะ (approved) และหน้าแอดมิน (ทุกสถานะ) */
async function loadDbEvents(rows: EventRow[]): Promise<MarketEvent[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const [explRows, claimRows, evidenceRows, chainRows, impactRows, entityRows] = await Promise.all([
    db.select().from(explanationsTable).where(inArray(explanationsTable.eventId, ids)),
    db.select().from(claimsTable).where(inArray(claimsTable.eventId, ids)),
    db.select().from(evidenceTable).where(inArray(evidenceTable.eventId, ids)),
    db.select().from(impactChainsTable).where(inArray(impactChainsTable.eventId, ids)),
    db.select().from(eventCompanyImpactsTable).where(inArray(eventCompanyImpactsTable.eventId, ids)),
    db.select().from(entitiesTable),
  ]);
  const chainIds = chainRows.map((c) => c.id);
  const stepRows = chainIds.length
    ? await db.select().from(impactChainStepsTable).where(inArray(impactChainStepsTable.chainId, chainIds))
    : [];
  const claimIds = claimRows.map((c) => c.id);
  const claimEvRows = claimIds.length
    ? await db.select().from(claimEvidenceTable).where(inArray(claimEvidenceTable.claimId, claimIds))
    : [];

  const tickerById = new Map(entityRows.map((e) => [e.id, e.ticker]));

  return rows.map((row): MarketEvent => {
    const sections = Object.fromEntries(
      explRows.filter((e) => e.eventId === row.id).map((e) => [e.section, e.contentJson]),
    ) as Record<string, unknown>;
    const quick = (sections.quick as MarketEvent["quick"]) ?? { what: "", who: "", tickers: [] };
    const understand = (sections.understand as QA[]) ?? [];
    const deep = (sections.deep as MarketEvent["deep"]) ?? { timeline: [], history: { text: "", note: "" }, watch: "" };
    const faq = (sections.faq as Faq[]) ?? [];

    const claims: Claim[] = claimRows
      .filter((c) => c.eventId === row.id)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        kind: c.kind,
        text: c.textTemplate,
        note: c.note ?? undefined,
        evidenceIds: claimEvRows.filter((ce) => ce.claimId === c.id).map((ce) => String(ce.evidenceId)),
      }));

    const chains: ImpactChain[] = chainRows
      .filter((c) => c.eventId === row.id)
      .map((c) => ({
        id: String(c.id),
        label: c.label,
        ticker: tickerById.get(c.entityId) ?? "?",
        exposure: c.exposure,
        steps: stepRows
          .filter((s) => s.chainId === c.id)
          .sort((a, b) => a.position - b.position)
          .map((s): ChainStep => ({ layer: s.layer, name: s.name, desc: s.descTemplate, confidence: s.confidenceLabel, strength: s.strength })),
      }));

    const impacts: CompanyImpact[] = impactRows
      .filter((i) => i.eventId === row.id)
      .map((i) => ({ ticker: tickerById.get(i.entityId) ?? "?", exposure: i.exposure, reason: i.reason }));

    return {
      slug: row.slug,
      lineId: row.factorId,
      title: row.title,
      updatedAt: row.updatedAt.toISOString(),
      reviewStatus: row.reviewStatus,
      explanationSource: { by: row.explanationBy, model: row.explanationModel ?? undefined, promptVersion: row.explanationPromptVersion ?? undefined },
      quick,
      understand,
      claims,
      deep,
      faq,
      chains,
      impacts,
      evidenceIds: evidenceRows.filter((e) => e.eventId === row.id).map((e) => String(e.id)),
    };
  });
}

/** เหตุการณ์ทุกเรื่อง (ทุกสถานะ) รวมของตัวอย่าง + ฐานข้อมูล — ใช้ในหน้าแอดมินเท่านั้น */
export const allEventsAnyStatus = cache(async (): Promise<MarketEvent[]> => {
  const sampleEvents = sample.events;
  if (!isDatabaseConfigured()) return sampleEvents;
  try {
    const rows = await getDb().select().from(eventsTable);
    const dbEvents = await loadDbEvents(rows);
    return [...sampleEvents, ...dbEvents];
  } catch (err) {
    console.error("allEventsAnyStatus: อ่านฐานข้อมูลไม่ได้", err);
    return sampleEvents;
  }
});

/** เผยแพร่เฉพาะเหตุการณ์ที่เจ้าของอนุมัติแล้ว (สาธารณะ) */
export async function publishedEvents(): Promise<MarketEvent[]> {
  const all = await allEventsAnyStatus();
  return all.filter((e) => e.reviewStatus === "approved");
}

export async function getEvent(slug: string): Promise<MarketEvent | undefined> {
  const all = await publishedEvents();
  return all.find((e) => e.slug === slug);
}

/** เหตุการณ์ทุกสถานะ ใช้ในหน้าแอดมิน (ดูรวมถึงที่ยังไม่อนุมัติ) */
export async function getEventAnyStatus(slug: string): Promise<MarketEvent | undefined> {
  const all = await allEventsAnyStatus();
  return all.find((e) => e.slug === slug);
}

export async function getEvidence(ids: string[]): Promise<Evidence[]> {
  if (ids.length === 0) return [];
  const numericIds = ids.map(Number).filter((n) => Number.isInteger(n));
  const dbIds = new Set(numericIds.map(String));
  const sampleResult = sample.evidence.filter((e) => ids.includes(e.id) && !dbIds.has(e.id));
  if (numericIds.length === 0 || !isDatabaseConfigured()) return sampleResult;
  try {
    const rows = await getDb().select().from(evidenceTable).where(inArray(evidenceTable.id, numericIds));
    const dbResult: Evidence[] = rows.map((r) => ({
      id: String(r.id),
      sourceName: r.sourceName,
      kind: r.kind,
      note: r.note,
      url: r.url,
      linkLabel: r.linkLabel,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      retrievedAt: r.retrievedAt?.toISOString() ?? null,
    }));
    return [...sampleResult, ...dbResult];
  } catch (err) {
    console.error("getEvidence: อ่านฐานข้อมูลไม่ได้", err);
    return sampleResult;
  }
}

// ---------- หลักฐาน 4 ชั้นของหุ้น (ทำไมถึงเป็นหุ้นตัวนี้) ----------

async function loadDbExposure(eventSlug: string, ticker: string): Promise<StockExposure | undefined> {
  if (!isDatabaseConfigured()) return undefined;
  try {
    const db = getDb();
    const [eventRow] = await db.select().from(eventsTable).where(eq(eventsTable.slug, eventSlug));
    const [entityRow] = await db.select().from(entitiesTable).where(eq(entitiesTable.ticker, ticker));
    if (!eventRow || !entityRow) return undefined;
    const [row] = await db
      .select()
      .from(companyExposuresTable)
      .where(and(eq(companyExposuresTable.entityId, entityRow.id), eq(companyExposuresTable.factorId, eventRow.factorId)));
    if (!row) return undefined;
    return {
      eventSlug,
      ticker,
      exposure: row.exposure,
      confidence: row.confidence as StockExposure["confidence"],
      summary: row.summary,
      layers: row.layers as StockExposure["layers"],
      today: row.today as StockExposure["today"],
    };
  } catch (err) {
    console.error("loadDbExposure: อ่านฐานข้อมูลไม่ได้", err);
    return undefined;
  }
}

export async function getExposure(slug: string, ticker: string): Promise<StockExposure | undefined> {
  const fromSample = sample.exposures.find((x) => x.eventSlug === slug && x.ticker === ticker);
  if (fromSample) return fromSample;
  return loadDbExposure(slug, ticker);
}

/** ใช้ใน generateStaticParams ของหน้า why-stock — ต้องรู้ล่วงหน้าว่ามี (event, ticker) คู่ไหนบ้าง */
export async function allExposures(): Promise<StockExposure[]> {
  const published = await publishedEvents();
  const publishedSlugs = new Set(published.map((e) => e.slug));
  const fromSample = sample.exposures.filter((x) => publishedSlugs.has(x.eventSlug));

  if (!isDatabaseConfigured()) return fromSample;
  try {
    const db = getDb();
    const dbEventSlugs = published.filter((e) => !sample.events.some((s) => s.slug === e.slug)).map((e) => e.slug);
    if (dbEventSlugs.length === 0) return fromSample;
    const rows = await db.select().from(companyExposuresTable);
    const entityRows = await db.select().from(entitiesTable);
    const tickerById = new Map(entityRows.map((e) => [e.id, e.ticker]));
    const factorByEvent = new Map(published.map((e) => [e.slug, e.lineId]));
    const out: StockExposure[] = [...fromSample];
    for (const slug of dbEventSlugs) {
      const factorId = factorByEvent.get(slug);
      for (const row of rows) {
        if (row.factorId !== factorId) continue;
        const ticker = tickerById.get(row.entityId);
        if (!ticker) continue;
        out.push({
          eventSlug: slug,
          ticker,
          exposure: row.exposure,
          confidence: row.confidence as StockExposure["confidence"],
          summary: row.summary,
          layers: row.layers as StockExposure["layers"],
          today: row.today as StockExposure["today"],
        });
      }
    }
    return out;
  } catch (err) {
    console.error("allExposures: อ่านฐานข้อมูลไม่ได้", err);
    return fromSample;
  }
}

export interface RelatedStory {
  title: string;
  sub: string;
  exposure: Exposure;
  lineId?: string;
  href?: string;
}

/** เรื่องที่เกี่ยวข้องกับหุ้นหนึ่งตัว ใช้ในหน้าค้นหุ้น */
export async function storiesForTicker(ticker: string): Promise<RelatedStory[]> {
  const published = await publishedEvents();
  const fromEvents: RelatedStory[] = [];
  for (const e of published) {
    for (const i of e.impacts) {
      if (i.ticker !== ticker) continue;
      const exposure = await getExposure(e.slug, ticker);
      fromEvents.push({
        title: e.title,
        sub: `วันนี้, ${i.reason}`,
        exposure: i.exposure,
        lineId: e.lineId,
        href: exposure ? `/event/${e.slug}/stock/${ticker}` : `/event/${e.slug}`,
      });
    }
  }
  return [...fromEvents, ...(sample.relatedPlaceholders[ticker] ?? [])];
}

export type { Template };

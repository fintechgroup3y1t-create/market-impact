// ฟังก์ชันที่หน้าแอดมินใช้: สร้างเหตุการณ์ใหม่, ดูรายการ, เปลี่ยนสถานะอนุมัติ
// เรียกจาก app/api/admin/events/* เท่านั้น

import { eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  claimEvidence,
  claims,
  entities,
  eventCompanyImpacts,
  events,
  evidence,
  explanations,
  factors,
  impactChainSteps,
  impactChains,
} from "./schema";
import type { ClaimKind, Exposure, Strength } from "../lib/types";

export interface NewEventEvidence {
  key: string; // อ้างอิงภายใน payload นี้เท่านั้น (ยังไม่มี id จริงตอนส่งมา)
  sourceName: string;
  kind: string;
  note: string;
  url?: string | null;
  linkLabel: string;
  publishedAt?: string | null;
  retrievedAt?: string | null;
}

export interface NewEventClaim {
  kind: ClaimKind;
  text: string;
  note?: string;
  evidenceKeys?: string[];
}

export interface NewEventChainStep {
  layer: string;
  name: string;
  desc: string;
  confidence: string;
  strength: Strength;
}

export interface NewEventChain {
  label: string;
  ticker: string;
  exposure: Exposure;
  steps: NewEventChainStep[];
}

export interface NewEventImpact {
  ticker: string;
  exposure: Exposure;
  reason: string;
}

export interface NewEventPayload {
  slug: string;
  lineId: string;
  title: string;
  quick: { what: string; who: string; tickers: string[] };
  understand: { q: string; a: string; glossary?: { term: string; def: string } }[];
  deep: { timeline: { when: string; text: string }[]; history: { text: string; note: string }; watch: string };
  faq: { q: string; a: string; evidenceNote: string; link?: { href: string; label: string } }[];
  evidence: NewEventEvidence[];
  claims: NewEventClaim[];
  chains: NewEventChain[];
  impacts: NewEventImpact[];
}

export class AdminEventError extends Error {}

/** สร้างเหตุการณ์ใหม่ทั้งหมดในทรานแซกชันเดียว สถานะเริ่มต้นเป็น "รอตรวจ" เสมอ (ต้องกดอนุมัติแยก) */
export async function createEvent(payload: NewEventPayload): Promise<{ slug: string }> {
  // slug ต้องเป็นภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลางเท่านั้น (แบบเดียวกับ "oil-supply")
  // ตัวอักษรไทยหรือช่องว่างใน slug ทำให้ URL มีปัญหาการเข้ารหัสจนเปิดหน้าจริงไม่เจอ แม้ข้อมูลจะถูกบันทึกสำเร็จก็ตาม
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(payload.slug)) {
    throw new AdminEventError(
      `slug "${payload.slug}" ใช้ไม่ได้ — ต้องเป็นภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลางเท่านั้น เช่น "oil-supply-2" (ห้ามมีภาษาไทยหรือช่องว่าง)`,
    );
  }

  const db = getDb();

  const [factor] = await db.select().from(factors).where(eq(factors.id, payload.lineId));
  if (!factor) throw new AdminEventError(`ไม่พบสาย "${payload.lineId}" (ต้องเป็น oil, inflation หรือ dollar)`);

  const allTickers = new Set([
    ...payload.chains.map((c) => c.ticker),
    ...payload.impacts.map((i) => i.ticker),
  ]);
  const entityRows = allTickers.size ? await db.select().from(entities) : [];
  const entityIdByTicker = new Map(entityRows.map((e) => [e.ticker, e.id]));
  for (const ticker of allTickers) {
    if (!entityIdByTicker.has(ticker)) {
      throw new AdminEventError(`ไม่พบหุ้น "${ticker}" ในฐานข้อมูล (ต้องเพิ่มบริษัทนี้ก่อน)`);
    }
  }

  return db.transaction(async (tx) => {
    const [eventRow] = await tx
      .insert(events)
      .values({ slug: payload.slug, factorId: payload.lineId, title: payload.title, reviewStatus: "pending_review", explanationBy: "team" })
      .returning({ id: events.id });
    const eventId = eventRow.id;

    const sections: [string, unknown][] = [
      ["quick", payload.quick],
      ["understand", payload.understand],
      ["deep", payload.deep],
      ["faq", payload.faq],
    ];
    for (const [section, content] of sections) {
      await tx.insert(explanations).values({ eventId, section, contentJson: content, by: "team" });
    }

    const evidenceIdByKey = new Map<string, number>();
    for (const ev of payload.evidence) {
      const [row] = await tx
        .insert(evidence)
        .values({
          eventId,
          sourceName: ev.sourceName,
          kind: ev.kind,
          note: ev.note,
          url: ev.url ?? null,
          linkLabel: ev.linkLabel,
          publishedAt: ev.publishedAt ? new Date(ev.publishedAt) : null,
          retrievedAt: ev.retrievedAt ? new Date(ev.retrievedAt) : null,
        })
        .returning({ id: evidence.id });
      evidenceIdByKey.set(ev.key, row.id);
    }

    for (const c of payload.claims) {
      const [row] = await tx
        .insert(claims)
        .values({ eventId, kind: c.kind, textTemplate: c.text, note: c.note ?? null })
        .returning({ id: claims.id });
      for (const key of c.evidenceKeys ?? []) {
        const evId = evidenceIdByKey.get(key);
        if (evId) await tx.insert(claimEvidence).values({ claimId: row.id, evidenceId: evId });
      }
    }

    for (const chain of payload.chains) {
      const entityId = entityIdByTicker.get(chain.ticker)!;
      const [chainRow] = await tx
        .insert(impactChains)
        .values({ eventId, entityId, label: chain.label, exposure: chain.exposure })
        .returning({ id: impactChains.id });
      for (const [i, step] of chain.steps.entries()) {
        await tx.insert(impactChainSteps).values({
          chainId: chainRow.id,
          position: i,
          layer: step.layer,
          name: step.name,
          descTemplate: step.desc,
          confidenceLabel: step.confidence,
          strength: step.strength,
        });
      }
    }

    for (const impact of payload.impacts) {
      const entityId = entityIdByTicker.get(impact.ticker)!;
      await tx.insert(eventCompanyImpacts).values({ eventId, entityId, exposure: impact.exposure, reason: impact.reason });
    }

    return { slug: payload.slug };
  });
}

export async function setEventStatus(slug: string, status: "approved" | "pending_review" | "pending_explanation") {
  const db = getDb();
  const result = await db.update(events).set({ reviewStatus: status, updatedAt: new Date() }).where(eq(events.slug, slug)).returning({ id: events.id });
  if (result.length === 0) throw new AdminEventError(`ไม่พบเหตุการณ์ "${slug}"`);
}

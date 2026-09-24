// ใส่ข้อมูลตั้งต้นลงฐานข้อมูล: factors, บริษัท 30-50 ตัว, และเนื้อหาเหตุการณ์ตัวอย่างเดิม
// (ตัวเลขราคาไม่ได้ใส่ตรงนี้ ราคาจริงมาจาก /api/cron/prices)
// รันด้วย: npm run db:seed (ต้องตั้ง DATABASE_URL ใน .env.local ก่อน)
// รันซ้ำได้ปลอดภัย (ON CONFLICT DO NOTHING / DO UPDATE)

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  claimEvidence,
  claims,
  companyExposures,
  entities,
  eventCompanyImpacts,
  eventFactors,
  events,
  evidence,
  explanations,
  factors,
  impactChains,
  impactChainSteps,
} from "./schema";
import { companies, events as sampleEvents, evidence as sampleEvidence, exposures as sampleExposures, lines } from "../lib/sample/data";

async function main() {
  const db = getDb();

  console.log("1/6 factors …");
  for (const l of lines) {
    await db
      .insert(factors)
      .values({ id: l.id, name: l.name, shortName: l.short, color: l.color })
      .onConflictDoUpdate({ target: factors.id, set: { name: l.name, shortName: l.short, color: l.color } });
  }

  console.log("2/6 entities (บริษัท) …");
  const entityIdByTicker = new Map<string, number>();
  for (const c of companies) {
    const [row] = await db
      .insert(entities)
      .values({ ticker: c.ticker, name: c.name, sector: c.sector || null, covered: c.covered })
      .onConflictDoUpdate({ target: entities.ticker, set: { name: c.name, sector: c.sector || null, covered: c.covered } })
      .returning({ id: entities.id, ticker: entities.ticker });
    entityIdByTicker.set(row.ticker, row.id);
  }

  console.log("3/6 เหตุการณ์ …");
  for (const e of sampleEvents) {
    const [eventRow] = await db
      .insert(events)
      .values({
        slug: e.slug,
        factorId: e.lineId,
        title: e.title,
        reviewStatus: e.reviewStatus,
        explanationBy: e.explanationSource.by,
        explanationModel: e.explanationSource.model ?? null,
        explanationPromptVersion: e.explanationSource.promptVersion ?? null,
      })
      .onConflictDoUpdate({
        target: events.slug,
        set: { title: e.title, reviewStatus: e.reviewStatus },
      })
      .returning({ id: events.id });
    const eventId = eventRow.id;

    await db.insert(eventFactors).values({ eventId, factorId: e.lineId, role: "primary" }).onConflictDoNothing();

    // เก็บ quick / understand / deep / faq เป็นคำอธิบายที่เขียนไว้ล่วงหน้า (by: team)
    const sections: [string, unknown][] = [
      ["quick", e.quick],
      ["understand", e.understand],
      ["deep", e.deep],
      ["faq", e.faq],
    ];
    for (const [section, content] of sections) {
      await db
        .insert(explanations)
        .values({ eventId, section, contentJson: content, by: "team" })
        .onConflictDoUpdate({ target: [explanations.eventId, explanations.section], set: { contentJson: content } });
    }

    // evidence ของเหตุการณ์นี้ + จำ id เดิม (slug ตัวอย่าง) -> id จริงในฐานข้อมูล
    const evidenceIdMap = new Map<string, number>();
    for (const evId of e.evidenceIds) {
      const src = sampleEvidence.find((x) => x.id === evId);
      if (!src) continue;
      const [row] = await db
        .insert(evidence)
        .values({
          eventId,
          sourceName: src.sourceName,
          kind: src.kind,
          note: src.note,
          url: src.url,
          linkLabel: src.linkLabel,
          publishedAt: src.publishedAt ? new Date(src.publishedAt) : null,
          retrievedAt: src.retrievedAt ? new Date(src.retrievedAt) : null,
        })
        .returning({ id: evidence.id });
      evidenceIdMap.set(evId, row.id);
    }

    // claims + ผูก evidence
    for (const [i, c] of e.claims.entries()) {
      const [row] = await db
        .insert(claims)
        .values({ eventId, kind: c.kind, textTemplate: c.text, note: c.note ?? null, position: i })
        .returning({ id: claims.id });
      for (const evId of c.evidenceIds) {
        const realId = evidenceIdMap.get(evId);
        if (realId) await db.insert(claimEvidence).values({ claimId: row.id, evidenceId: realId }).onConflictDoNothing();
      }
    }

    // impact chains + steps
    for (const chain of e.chains) {
      const entityId = entityIdByTicker.get(chain.ticker);
      if (!entityId) continue;
      const [chainRow] = await db
        .insert(impactChains)
        .values({ eventId, entityId, label: chain.label, exposure: chain.exposure })
        .returning({ id: impactChains.id });
      for (const [i, step] of chain.steps.entries()) {
        await db.insert(impactChainSteps).values({
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

    // หุ้นที่ได้รับผล (รายการสรุปในหน้าเหตุการณ์)
    for (const impact of e.impacts) {
      const entityId = entityIdByTicker.get(impact.ticker);
      if (!entityId) continue;
      await db
        .insert(eventCompanyImpacts)
        .values({ eventId, entityId, exposure: impact.exposure, reason: impact.reason })
        .onConflictDoUpdate({ target: [eventCompanyImpacts.eventId, eventCompanyImpacts.entityId], set: { exposure: impact.exposure, reason: impact.reason } });
    }
  }

  console.log("4/6 หลักฐาน 4 ชั้นของหุ้น (why-this-stock) …");
  for (const x of sampleExposures) {
    const entityId = entityIdByTicker.get(x.ticker);
    const event = sampleEvents.find((e) => e.slug === x.eventSlug);
    if (!entityId || !event) continue;
    await db
      .insert(companyExposures)
      .values({
        entityId,
        factorId: event.lineId,
        exposure: x.exposure,
        confidence: x.confidence,
        summary: x.summary,
        layers: x.layers,
        today: x.today,
      })
      .onConflictDoUpdate({
        target: [companyExposures.entityId, companyExposures.factorId],
        set: { exposure: x.exposure, confidence: x.confidence, summary: x.summary, layers: x.layers, today: x.today },
      });
  }

  console.log("5/6 เชื่อม event_company_impacts เข้ากับหลักฐาน 4 ชั้น (ถ้ามี) …");
  for (const e of sampleEvents) {
    for (const impact of e.impacts) {
      const entityId = entityIdByTicker.get(impact.ticker);
      if (!entityId) continue;
      const [exposureRow] = await db
        .select({ id: companyExposures.id })
        .from(companyExposures)
        .where(and(eq(companyExposures.entityId, entityId), eq(companyExposures.factorId, e.lineId)));
      if (!exposureRow) continue;
      const eventRow = (await db.select({ id: events.id }).from(events).where(eq(events.slug, e.slug)))[0];
      if (!eventRow) continue;
      await db
        .update(eventCompanyImpacts)
        .set({ companyExposureId: exposureRow.id })
        .where(and(eq(eventCompanyImpacts.eventId, eventRow.id), eq(eventCompanyImpacts.entityId, entityId)));
    }
  }

  console.log("6/6 เสร็จแล้ว");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// โครงสร้างฐานข้อมูล ตรงกับรายการตารางใน CLAUDE.md
// ใช้ Drizzle ORM คำสั่งสร้าง/แก้ตารางจริงอยู่ที่ `npm run db:push` (อ่านวิธีใน README.md ของ web/)

import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const exposureEnum = pgEnum("exposure", ["pos", "neg", "mix"]);
export const claimKindEnum = pgEnum("claim_kind", ["fact", "analysis", "uncertainty"]);
export const strengthEnum = pgEnum("strength", ["solid", "dashed"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending_explanation", "pending_review", "approved"]);
export const authorEnum = pgEnum("author_kind", ["team", "ai"]);
export const reviewActionEnum = pgEnum("review_action", ["approved", "rejected", "edited"]);

/** แหล่งข้อมูล เช่น สำนักข่าว, EIA, SEC */
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // ข่าว / ข้อมูลทางการ / เอกสารบริษัท / ข้อมูลตลาด
  homepageUrl: text("homepage_url"),
  licenseNote: text("license_note"), // ต้องมี license ก่อนใช้ข่าว ดู CLAUDE.md
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** เอกสารจริง เช่น ข่าวหนึ่งชิ้น, 10-K หนึ่งฉบับ, รายงาน EIA หนึ่งฉบับ */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id).notNull(),
  title: text("title").notNull(),
  url: text("url"),
  docType: text("doc_type").notNull(), // news / 10-K / official-data / market-data
  publishedAt: timestamp("published_at", { withTimezone: true }),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** บริษัท (30-50 ตัวตาม MVP) */
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  sector: text("sector"),
  covered: boolean("covered").default(false).notNull(),
  cik: text("cik"), // SEC Central Index Key ใช้ดึง 10-K
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** "สาย" ในแผนที่ผลกระทบ เช่น น้ำมัน, เงินเฟ้อ, ดอลลาร์ */
export const factors = pgTable("factors", {
  id: text("id").primaryKey(), // slug เช่น "oil"
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  color: text("color").notNull(), // a / b / c อ้างอิงตัวแปร CSS
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** กฎเริ่มต้น: sector หนึ่ง ๆ มักได้ผลด้านไหนจาก factor หนึ่ง ๆ (AI ช่วยร่าง เจ้าของตรวจ) */
export const factorSectorRules = pgTable(
  "factor_sector_rules",
  {
    id: serial("id").primaryKey(),
    factorId: text("factor_id").references(() => factors.id).notNull(),
    sector: text("sector").notNull(),
    exposure: exposureEnum("exposure").notNull(),
    rationale: text("rationale").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.factorId, t.sector)],
);

/** หลักฐาน 4 ชั้นของบริษัทหนึ่งตัวต่อ factor หนึ่งสาย (ใช้ในหน้า "ทำไมถึงเป็นหุ้นตัวนี้") */
export const companyExposures = pgTable(
  "company_exposures",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").references(() => entities.id).notNull(),
    factorId: text("factor_id").references(() => factors.id).notNull(),
    exposure: exposureEnum("exposure").notNull(),
    confidence: text("confidence").notNull(), // สูง / กลาง / ต่ำ
    summary: text("summary").notNull(),
    layers: jsonb("layers").notNull(), // EvidenceLayer[] จาก lib/types.ts
    today: jsonb("today").notNull(), // { label, value, emphasis }[] ส่วน "ตลาดวันนี้" (value เป็น placeholder เช่น {{DAL.ret_1d}})
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.entityId, t.factorId)],
);

/** เหตุการณ์ในตลาด */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  factorId: text("factor_id").references(() => factors.id).notNull(),
  title: text("title").notNull(),
  reviewStatus: reviewStatusEnum("review_status").default("pending_explanation").notNull(),
  explanationBy: authorEnum("explanation_by").default("team").notNull(),
  explanationModel: text("explanation_model"),
  explanationPromptVersion: text("explanation_prompt_version"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const eventDocuments = pgTable(
  "event_documents",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").references(() => events.id).notNull(),
    documentId: integer("document_id").references(() => documents.id).notNull(),
    role: text("role").default("supporting").notNull(), // primary / supporting
  },
  (t) => [unique().on(t.eventId, t.documentId)],
);

export const eventFactors = pgTable(
  "event_factors",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").references(() => events.id).notNull(),
    factorId: text("factor_id").references(() => factors.id).notNull(),
    role: text("role").default("primary").notNull(), // primary / secondary
  },
  (t) => [unique().on(t.eventId, t.factorId)],
);

/** impact_chains + impact_chain_steps: เส้นทางผลกระทบแนวตั้งของหุ้นหนึ่งตัวในเหตุการณ์หนึ่ง */
export const impactChains = pgTable("impact_chains", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  entityId: integer("entity_id").references(() => entities.id).notNull(),
  label: text("label").notNull(), // เช่น "ไปสายการบิน"
  exposure: exposureEnum("exposure").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const impactChainSteps = pgTable(
  "impact_chain_steps",
  {
    id: serial("id").primaryKey(),
    chainId: integer("chain_id").references(() => impactChains.id).notNull(),
    position: integer("position").notNull(),
    layer: text("layer").notNull(), // เหตุการณ์ / เศรษฐกิจ / อุตสาหกรรม / บริษัท
    name: text("name").notNull(),
    descTemplate: text("desc_template").notNull(), // ข้อความมี placeholder {{TICKER.field}}
    confidenceLabel: text("confidence_label").notNull(),
    strength: strengthEnum("strength").notNull(),
  },
  (t) => [index("impact_chain_steps_chain_idx").on(t.chainId, t.position)],
);

/** สรุปสั้นว่าหุ้นแต่ละตัวในเหตุการณ์นี้ได้รับผลด้านไหนและทำไม (โชว์ในหน้าเหตุการณ์) */
export const eventCompanyImpacts = pgTable(
  "event_company_impacts",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").references(() => events.id).notNull(),
    entityId: integer("entity_id").references(() => entities.id).notNull(),
    exposure: exposureEnum("exposure").notNull(),
    reason: text("reason").notNull(),
    companyExposureId: integer("company_exposure_id").references(() => companyExposures.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.eventId, t.entityId)],
);

/** claims: แยก Fact / Analysis / Uncertainty เสมอ */
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  kind: claimKindEnum("kind").notNull(),
  textTemplate: text("text_template").notNull(),
  note: text("note"),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** evidence: source name, URL, published_at, retrieved_at ตามกฎ */
export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  sourceName: text("source_name").notNull(),
  kind: text("kind").notNull(),
  note: text("note").notNull(),
  url: text("url"),
  linkLabel: text("link_label").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** ทุก Fact ต้องผูกกับ evidence อย่างน้อยหนึ่งรายการ */
export const claimEvidence = pgTable(
  "claim_evidence",
  {
    id: serial("id").primaryKey(),
    claimId: integer("claim_id").references(() => claims.id).notNull(),
    evidenceId: integer("evidence_id").references(() => evidence.id).notNull(),
  },
  (t) => [unique().on(t.claimId, t.evidenceId)],
);

/** ราคาปิดรายวัน ดึงจาก Tiingo (หรือ ETF ตัวแทนสำหรับดัชนี/โภคภัณฑ์) */
export const prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(), // ticker จริงที่ดึงจาก API (อาจเป็น ETF ตัวแทน)
    asOfDate: text("as_of_date").notNull(), // YYYY-MM-DD (เวลาตลาดสหรัฐฯ)
    close: doublePrecision("close").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.ticker, t.asOfDate)],
);

/** ตัวเลขที่คำนวณแล้ว พร้อมใส่ใน placeholder เช่น {{DAL.ret_1d}} */
export const marketMetrics = pgTable(
  "market_metrics",
  {
    id: serial("id").primaryKey(),
    entityKey: text("entity_key").notNull(), // ticker ที่ใช้ในหน้าเว็บ เช่น "WTI" หรือ "DAL"
    metric: text("metric").notNull(), // ret_1d / abn_ret_1d / close / chg_bps / beta_oil_2y
    value: doublePrecision("value").notNull(),
    unit: text("unit").notNull(), // pct / bps / usd / number
    asOfDate: text("as_of_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.entityKey, t.metric, t.asOfDate)],
);

/** Beta ของหุ้นต่อ factor หนึ่ง ๆ คำนวณจากราคาย้อนหลัง (ไม่ใช่ AI) */
export const factorSensitivity = pgTable(
  "factor_sensitivity",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").references(() => entities.id).notNull(),
    factorId: text("factor_id").references(() => factors.id).notNull(),
    windowLabel: text("window_label").notNull(), // เช่น "2y"
    beta: doublePrecision("beta").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.entityId, t.factorId, t.windowLabel)],
);

/** คำอธิบายที่สร้างครั้งเดียวต่อเหตุการณ์แล้วเก็บไว้ (quick/understand/deep/FAQ) */
export const explanations = pgTable(
  "explanations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").references(() => events.id).notNull(),
    section: text("section").notNull(), // quick / understand / deep / faq
    contentJson: jsonb("content_json").notNull(),
    by: authorEnum("by").default("team").notNull(),
    model: text("model"), // ทุก record ที่ AI สร้างต้องเก็บ model
    promptVersion: text("prompt_version"), // และ prompt_version
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.eventId, t.section)],
);

/** คำศัพท์ที่ขีดเส้นใต้ในเนื้อหา เช่น "อุปทาน", "Beta" */
export const glossary = pgTable("glossary", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** ประวัติการอนุมัติ/แก้ไขของเจ้าของในหน้าแอดมิน (ชิ้นที่ 5) */
export const reviewLog = pgTable("review_log", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  entityId: integer("entity_id").references(() => entities.id),
  action: reviewActionEnum("action").notNull(),
  actor: text("actor").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- ความสัมพันธ์ (ใช้ตอน query ผ่าน Drizzle relational API) ----------

export const eventsRelations = relations(events, ({ many, one }) => ({
  factor: one(factors, { fields: [events.factorId], references: [factors.id] }),
  claims: many(claims),
  evidence: many(evidence),
  impactChains: many(impactChains),
  companyImpacts: many(eventCompanyImpacts),
  explanations: many(explanations),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  event: one(events, { fields: [claims.eventId], references: [events.id] }),
  claimEvidence: many(claimEvidence),
}));

export const claimEvidenceRelations = relations(claimEvidence, ({ one }) => ({
  claim: one(claims, { fields: [claimEvidence.claimId], references: [claims.id] }),
  evidence: one(evidence, { fields: [claimEvidence.evidenceId], references: [evidence.id] }),
}));

export const impactChainsRelations = relations(impactChains, ({ one, many }) => ({
  event: one(events, { fields: [impactChains.eventId], references: [events.id] }),
  entity: one(entities, { fields: [impactChains.entityId], references: [entities.id] }),
  steps: many(impactChainSteps),
}));

export const impactChainStepsRelations = relations(impactChainSteps, ({ one }) => ({
  chain: one(impactChains, { fields: [impactChainSteps.chainId], references: [impactChains.id] }),
}));

export const entitiesRelations = relations(entities, ({ many }) => ({
  companyExposures: many(companyExposures),
  impacts: many(eventCompanyImpacts),
}));

export const companyExposuresRelations = relations(companyExposures, ({ one }) => ({
  entity: one(entities, { fields: [companyExposures.entityId], references: [entities.id] }),
  factor: one(factors, { fields: [companyExposures.factorId], references: [factors.id] }),
}));

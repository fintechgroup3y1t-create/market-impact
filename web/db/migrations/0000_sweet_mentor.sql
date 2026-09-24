CREATE TYPE "public"."author_kind" AS ENUM('team', 'ai');--> statement-breakpoint
CREATE TYPE "public"."claim_kind" AS ENUM('fact', 'analysis', 'uncertainty');--> statement-breakpoint
CREATE TYPE "public"."exposure" AS ENUM('pos', 'neg', 'mix');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('approved', 'rejected', 'edited');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending_explanation', 'pending_review', 'approved');--> statement-breakpoint
CREATE TYPE "public"."strength" AS ENUM('solid', 'dashed');--> statement-breakpoint
CREATE TABLE "claim_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"evidence_id" integer NOT NULL,
	CONSTRAINT "claim_evidence_claim_id_evidence_id_unique" UNIQUE("claim_id","evidence_id")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"kind" "claim_kind" NOT NULL,
	"text_template" text NOT NULL,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_exposures" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"factor_id" text NOT NULL,
	"exposure" "exposure" NOT NULL,
	"confidence" text NOT NULL,
	"summary" text NOT NULL,
	"layers" jsonb NOT NULL,
	"today" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_exposures_entity_id_factor_id_unique" UNIQUE("entity_id","factor_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"doc_type" text NOT NULL,
	"published_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"name" text NOT NULL,
	"sector" text,
	"covered" boolean DEFAULT false NOT NULL,
	"cik" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entities_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "event_company_impacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"exposure" "exposure" NOT NULL,
	"reason" text NOT NULL,
	"company_exposure_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_company_impacts_event_id_entity_id_unique" UNIQUE("event_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "event_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"role" text DEFAULT 'supporting' NOT NULL,
	CONSTRAINT "event_documents_event_id_document_id_unique" UNIQUE("event_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "event_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"factor_id" text NOT NULL,
	"role" text DEFAULT 'primary' NOT NULL,
	CONSTRAINT "event_factors_event_id_factor_id_unique" UNIQUE("event_id","factor_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"factor_id" text NOT NULL,
	"title" text NOT NULL,
	"review_status" "review_status" DEFAULT 'pending_explanation' NOT NULL,
	"explanation_by" "author_kind" DEFAULT 'team' NOT NULL,
	"explanation_model" text,
	"explanation_prompt_version" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"source_name" text NOT NULL,
	"kind" text NOT NULL,
	"note" text NOT NULL,
	"url" text,
	"link_label" text NOT NULL,
	"published_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explanations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"section" text NOT NULL,
	"content_json" jsonb NOT NULL,
	"by" "author_kind" DEFAULT 'team' NOT NULL,
	"model" text,
	"prompt_version" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "explanations_event_id_section_unique" UNIQUE("event_id","section")
);
--> statement-breakpoint
CREATE TABLE "factor_sector_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"factor_id" text NOT NULL,
	"sector" text NOT NULL,
	"exposure" "exposure" NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factor_sector_rules_factor_id_sector_unique" UNIQUE("factor_id","sector")
);
--> statement-breakpoint
CREATE TABLE "factor_sensitivity" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"factor_id" text NOT NULL,
	"window_label" text NOT NULL,
	"beta" double precision NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factor_sensitivity_entity_id_factor_id_window_label_unique" UNIQUE("entity_id","factor_id","window_label")
);
--> statement-breakpoint
CREATE TABLE "factors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glossary" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_term_unique" UNIQUE("term")
);
--> statement-breakpoint
CREATE TABLE "impact_chain_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"position" integer NOT NULL,
	"layer" text NOT NULL,
	"name" text NOT NULL,
	"desc_template" text NOT NULL,
	"confidence_label" text NOT NULL,
	"strength" "strength" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_chains" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"label" text NOT NULL,
	"exposure" "exposure" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_key" text NOT NULL,
	"metric" text NOT NULL,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"as_of_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_metrics_entity_key_metric_as_of_date_unique" UNIQUE("entity_key","metric","as_of_date")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"as_of_date" text NOT NULL,
	"close" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prices_ticker_as_of_date_unique" UNIQUE("ticker","as_of_date")
);
--> statement-breakpoint
CREATE TABLE "review_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"entity_id" integer,
	"action" "review_action" NOT NULL,
	"actor" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"homepage_url" text,
	"license_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_exposures" ADD CONSTRAINT "company_exposures_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_exposures" ADD CONSTRAINT "company_exposures_factor_id_factors_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_company_impacts" ADD CONSTRAINT "event_company_impacts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_company_impacts" ADD CONSTRAINT "event_company_impacts_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_company_impacts" ADD CONSTRAINT "event_company_impacts_company_exposure_id_company_exposures_id_fk" FOREIGN KEY ("company_exposure_id") REFERENCES "public"."company_exposures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_documents" ADD CONSTRAINT "event_documents_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_documents" ADD CONSTRAINT "event_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_factors" ADD CONSTRAINT "event_factors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_factors" ADD CONSTRAINT "event_factors_factor_id_factors_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_factor_id_factors_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explanations" ADD CONSTRAINT "explanations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_sector_rules" ADD CONSTRAINT "factor_sector_rules_factor_id_factors_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_sensitivity" ADD CONSTRAINT "factor_sensitivity_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_sensitivity" ADD CONSTRAINT "factor_sensitivity_factor_id_factors_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_chain_steps" ADD CONSTRAINT "impact_chain_steps_chain_id_impact_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."impact_chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_chains" ADD CONSTRAINT "impact_chains_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_chains" ADD CONSTRAINT "impact_chains_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "impact_chain_steps_chain_idx" ON "impact_chain_steps" USING btree ("chain_id","position");
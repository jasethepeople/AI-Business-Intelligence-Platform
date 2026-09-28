import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  website: text("website"),
  description: text("description").notNull(),
  stage: text("stage").notNull().default("watchlist"),
  score: integer("score").notNull().default(0),
  scoreLabel: text("score_label").notNull().default("Unscored"),
  estimatedRevenue: numeric("estimated_revenue", { precision: 14, scale: 2 }),
  estimatedAutomationLift: integer("estimated_automation_lift").notNull().default(0),
  lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const signalsTable = pgTable("signals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  summary: text("summary").notNull(),
  strength: integer("strength").notNull(),
  source: text("source").notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memosTable = pgTable("memos", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  thesis: text("thesis").notNull(),
  opportunity: text("opportunity").notNull(),
  risks: text("risks").array().notNull(),
  nextSteps: text("next_steps").array().notNull(),
  estimatedPurchaseRange: text("estimated_purchase_range").notNull(),
  estimatedPostAcquisitionProfit: text("estimated_post_acquisition_profit").notNull(),
  confidence: integer("confidence").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const discoveryRunsTable = pgTable("discovery_runs", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  categories: text("categories").array().notNull(),
  status: text("status").notNull().default("completed"),
  targetsFound: integer("targets_found").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  businessId: integer("business_id").references(() => businessesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  id: true,
  score: true,
  scoreLabel: true,
  estimatedAutomationLift: true,
  lastObservedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
export type Signal = typeof signalsTable.$inferSelect;
export type Memo = typeof memosTable.$inferSelect;
export type DiscoveryRun = typeof discoveryRunsTable.$inferSelect;
export type Activity = typeof activityTable.$inferSelect;
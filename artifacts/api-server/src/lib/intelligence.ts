import { desc, eq } from "drizzle-orm";
import { db, activityTable, businessesTable, memosTable, signalsTable } from "@workspace/db";

export type BusinessRow = typeof businessesTable.$inferSelect;
export type SignalRow = typeof signalsTable.$inferSelect;

export function parseRevenue(value: string | number | null): number | null {
  if (value == null) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Priority target";
  if (score >= 65) return "Strong signal";
  if (score >= 45) return "Worth watching";
  return "Early signal";
}

export function businessPayload(row: BusinessRow, signalCount: number) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    location: row.location,
    website: row.website,
    description: row.description,
    stage: row.stage,
    score: row.score,
    scoreLabel: row.scoreLabel,
    estimatedRevenue: parseRevenue(row.estimatedRevenue),
    estimatedAutomationLift: row.estimatedAutomationLift,
    signalCount,
    lastObservedAt: row.lastObservedAt,
    createdAt: row.createdAt,
  };
}

export async function getSignalCounts(): Promise<Map<number, number>> {
  const signals = await db.select({ businessId: signalsTable.businessId }).from(signalsTable);
  const counts = new Map<number, number>();
  for (const signal of signals) {
    counts.set(signal.businessId, (counts.get(signal.businessId) ?? 0) + 1);
  }
  return counts;
}

export async function recordActivity(input: {
  kind: string;
  title: string;
  detail: string;
  businessId?: number | null;
}): Promise<void> {
  await db.insert(activityTable).values({
    kind: input.kind,
    title: input.title,
    detail: input.detail,
    businessId: input.businessId ?? null,
  });
}

export async function getBusinessWithContext(businessId: number) {
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!business) return null;

  const signals = await db
    .select()
    .from(signalsTable)
    .where(eq(signalsTable.businessId, businessId))
    .orderBy(desc(signalsTable.strength), desc(signalsTable.observedAt));
  const [memo] = await db
    .select()
    .from(memosTable)
    .where(eq(memosTable.businessId, businessId))
    .orderBy(desc(memosTable.generatedAt))
    .limit(1);

  return {
    business: businessPayload(business, signals.length),
    signals,
    memo: memo
      ? {
          id: memo.id,
          businessId: memo.businessId,
          thesis: memo.thesis,
          opportunity: memo.opportunity,
          risks: memo.risks,
          nextSteps: memo.nextSteps,
          estimatedPurchaseRange: memo.estimatedPurchaseRange,
          estimatedPostAcquisitionProfit: memo.estimatedPostAcquisitionProfit,
          confidence: memo.confidence,
          generatedAt: memo.generatedAt,
        }
      : null,
  };
}

export async function generateMemoForBusiness(businessId: number) {
  const context = await getBusinessWithContext(businessId);
  if (!context) return null;

  const revenue = context.business.estimatedRevenue ?? 0;
  const purchaseLow = Math.max(50000, Math.round(revenue * 0.8));
  const purchaseHigh = Math.max(purchaseLow + 25000, Math.round(revenue * 1.5));
  const annualProfit = Math.round(revenue * (0.22 + context.business.estimatedAutomationLift / 1000));
  const confidence = Math.min(
    96,
    Math.max(42, Math.round(context.business.score * 0.75 + context.signals.length * 4)),
  );
  const strongSignals = context.signals
    .filter((signal) => signal.strength >= 70)
    .map((signal) => signal.label.toLowerCase());
  const signalSentence =
    strongSignals.length > 0
      ? `Evidence points to ${strongSignals.slice(0, 2).join(" and ")}.`
      : "The signal set is early and should be expanded before outreach.";

  return {
    thesis: `${context.business.name} looks like a credible automation-led acquisition candidate in ${context.business.location}. ${signalSentence}`,
    opportunity: `A focused operating system could remove manual work, protect recurring revenue, and create an estimated ${context.business.estimatedAutomationLift}% efficiency lift without changing the core customer promise.`,
    risks: [
      "Revenue and owner-dependence estimates are directional until diligence data is connected.",
      "Local market concentration could limit growth beyond the current service area.",
      "The operating thesis depends on adoption of a repeatable workflow after close.",
    ],
    nextSteps: [
      "Validate the last 24 months of revenue, gross margin, and customer retention.",
      "Interview the owner about workload, succession plans, and critical-person risk.",
      "Map the top three manual workflows and test one automation wedge.",
    ],
    estimatedPurchaseRange: `$${purchaseLow.toLocaleString()}–$${purchaseHigh.toLocaleString()}`,
    estimatedPostAcquisitionProfit: `$${annualProfit.toLocaleString()} estimated annual operating profit`,
    confidence,
  };
}
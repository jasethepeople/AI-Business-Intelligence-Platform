import { db, activityTable, businessesTable, discoveryRunsTable, signalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { recordActivity, scoreLabel } from "./intelligence";

export async function seedDemoData(): Promise<void> {
  const existing = await db.select({ id: businessesTable.id }).from(businessesTable).limit(1);
  if (existing.length > 0) return;

  const now = new Date();
  const businesses = await db
    .insert(businessesTable)
    .values([
      {
        name: "Front Range Garage Doors",
        category: "Home services",
        location: "Denver, CO",
        website: "https://frontrangegaragedoors.example",
        description: "A recurring-revenue garage door service operator with a strong local reputation and an owner-led dispatch workflow.",
        stage: "qualified",
        score: 86,
        scoreLabel: scoreLabel(86),
        estimatedRevenue: "920000",
        estimatedAutomationLift: 44,
        lastObservedAt: now,
      },
      {
        name: "Juniper Commercial Cleaning",
        category: "Commercial services",
        location: "Aurora, CO",
        website: "https://junipercleaning.example",
        description: "A contract cleaning business with repeat accounts, spreadsheet-heavy scheduling, and a retiring owner.",
        stage: "diligence",
        score: 78,
        scoreLabel: scoreLabel(78),
        estimatedRevenue: "1400000",
        estimatedAutomationLift: 61,
        lastObservedAt: now,
      },
      {
        name: "Peakline HVAC Care",
        category: "Home services",
        location: "Lakewood, CO",
        website: null,
        description: "An established HVAC maintenance shop with repeat service plans and an opportunity to modernize customer follow-up.",
        stage: "watchlist",
        score: 68,
        scoreLabel: scoreLabel(68),
        estimatedRevenue: "680000",
        estimatedAutomationLift: 37,
        lastObservedAt: now,
      },
    ])
    .returning();

  await db.insert(signalsTable).values([
    {
      businessId: businesses[0].id,
      type: "recurring_revenue",
      label: "Service-plan density",
      summary: "A meaningful share of customers are on repeat maintenance plans.",
      strength: 92,
      source: "Customer review synthesis",
      observedAt: now,
    },
    {
      businessId: businesses[0].id,
      type: "operations",
      label: "Manual dispatch workflow",
      summary: "Scheduling appears to rely on phone calls and a shared calendar.",
      strength: 84,
      source: "Operating model inference",
      observedAt: now,
    },
    {
      businessId: businesses[0].id,
      type: "market",
      label: "Local demand resilience",
      summary: "High-intent service demand is supported by an aging housing stock.",
      strength: 81,
      source: "Market context",
      observedAt: now,
    },
    {
      businessId: businesses[1].id,
      type: "owner",
      label: "Succession window",
      summary: "Owner retirement language creates a potential timing advantage.",
      strength: 89,
      source: "Public leadership signals",
      observedAt: now,
    },
    {
      businessId: businesses[1].id,
      type: "technology",
      label: "Spreadsheet dependency",
      summary: "Routing and labor planning appear to run through spreadsheets.",
      strength: 86,
      source: "Operating model inference",
      observedAt: now,
    },
    {
      businessId: businesses[1].id,
      type: "recurring_revenue",
      label: "Contracted accounts",
      summary: "Commercial contracts create predictable baseline revenue.",
      strength: 78,
      source: "Customer sentiment synthesis",
      observedAt: now,
    },
    {
      businessId: businesses[2].id,
      type: "growth",
      label: "Service area expansion",
      summary: "Recent hiring suggests the team is testing a wider service radius.",
      strength: 73,
      source: "Hiring signal",
      observedAt: now,
    },
  ]);

  await db.insert(discoveryRunsTable).values({
    location: "Denver Metro",
    categories: ["Home services", "Commercial services"],
    status: "completed",
    targetsFound: 3,
    averageScore: 77,
    startedAt: new Date(now.getTime() - 1000 * 60 * 18),
    completedAt: new Date(now.getTime() - 1000 * 60 * 14),
  });

  await db.insert(activityTable).values([
    {
      kind: "discovery",
      title: "Discovery run completed",
      detail: "3 local service targets surfaced across Denver Metro.",
      createdAt: new Date(now.getTime() - 1000 * 60 * 14),
    },
    {
      kind: "signal",
      title: "High-confidence signal detected",
      detail: "Front Range Garage Doors shows strong service-plan density.",
      businessId: businesses[0].id,
      createdAt: new Date(now.getTime() - 1000 * 60 * 18),
    },
  ]);

  // Guard against a partially completed seed being mistaken for a clean install.
  const [first] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.id, businesses[0].id));
  if (!first) throw new Error("Demo data seed did not persist");
}
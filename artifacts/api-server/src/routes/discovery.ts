import { desc } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { CreateDiscoveryRunBody, CreateDiscoveryRunResponse, ListDiscoveryRunsResponse } from "@workspace/api-zod";
import { db, businessesTable, discoveryRunsTable, signalsTable } from "@workspace/db";
import { recordActivity, scoreLabel } from "../lib/intelligence";

const router: IRouter = Router();

const candidateTemplates = [
  {
    name: "Mile High Fleet Wash",
    category: "Commercial services",
    description: "A route-based fleet washing operator with repeat contracts and a manual booking process.",
    score: 74,
    lift: 52,
    revenue: "760000",
    signal: ["operations", "Route scheduling opportunity", "Recurring routes create a clear automation wedge.", 82],
  },
  {
    name: "Canyon View Plumbing",
    category: "Home services",
    description: "A local plumbing team with strong word-of-mouth demand and limited digital follow-up.",
    score: 71,
    lift: 34,
    revenue: "590000",
    signal: ["growth", "Demand exceeds follow-up capacity", "Hiring and review momentum suggest a capacity constraint.", 76],
  },
  {
    name: "Blue Spruce Grounds",
    category: "Property services",
    description: "A recurring landscaping business with seasonal contracts and fragmented crew coordination.",
    score: 67,
    lift: 48,
    revenue: "840000",
    signal: ["technology", "Fragmented crew coordination", "Scheduling complexity may be suppressing margin.", 79],
  },
] as const;

router.get("/discovery-runs", async (_req, res): Promise<void> => {
  const runs = await db.select().from(discoveryRunsTable).orderBy(desc(discoveryRunsTable.startedAt)).limit(20);
  res.json(ListDiscoveryRunsResponse.parse(runs));
});

router.post("/discovery-runs", async (req, res): Promise<void> => {
  const parsed = CreateDiscoveryRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const startedAt = new Date();
  const created = [];
  for (const [index, template] of candidateTemplates.entries()) {
    const category = parsed.data.categories[index % parsed.data.categories.length];
    const [business] = await db
      .insert(businessesTable)
      .values({
        name: `${template.name} · ${parsed.data.location}`,
        category,
        location: parsed.data.location,
        description: template.description,
        stage: "watchlist",
        score: template.score,
        scoreLabel: scoreLabel(template.score),
        estimatedRevenue: template.revenue,
        estimatedAutomationLift: template.lift,
        lastObservedAt: startedAt,
      })
      .returning();
    created.push(business);
    await db.insert(signalsTable).values({
      businessId: business.id,
      type: template.signal[0],
      label: template.signal[1],
      summary: template.signal[2],
      strength: template.signal[3],
      source: "Signal Foundry discovery model",
      observedAt: startedAt,
    });
  }
  const averageScore = Math.round(created.reduce((sum, row) => sum + row.score, 0) / created.length);
  const [run] = await db
    .insert(discoveryRunsTable)
    .values({
      location: parsed.data.location,
      categories: parsed.data.categories,
      status: "completed",
      targetsFound: created.length,
      averageScore,
      startedAt,
      completedAt: new Date(),
    })
    .returning();
  await recordActivity({
    kind: "discovery",
    title: "Discovery run completed",
    detail: `${created.length} local targets surfaced in ${parsed.data.location}.`,
  });
  res.status(201).json(CreateDiscoveryRunResponse.parse(run));
});

export default router;
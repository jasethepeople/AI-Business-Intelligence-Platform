import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { db, businessesTable, discoveryRunsTable } from "@workspace/db";
import { businessPayload, getSignalCounts, parseRevenue } from "../lib/intelligence";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const rows = await db.select().from(businessesTable).orderBy(desc(businessesTable.score));
  const [latestRun] = await db.select().from(discoveryRunsTable).orderBy(desc(discoveryRunsTable.startedAt)).limit(1);
  const counts = await getSignalCounts();
  const targets = rows.map((row) => businessPayload(row, counts.get(row.id) ?? 0));
  const averageScore = targets.length > 0 ? Math.round(targets.reduce((sum, row) => sum + row.score, 0) / targets.length) : 0;
  const estimatedRevenuePool = targets.reduce((sum, row) => sum + (row.estimatedRevenue ?? 0), 0);
  const automationOpportunity = targets.length > 0
    ? Math.round(targets.reduce((sum, row) => sum + row.estimatedAutomationLift, 0) / targets.length)
    : 0;
  const summary = {
    targetCount: targets.length,
    qualifiedCount: targets.filter((row) => ["qualified", "diligence"].includes(row.stage)).length,
    averageScore,
    estimatedRevenuePool,
    automationOpportunity,
    topTargets: targets.slice(0, 5),
    latestRun: latestRun
      ? {
          id: latestRun.id,
          location: latestRun.location,
          categories: latestRun.categories,
          status: latestRun.status,
          targetsFound: latestRun.targetsFound,
          averageScore: latestRun.averageScore,
          startedAt: latestRun.startedAt,
          completedAt: latestRun.completedAt,
        }
      : null,
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
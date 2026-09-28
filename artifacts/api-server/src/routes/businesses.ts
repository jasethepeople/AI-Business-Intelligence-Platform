import { and, desc, eq, gte, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateBusinessBody,
  CreateBusinessResponse,
  GenerateBusinessMemoParams,
  GenerateBusinessMemoResponse,
  GetBusinessMemoParams,
  GetBusinessMemoResponse,
  GetBusinessParams,
  GetBusinessResponse,
  ListBusinessesQueryParams,
  ListBusinessesResponse,
  UpdateBusinessBody,
  UpdateBusinessParams,
  UpdateBusinessResponse,
} from "@workspace/api-zod";
import { db, businessesTable, signalsTable, memosTable } from "@workspace/db";
import {
  businessPayload,
  generateMemoForBusiness,
  getBusinessWithContext,
  getSignalCounts,
  recordActivity,
  scoreLabel,
} from "../lib/intelligence";

const router: IRouter = Router();

router.get("/businesses", async (req, res): Promise<void> => {
  const parsed = ListBusinessesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, location, category, stage, minScore, limit = 50 } = parsed.data;
  const filters = [];
  if (search) {
    filters.push(or(ilike(businessesTable.name, `%${search}%`), ilike(businessesTable.description, `%${search}%`)));
  }
  if (location) filters.push(ilike(businessesTable.location, `%${location}%`));
  if (category) filters.push(ilike(businessesTable.category, `%${category}%`));
  if (stage) filters.push(eq(businessesTable.stage, stage));
  if (minScore !== undefined) filters.push(gte(businessesTable.score, minScore));

  const rows = await db
    .select()
    .from(businessesTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(businessesTable.score), desc(businessesTable.lastObservedAt))
    .limit(limit);
  const counts = await getSignalCounts();
  res.json(ListBusinessesResponse.parse(rows.map((row) => businessPayload(row, counts.get(row.id) ?? 0))));
});

router.post("/businesses", async (req, res): Promise<void> => {
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(businessesTable)
    .values({
      ...parsed.data,
      stage: parsed.data.stage ?? "watchlist",
      estimatedRevenue: parsed.data.estimatedRevenue?.toString() ?? null,
      score: 0,
      scoreLabel: scoreLabel(0),
      estimatedAutomationLift: 0,
    })
    .returning();
  await recordActivity({
    kind: "target",
    title: "Target added",
    detail: `${row.name} was added to the target universe.`,
    businessId: row.id,
  });
  res.status(201).json(CreateBusinessResponse.parse(businessPayload(row, 0)));
});

router.get("/businesses/:businessId", async (req, res): Promise<void> => {
  const params = GetBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const context = await getBusinessWithContext(params.data.businessId);
  if (!context) {
    res.status(404).json({ error: "Business target not found" });
    return;
  }
  res.json(GetBusinessResponse.parse({
    ...context.business,
    signals: context.signals,
    memo: context.memo,
  }));
});

router.patch("/businesses/:businessId", async (req, res): Promise<void> => {
  const params = UpdateBusinessParams.safeParse(req.params);
  const body = UpdateBusinessBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [row] = await db
    .update(businessesTable)
    .set({
      ...body.data,
      estimatedRevenue: body.data.estimatedRevenue === undefined ? undefined : body.data.estimatedRevenue?.toString() ?? null,
    })
    .where(eq(businessesTable.id, params.data.businessId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Business target not found" });
    return;
  }
  const counts = await getSignalCounts();
  await recordActivity({
    kind: "target",
    title: "Target updated",
    detail: `${row.name} moved to ${row.stage}.`,
    businessId: row.id,
  });
  res.json(UpdateBusinessResponse.parse(businessPayload(row, counts.get(row.id) ?? 0)));
});

router.get("/businesses/:businessId/memo", async (req, res): Promise<void> => {
  const params = GetBusinessMemoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const context = await getBusinessWithContext(params.data.businessId);
  if (!context || !context.memo) {
    res.status(404).json({ error: "Investment memo not found" });
    return;
  }
  res.json(GetBusinessMemoResponse.parse(context.memo));
});

router.post("/businesses/:businessId/memo", async (req, res): Promise<void> => {
  const params = GenerateBusinessMemoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const memo = await generateMemoForBusiness(params.data.businessId);
  if (!memo) {
    res.status(404).json({ error: "Business target not found" });
    return;
  }
  const [saved] = await db
    .insert(memosTable)
    .values({
      businessId: params.data.businessId,
      ...memo,
    })
    .returning();
  const [business] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, params.data.businessId))
    .limit(1);
  await recordActivity({
    kind: "memo",
    title: "Investment memo generated",
    detail: `A new acquisition memo is ready for ${business?.name ?? "the target"}.`,
    businessId: params.data.businessId,
  });
  res.status(201).json(GenerateBusinessMemoResponse.parse(saved));
});

export default router;
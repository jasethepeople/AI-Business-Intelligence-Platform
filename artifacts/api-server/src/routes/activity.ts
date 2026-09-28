import { desc } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ListActivityQueryParams, ListActivityResponse } from "@workspace/api-zod";
import { db, activityTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const parsed = ListActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(parsed.data.limit ?? 20);
  res.json(ListActivityResponse.parse(rows));
});

export default router;
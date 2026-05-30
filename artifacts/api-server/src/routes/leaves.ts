import { Router } from "express";
import { db, leavesTable } from "@workspace/db";
import { eq, ilike, or, count, avg, and, gte, sql } from "drizzle-orm";
import {
  ListLeavesQueryParams,
  CreateLeaveBody,
  GetLeaveParams,
  DeleteLeaveParams,
  InquireLeaveQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/leaves/stats", async (req, res) => {
  try {
    const [totalResult] = await db.select({ count: count() }).from(leavesTable);
    const totalLeaves = Number(totalResult.count);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const [todayResult] = await db
      .select({ count: count() })
      .from(leavesTable)
      .where(sql`DATE(${leavesTable.createdAt}) = ${todayStr}`);
    const todayLeaves = Number(todayResult.count);

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const [monthResult] = await db
      .select({ count: count() })
      .from(leavesTable)
      .where(gte(leavesTable.createdAt, new Date(firstOfMonth)));
    const thisMonthLeaves = Number(monthResult.count);

    const [avgResult] = await db
      .select({ avg: avg(leavesTable.durationDays) })
      .from(leavesTable);
    const avgDuration = Number(avgResult.avg ?? 0);

    const recentLeaves = await db
      .select()
      .from(leavesTable)
      .orderBy(sql`${leavesTable.createdAt} DESC`)
      .limit(5);

    res.json({
      totalLeaves,
      todayLeaves,
      thisMonthLeaves,
      avgDuration: Math.round(avgDuration * 10) / 10,
      recentLeaves: recentLeaves.map(serializeLeave),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaves/inquiry", async (req, res) => {
  const parsed = InquireLeaveQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { idNumber, leaveCode } = parsed.data;
  try {
    const [leave] = await db
      .select()
      .from(leavesTable)
      .where(
        and(
          eq(leavesTable.idNumber, idNumber),
          eq(leavesTable.leaveCode, leaveCode)
        )
      );
    if (!leave) {
      res.status(404).json({ error: "Leave not found" });
      return;
    }
    res.json(serializeLeave(leave));
  } catch (err) {
    req.log.error({ err }, "Failed to inquire leave");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaves", async (req, res) => {
  const parsed = ListLeavesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { search, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const whereClause = search
      ? or(
          ilike(leavesTable.patientNameAr, `%${search}%`),
          ilike(leavesTable.patientNameEn, `%${search}%`),
          ilike(leavesTable.idNumber, `%${search}%`),
          ilike(leavesTable.leaveCode, `%${search}%`),
          ilike(leavesTable.hospitalNameAr, `%${search}%`)
        )
      : undefined;

    const [totalResult] = whereClause
      ? await db.select({ count: count() }).from(leavesTable).where(whereClause)
      : await db.select({ count: count() }).from(leavesTable);

    const data = whereClause
      ? await db
          .select()
          .from(leavesTable)
          .where(whereClause)
          .orderBy(sql`${leavesTable.createdAt} DESC`)
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(leavesTable)
          .orderBy(sql`${leavesTable.createdAt} DESC`)
          .limit(limit)
          .offset(offset);

    res.json({
      data: data.map(serializeLeave),
      total: Number(totalResult.count),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list leaves");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/leaves", async (req, res) => {
  const parsed = CreateLeaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  try {
    const admission = parsed.data.admissionDateGregorian;
    const discharge = parsed.data.dischargeDateGregorian;
    let durationDays = parsed.data.durationDays;
    if (!durationDays) {
      try {
        const [d, m, y] = admission.split("-").map(Number);
        const [d2, m2, y2] = discharge.split("-").map(Number);
        const a = new Date(y, m - 1, d);
        const b = new Date(y2, m2 - 1, d2);
        durationDays = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
      } catch {
        durationDays = 1;
      }
    }

    const [leave] = await db
      .insert(leavesTable)
      .values({ ...parsed.data, durationDays })
      .onConflictDoUpdate({
        target: leavesTable.leaveCode,
        set: { ...parsed.data, durationDays },
      })
      .returning();

    res.status(201).json(serializeLeave(leave));
  } catch (err) {
    req.log.error({ err }, "Failed to create leave");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaves/:id", async (req, res) => {
  const parsed = GetLeaveParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  try {
    const [leave] = await db
      .select()
      .from(leavesTable)
      .where(eq(leavesTable.id, parsed.data.id));
    if (!leave) {
      res.status(404).json({ error: "Leave not found" });
      return;
    }
    res.json(serializeLeave(leave));
  } catch (err) {
    req.log.error({ err }, "Failed to get leave");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/leaves/:id", async (req, res) => {
  const parsed = DeleteLeaveParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  try {
    await db.delete(leavesTable).where(eq(leavesTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete leave");
    res.status(500).json({ error: "Internal server error" });
  }
});

function serializeLeave(leave: typeof leavesTable.$inferSelect) {
  return {
    ...leave,
    createdAt: leave.createdAt.toISOString(),
  };
}

export default router;

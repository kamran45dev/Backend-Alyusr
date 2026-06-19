import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const activeOnly = req.query.active === "true";

  const batches = await prisma.batch.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      weeks: {
        include: {
          days: {
            select: {
              id: true,
              dayNumber: true,
              title: true,
              isLocked: true,
              deadline: true,
              submissions: user.role === "STUDENT" ? {
                where: { userId: user.id },
                select: { id: true, status: true, marks: true },
              } : undefined,
            },
            orderBy: { dayNumber: "asc" },
          },
        },
        orderBy: { weekNumber: "asc" },
      },
      enrollments: user.role === "STUDENT" ? { where: { userId: user.id } } : true,
      _count: user.role === "ADMIN" ? { select: { enrollments: true } } : undefined,
    },
    orderBy: { startDate: "desc" },
  });

  res.json(batches);
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { name, description, startDate, imageUrl, weeks } = req.body;

  const batch = await prisma.batch.create({
    data: {
      name,
      description,
      imageUrl: imageUrl || null,
      startDate: new Date(startDate),
      weeks: {
        create: weeks.map((w: any, wi: number) => ({
          weekNumber: wi + 1,
          title: w.title,
          days: {
            create: w.days.map((d: any, di: number) => ({
              dayNumber: di + 1,
              title: d.title,
              slides: JSON.stringify(d.slides || []),
              isLocked: di !== 0 || wi !== 0,
              unlockAt: wi === 0 && di === 0 ? new Date() : null,
              deadline: d.deadline ? new Date(d.deadline) : null,
            })),
          },
        })),
      },
    },
    include: { weeks: { include: { days: true } } },
  });

  res.json(batch);
});

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const batch = await prisma.batch.findUnique({
    where: { id: req.params.id },
    include: {
      weeks: {
        include: {
          days: {
            select: {
              id: true,
              weekId: true,
              dayNumber: true,
              title: true,
              slides: true,
              isLocked: true,
              unlockAt: true,
              deadline: true,
              submissions: req.user!.role === "ADMIN" ? {
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
              } : undefined,
            },
            orderBy: { dayNumber: "asc" },
          },
        },
        orderBy: { weekNumber: "asc" },
      },
      enrollments: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  if (!batch) return res.status(404).json({ error: "Not found" });
  res.json(batch);
});

router.patch("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { isActive, name, description, startDate, endDate, imageUrl } = req.body;
  const data: any = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (imageUrl !== undefined) data.imageUrl = imageUrl !== undefined ? imageUrl : undefined;

  const batch = await prisma.batch.update({
    where: { id: req.params.id },
    data,
  });
  res.json(batch);
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const batchId = req.params.id;

  const weeks = await prisma.week.findMany({
    where: { batchId },
    include: { days: { select: { id: true } } },
  });

  const dayIds = weeks.flatMap((w) => w.days.map((d) => d.id));

  if (dayIds.length > 0) {
    await prisma.submission.deleteMany({ where: { dayId: { in: dayIds } } });
    await prisma.day.deleteMany({ where: { id: { in: dayIds } } });
  }

  await prisma.week.deleteMany({ where: { batchId } });
  await prisma.message.deleteMany({ where: { batchId } });
  await prisma.enrollment.deleteMany({ where: { batchId } });
  await prisma.batch.delete({ where: { id: batchId } });

  res.json({ success: true });
});

// Add a new day to an existing week
router.post("/:batchId/weeks/:weekId/days", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { weekId } = req.params;
  const { title } = req.body;

  // Get current day count in this week to set dayNumber
  const existingDays = await prisma.day.findMany({
    where: { weekId },
    orderBy: { dayNumber: "asc" },
  });

  const nextDayNumber = existingDays.length + 1;

  const day = await prisma.day.create({
    data: {
      weekId,
      dayNumber: nextDayNumber,
      title: title || `Day ${nextDayNumber}`,
      slides: JSON.stringify([{ type: "title", content: title || `Day ${nextDayNumber}` }]),
      isLocked: true,
    },
  });

  res.json(day);
});

// Add a new week to an existing batch
router.post("/:batchId/weeks", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { batchId } = req.params;
  const { title } = req.body;

  const existingWeeks = await prisma.week.findMany({
    where: { batchId },
    orderBy: { weekNumber: "asc" },
  });

  const nextWeekNumber = existingWeeks.length + 1;

  const week = await prisma.week.create({
    data: {
      batchId,
      weekNumber: nextWeekNumber,
      title: title || `Week ${nextWeekNumber}`,
    },
    include: { days: true },
  });

  res.json(week);
});

export default router;
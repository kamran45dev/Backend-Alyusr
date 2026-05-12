import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { dayId, stackblitzUrl, textAnswer } = req.body;

  if (!stackblitzUrl?.includes("stackblitz.com")) {
    return res.status(400).json({ error: "Valid StackBlitz URL required" });
  }

  const day = await prisma.day.findUnique({
    where: { id: dayId },
    include: { week: true },
  });

  if (!day) return res.status(404).json({ error: "Day not found" });

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, batchId: day.week.batchId },
  });

  if (!enrollment) return res.status(403).json({ error: "Not enrolled" });

  const submission = await prisma.submission.upsert({
    where: { dayId_userId: { dayId, userId: user.id } },
    update: {
      stackblitzUrl,
      textAnswer: textAnswer || null,
      status: "PENDING",
      submittedAt: new Date(),
    },
    create: {
      dayId,
      userId: user.id,
      stackblitzUrl,
      textAnswer: textAnswer || null,
    },
  });

  // Unlock next day
  const nextDay = await prisma.day.findFirst({
    where: { weekId: day.weekId, dayNumber: day.dayNumber + 1 },
  });

  if (nextDay) {
    await prisma.day.update({
      where: { id: nextDay.id },
      data: { isLocked: false, unlockAt: new Date() },
    });
  }

  res.json(submission);
});

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { dayId, userId } = req.query as any;

  if (user.role !== "ADMIN" && userId && userId !== user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const submissions = await prisma.submission.findMany({
    where: {
      ...(dayId ? { dayId } : {}),
      ...(userId ? { userId } : { userId: user.id }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      day: { include: { week: { include: { batch: true } } } },
    },
    orderBy: { submittedAt: "desc" },
  });

  res.json(submissions);
});

export default router;

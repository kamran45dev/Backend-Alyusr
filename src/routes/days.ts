import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;

  const day = await prisma.day.findUnique({
    where: { id: req.params.id },
    include: {
      week: { include: { batch: true } },
      submissions: {
        where: { userId: user.id },
      },
    },
  }) as any;

  if (!day) return res.status(404).json({ error: "Not found" });

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, batchId: day.week.batchId },
  });

  if (!enrollment && user.role !== "ADMIN") {
    return res.status(403).json({ error: "Not enrolled" });
  }

  if (user.role === "STUDENT" && day.isLocked) {
    return res.status(403).json({ error: "Day is locked. Wait for admin to unlock." });
  }

  const now = new Date();
  const isExpired = day.deadline ? now > day.deadline : false;

  res.json({
    ...day,
    slides: JSON.parse(day.slides),
    isExpired,
  });
});

router.patch("/:id/unlock", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const day = await prisma.day.update({
    where: { id: req.params.id },
    data: { isLocked: false, unlockAt: new Date() },
  });
  res.json(day);
});

router.patch("/:id/lock", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const day = await prisma.day.update({
    where: { id: req.params.id },
    data: { isLocked: true, unlockAt: null },
  });
  res.json(day);
});

router.patch("/:id/deadline", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { deadline } = req.body;
  const day = await prisma.day.update({
    where: { id: req.params.id },
    data: { deadline: deadline ? new Date(deadline) : null } as any,
  });
  res.json(day);
});

router.patch("/:id/slides", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { slides, title } = req.body;

  if (!Array.isArray(slides)) {
    return res.status(400).json({ error: "Slides must be an array" });
  }

  const day = await prisma.day.update({
    where: { id: req.params.id },
    data: {
      slides: JSON.stringify(slides),
      ...(title ? { title } : {}),
    },
  });

  res.json({ ...day, slides: JSON.parse(day.slides) });
});

export default router;
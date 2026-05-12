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
  });

  if (!day) return res.status(404).json({ error: "Not found" });

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, batchId: day.week.batchId },
  });

  if (!enrollment && user.role !== "ADMIN") {
    return res.status(403).json({ error: "Not enrolled" });
  }

  // Students CANNOT access locked days at all
  if (user.role === "STUDENT" && day.isLocked) {
    return res.status(403).json({ error: "Day is locked. Wait for admin to unlock." });
  }

  res.json({ ...day, slides: JSON.parse(day.slides) });
});

// Admin unlocks a day
router.patch("/:id/unlock", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const day = await prisma.day.update({
    where: { id: req.params.id },
    data: { isLocked: false, unlockAt: new Date() },
  });
  res.json(day);
});

// Admin locks a day
router.patch("/:id/lock", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const day = await prisma.day.update({
    where: { id: req.params.id },
    data: { isLocked: true, unlockAt: null },
  });
  res.json(day);
});

export default router;
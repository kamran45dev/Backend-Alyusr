import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
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

  // Auto-unlock check for students
  if (user.role === "STUDENT" && day.isLocked) {
    const prevDay = await prisma.day.findFirst({
      where: {
        weekId: day.weekId,
        dayNumber: day.dayNumber - 1,
      },
      include: { submissions: { where: { userId: user.id } } },
    });

    if (prevDay && prevDay.submissions.length === 0) {
      return res.status(403).json({ error: "Complete previous day first" });
    }

    if (prevDay && prevDay.submissions.length > 0) {
      await prisma.day.update({ where: { id: day.id }, data: { isLocked: false } });
      day.isLocked = false;
    }
  }

  res.json({ ...day, slides: JSON.parse(day.slides) });
});

export default router;

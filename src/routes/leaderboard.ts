import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const { batchId } = req.query as any;
  const where = batchId ? { batchId } : {};

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, image: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  const leaderboard = await Promise.all(
    enrollments.map(async (enrollment) => {
      const submissions = await prisma.submission.findMany({
        where: { userId: enrollment.userId, status: "REVIEWED" },
        include: { day: true },
      });

      const totalMarks = submissions.reduce((acc, s) => acc + (s.marks || 0), 0);
      const completedDays = submissions.length;
      const averageMarks = completedDays > 0 ? Math.round(totalMarks / completedDays) : 0;

      return {
        rank: 0,
        userId: enrollment.userId,
        name: enrollment.user.name || "Anonymous",
        image: enrollment.user.image,
        batchName: enrollment.batch.name,
        totalMarks,
        completedDays,
        averageMarks,
      };
    })
  );

  leaderboard.sort((a, b) => b.totalMarks - a.totalMarks);
  leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

  res.json(leaderboard);
});

export default router;

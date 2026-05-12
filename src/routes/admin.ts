import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// Grade submission
router.post("/grade", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { submissionId, marks, feedback } = req.body;

  if (marks < 0 || marks > 100) {
    return res.status(400).json({ error: "Marks must be 0-100" });
  }

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      marks,
      feedback: feedback || null,
      status: "REVIEWED",
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      day: { include: { week: { include: { batch: true } } } },
    },
  });

  res.json(submission);
});

// Get batch progress
router.get("/progress", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { batchId } = req.query as any;
  if (!batchId) return res.status(400).json({ error: "batchId required" });

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      weeks: {
        include: {
          days: {
            include: {
              submissions: {
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
              },
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

  const studentProgress = batch.enrollments.map((enrollment) => {
    const userSubmissions = batch.weeks.flatMap((w) =>
      w.days.flatMap((d) => d.submissions.filter((s) => s.userId === enrollment.userId))
    );

    const totalDays = batch.weeks.reduce((acc, w) => acc + w.days.length, 0);
    const completedDays = userSubmissions.length;
    const totalMarks = userSubmissions.reduce((acc, s) => acc + (s.marks || 0), 0);
    const averageMarks = completedDays > 0 ? Math.round(totalMarks / completedDays) : 0;

    return {
      user: enrollment.user,
      completedDays,
      totalDays,
      progressPercent: Math.round((completedDays / totalDays) * 100),
      totalMarks,
      averageMarks,
      submissions: userSubmissions,
    };
  });

  res.json({ batch, studentProgress });
});

// Stats
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const [totalStudents, totalBatches, activeBatches, pendingSubmissions, totalSubmissions] =
    await prisma.$transaction([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.batch.count(),
      prisma.batch.count({ where: { isActive: true } }),
      prisma.submission.count({ where: { status: "PENDING" } }),
      prisma.submission.count(),
    ]);

  const recentSubmissions = await prisma.submission.findMany({
    take: 10,
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      day: { select: { title: true, week: { select: { batch: { select: { name: true } } } } } },
    },
  });

  res.json({
    totalStudents,
    totalBatches,
    activeBatches,
    pendingSubmissions,
    totalSubmissions,
    recentSubmissions,
  });
});

export default router;

import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { userId, batchId } = req.body;

  const existing = await prisma.enrollment.findUnique({
    where: { userId_batchId: { userId, batchId } },
  });

  if (existing) return res.status(400).json({ error: "Already enrolled" });

  const enrollment = await prisma.enrollment.create({
    data: { userId, batchId },
    include: { user: { select: { id: true, name: true, email: true } }, batch: true },
  });

  res.json(enrollment);
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  await prisma.enrollment.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// Get messages for a batch
router.get("/:batchId", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { batchId } = req.params;
  const { limit = "50", offset = "0" } = req.query as any;

  // Verify enrollment or admin
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, batchId },
  });

  if (!enrollment && user.role !== "ADMIN") {
    return res.status(403).json({ error: "Not enrolled in this batch" });
  }

  const messages = await prisma.message.findMany({
    where: { batchId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: parseInt(limit),
    skip: parseInt(offset),
  });

  res.json(messages.reverse());
});

// Post message (REST fallback)
router.post("/:batchId", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { batchId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) return res.status(400).json({ error: "Content required" });

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, batchId },
  });

  if (!enrollment && user.role !== "ADMIN") {
    return res.status(403).json({ error: "Not enrolled" });
  }

  const message = await prisma.message.create({
    data: { batchId, userId: user.id, content: content.trim() },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  res.json(message);
});

export default router;

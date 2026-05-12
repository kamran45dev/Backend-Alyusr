import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// Get all batches (student sees enrolled, admin sees all)
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const activeOnly = req.query.active === "true";

  const batches = await prisma.batch.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      weeks: {
        include: {
          days: { orderBy: { dayNumber: "asc" } },
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

// Create batch (admin only)
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { name, description, startDate, weeks } = req.body;

  const batch = await prisma.batch.create({
    data: {
      name,
      description,
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
            })),
          },
        })),
      },
    },
    include: { weeks: { include: { days: true } } },
  });

  res.json(batch);
});

// Get single batch
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const batch = await prisma.batch.findUnique({
    where: { id: req.params.id },
    include: {
      weeks: {
        include: {
          days: {
            include: {
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

// Toggle active
router.patch("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { isActive } = req.body;
  const batch = await prisma.batch.update({
    where: { id: req.params.id },
    data: { isActive },
  });
  res.json(batch);
});

// Delete batch
router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  await prisma.batch.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

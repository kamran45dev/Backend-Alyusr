import { Router } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { search } = req.query as any;

  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      OR: search ? [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ] : undefined,
    },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(users);
});

export default router;

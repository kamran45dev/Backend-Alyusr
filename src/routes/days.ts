import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { convertPptxToPng } from "pptx-glimpse";
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

  const slides = JSON.parse(day.slides);

  res.json({
    ...day,
    slides,
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

const pptxStorage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const pptxUpload = multer({
  storage: pptxStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    cb(null, file.mimetype === allowed);
  },
});

router.post("/:id/slides/pptx", authenticate, requireAdmin, pptxUpload.single("file"), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No valid PPTX file uploaded. Accepts .pptx files only, max 50MB." });
  }

  try {
    const pptxBuffer = fs.readFileSync(req.file.path);
    if (pptxBuffer.length < 4 || pptxBuffer[0] !== 0x50 || pptxBuffer[1] !== 0x4b) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Uploaded file is not a valid PPTX" });
    }
    const results = await convertPptxToPng(pptxBuffer, { width: 1920 });

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const newSlides: { type: string; content: string }[] = [];

    for (const slide of results) {
      const filename = `${crypto.randomBytes(16).toString("hex")}.png`;
      const filepath = path.join("uploads", filename);
      fs.writeFileSync(filepath, slide.png);
      newSlides.push({ type: "image", content: `${baseUrl}/uploads/${filename}` });
    }

    fs.unlinkSync(req.file.path);

    const day = await prisma.day.findUnique({ where: { id: req.params.id } });
    const existingSlides = day ? JSON.parse(day.slides) : [];

    const updated = await prisma.day.update({
      where: { id: req.params.id },
      data: { slides: JSON.stringify([...existingSlides, ...newSlides]) },
    });

    res.json({ slides: [...existingSlides, ...newSlides], totalSlides: newSlides.length });
  } catch (err) {
    console.error("PPTX conversion error:", err);
    res.status(500).json({ error: "Failed to convert PPTX file" });
  }
});

export default router;
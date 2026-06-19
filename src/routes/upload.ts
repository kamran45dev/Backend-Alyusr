import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PPTX_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const ALLOWED_TYPES = [...IMAGE_TYPES, PPTX_TYPE];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_TYPES.includes(file.mimetype));
  },
});

router.post("/", authenticate, upload.single("file"), (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No valid file uploaded. Allowed: png, jpg, webp, pptx" });
  }

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({ url });
});

export default router;
